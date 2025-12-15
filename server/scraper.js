const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const robotsParser = require('robots-parser');

const robotsCache = new Map();
const hostLastRequest = new Map();

async function scrapeDexHive({ baseUrl, startPage=1, endPage=1, delayMs=1000, proxy=null, userAgent=null, minHostDelayMs=1000 }){
  const launchArgs = ['--no-sandbox','--disable-setuid-sandbox'];
  if (proxy) launchArgs.push(`--proxy-server=${proxy}`);
  const browser = await puppeteer.launch({ headless: true, args: launchArgs });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  const ua = userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  await page.setUserAgent(ua);

  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  const allData = [];
  const headers = new Set();

  for (let pageNum = startPage; pageNum <= endPage; pageNum++){
    try{
      if (pageNum > startPage){
        await page.evaluate((num) => { window.location.hash = `page=${num}`; }, pageNum);
        await new Promise(r => setTimeout(r, 3500));
        await page.waitForSelector('table', { timeout: 30000 });
      }
      const currentUrl = page.url();

      // robots.txt check
      try{
        const urlObj = new URL(currentUrl);
        const robotsKey = `${urlObj.protocol}//${urlObj.host}`;
        let parser = robotsCache.get(robotsKey);
        if (!parser){
          try{
            const robotsTxtUrl = `${robotsKey}/robots.txt`;
            const rresp = await fetch(robotsTxtUrl, { timeout: 5000 });
            const body = rresp.ok ? await rresp.text() : '';
            parser = robotsParser(robotsTxtUrl, body);
          }catch(e){ parser = robotsParser(`${robotsKey}/robots.txt`, ''); }
          robotsCache.set(robotsKey, parser);
        }
        const allowed = parser.isAllowed(currentUrl, 'poloHive-bot') || parser.isAllowed(currentUrl, ua) || parser.isAllowed(currentUrl, '*');
        if (!allowed){
          console.warn('Blocked by robots.txt', currentUrl);
          continue;
        }
      }catch(e){ /* ignore robots errors */ }

      // per-host rate limiting
      try{
        const host = new URL(currentUrl).host;
        const last = hostLastRequest.get(host) || 0;
        const waitFor = Math.max(0, minHostDelayMs - (Date.now() - last));
        if (waitFor > 0) await new Promise(r => setTimeout(r, waitFor));
        hostLastRequest.set(host, Date.now());
      }catch(e){}

      const htmlContent = await page.content();
      const $ = cheerio.load(htmlContent);

      $('table.shrink').each((_, table) => {
        const entryData = {};
        let hasData = false;
        $(table).find('tbody tr').each((_, row) => {
          const cells = $(row).find('td');
          if (cells.length === 2){
            const fieldLabel = $(cells[0]).find('div').first().text().trim();
            const fieldValue = $(cells[1]).text().trim();
            if (fieldLabel && fieldValue){
              entryData[fieldLabel] = fieldValue;
              hasData = true;
              headers.add(fieldLabel);
            }
          }
        });
        if (hasData) allData.push(entryData);
      });

      await new Promise(r => setTimeout(r, delayMs));
    } catch(err){
      console.error('scraper page error', pageNum, err.message || err);
    }
  }

  await browser.close();
  return { rows: allData, headers: Array.from(headers) };
}

module.exports = { scrapeDexHive };
