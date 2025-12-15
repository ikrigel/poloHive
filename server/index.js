require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const Airtable = require('airtable');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Configure Airtable (optional)
let airtableBase = null;
if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
  airtableBase = base;
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const resp = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'poloHive-scraper/1.0' } });
    const $ = cheerio.load(resp.data);
    const text = $('body').text();
    // simple email regex
    const emails = Array.from(new Set((text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])));
    // Optionally store to Airtable
    if (airtableBase && emails.length) {
      const table = airtableBase(process.env.AIRTABLE_TABLE_NAME || 'Emails');
      const records = emails.slice(0,50).map(e => ({ fields: { Email: e, Source: url } }));
      table.create(records, (err, recs) => {
        if (err) console.error('Airtable create error', err);
      });
    }
    res.json({ emails });
  } catch (err) {
    console.error('scrape error', err.message || err);
    res.status(500).json({ error: 'scrape failed', details: err.message });
  }
});

// --- Advanced scrape job queue ---
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/16.1 Safari/605.1.15',
  'poloHive-bot/1.0 (+https://example.com)'
];

const jobs = {}; // jobId -> { status, result, startedAt, finishedAt }
const queue = [];
let active = 0;
const MAX_CONCURRENT = parseInt(process.env.SCRAPE_CONCURRENCY || '3');

function nextJob(){
  if (active >= MAX_CONCURRENT) return;
  const item = queue.shift();
  if (!item) return;
  active++;
  processJob(item).finally(() => { active--; setImmediate(nextJob); });
}

async function processJob({ jobId, url, maxDepth = 0, maxPages = 20, retries = 2 }){
  jobs[jobId].status = 'running';
  jobs[jobId].startedAt = new Date().toISOString();
  const seen = new Set();
  const emails = new Set();
  const toVisit = [url];

  while(toVisit.length && seen.size < maxPages){
    const u = toVisit.shift();
    if (!u) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    let attempt = 0;
    let success = false;
    while(attempt <= retries && !success){
      try{
        const ua = userAgents[Math.floor(Math.random()*userAgents.length)];
        const resp = await axios.get(u, { timeout: 15000, headers: { 'User-Agent': ua } });
        const $ = cheerio.load(resp.data);
        const text = $('body').text();
        (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).forEach(e => emails.add(e));
        // if depth > 0, collect same-origin links
        if (maxDepth > 0){
          const base = new URL(u);
          $('a[href]').each((i, a) => {
            try{
              const href = $(a).attr('href');
              if (!href) return;
              const full = new URL(href, base).toString();
              if (new URL(full).host === base.host && !seen.has(full) && toVisit.length + seen.size < maxPages) toVisit.push(full);
            }catch(e){ }
          });
        }
        success = true;
      }catch(err){
        attempt++;
        if (attempt > retries) console.error('job fetch failed', u, err.message || err);
      }
    }
  }

  const result = { emails: Array.from(emails), source: url };
  jobs[jobId].result = result;
  jobs[jobId].status = 'finished';
  jobs[jobId].finishedAt = new Date().toISOString();

  // store to Airtable if available
  if (airtableBase && result.emails.length){
    const table = airtableBase(process.env.AIRTABLE_TABLE_NAME || 'Emails');
    const records = result.emails.slice(0,100).map(e => ({ fields: { Email: e, Source: url, ScrapedAt: new Date().toISOString() } }));
    table.create(records, (err) => { if (err) console.error('Airtable create error', err); });
  }
}

app.post('/api/scrape/start', (req, res) => {
  const { url, maxDepth = 0, maxPages = 20 } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  const jobId = `job_${Date.now()}_${Math.floor(Math.random()*10000)}`;
  jobs[jobId] = { status: 'queued', createdAt: new Date().toISOString(), params: { url, maxDepth, maxPages } };
  queue.push({ jobId, url, maxDepth, maxPages });
  setImmediate(nextJob);
  res.json({ jobId });
});

app.get('/api/scrape/status/:id', (req, res) => {
  const j = jobs[req.params.id];
  if (!j) return res.status(404).json({ error: 'job not found' });
  res.json(j);
});

app.post('/api/send-email', async (req, res) => {
  const { to, subject, text, html, attachments } = req.body;
  if (!to) return res.status(400).json({ error: 'to required' });
  try {
    if (!process.env.SMTP_HOST) return res.status(500).json({ error: 'SMTP not configured' });
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
    const info = await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text, html, attachments });
    // optionally write send details to Airtable
    if (airtableBase) {
      const table = airtableBase(process.env.AIRTABLE_TABLE_NAME || 'Emails');
      table.create([{ fields: { Email: to, Subject: subject, SendDate: new Date().toISOString(), MessageId: info.messageId } }], (err) => { if (err) console.error(err); });
    }
    res.json({ ok: true, info });
  } catch (err) {
    console.error('send-email error', err);
    res.status(500).json({ error: 'send failed', details: err.message });
  }
});

// Simple 2FA demo endpoints (stores codes in-memory; for production use a persistent store)
const twoFaCodes = {}; // email -> { code, expires }

app.post('/api/2fa/send', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + (5 * 60 * 1000);
  twoFaCodes[email.toLowerCase()] = { code, expires };
  // Try sending via SMTP if configured
  if (process.env.SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Your poloHive 2FA code',
        text: `Your verification code is: ${code}`
      });
      return res.json({ ok: true, sent: true });
    } catch (err) {
      console.error('2FA send error', err);
    }
  }
  // If SMTP not configured, return the code in the response (development only)
  res.json({ ok: true, code });
});

app.post('/api/2fa/verify', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'email and code required' });
  const entry = twoFaCodes[email.toLowerCase()];
  if (!entry) return res.status(400).json({ error: 'no code found' });
  if (Date.now() > entry.expires) return res.status(400).json({ error: 'code expired' });
  if (entry.code !== String(code)) return res.status(400).json({ error: 'invalid code' });
  // success — remove used code
  delete twoFaCodes[email.toLowerCase()];
  res.json({ ok: true });
});

app.post('/api/ai/analyze', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  // Placeholder: implement provider integration (OpenAI, Anthropic, etc.)
  // For now return a simple sentiment guess based on keywords
  const low = text.toLowerCase();
  let intent = 'unknown';
  if (low.includes('thank')) intent = 'positive';
  if (low.includes('unsubscribe') || low.includes('stop')) intent = 'unsubscribe';
  res.json({ intent, summary: text.slice(0,200) });
});

// Airtable proxy endpoints
app.get('/api/airtable/records', async (req, res) => {
  if (!airtableBase) return res.status(500).json({ error: 'Airtable not configured' });
  try {
    const table = airtableBase(process.env.AIRTABLE_TABLE_NAME || 'Emails');
    const all = [];
    table.select({ pageSize: 100 }).eachPage((records, fetchNextPage) => {
      records.forEach(r => all.push({ id: r.id, fields: r.fields }));
      fetchNextPage();
    }, (err) => {
      if (err) { console.error(err); return res.status(500).json({ error: 'fetch failed' }); }
      res.json({ records: all });
    });
  } catch (err) {
    console.error('airtable fetch error', err);
    res.status(500).json({ error: 'airtable fetch failed' });
  }
});

app.patch('/api/airtable/records/:id', async (req, res) => {
  if (!airtableBase) return res.status(500).json({ error: 'Airtable not configured' });
  const { id } = req.params;
  const fields = req.body.fields || {};
  try {
    const table = airtableBase(process.env.AIRTABLE_TABLE_NAME || 'Emails');
    table.update([{ id, fields }], (err, records) => {
      if (err) { console.error(err); return res.status(500).json({ error: 'update failed' }); }
      res.json({ records: records.map(r => ({ id: r.id, fields: r.fields })) });
    });
  } catch (err) {
    console.error('airtable update error', err);
    res.status(500).json({ error: 'airtable update failed' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`poloHive server listening on ${port}`));

// DexHive-style Puppeteer scraper endpoint
const puppeteer = require('puppeteer');

app.post('/api/scrape/dexhive', async (req, res) => {
  const { baseUrl, startPage = 1, endPage = 1 } = req.body;
  if (!baseUrl) return res.status(400).json({ error: 'baseUrl required' });

  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    const allData = [];
    let headers = [];

    for (let pageNum = startPage; pageNum <= endPage; pageNum++){
      try{
        if (pageNum > startPage){
          await page.evaluate((num) => { window.location.hash = `page=${num}`; }, pageNum);
          await new Promise(r => setTimeout(r, 3500));
          await page.waitForSelector('table', { timeout: 30000 });
        }

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
                if (!headers.includes(fieldLabel)) headers.push(fieldLabel);
              }
            }
          });
          if (hasData) allData.push(entryData);
        });

        // polite delay
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error('dexhive page error', pageNum, err.message || err);
      }
    }

    await browser.close();

    // store rows to Airtable if configured
    if (airtableBase && allData.length){
      const table = airtableBase(process.env.AIRTABLE_TABLE_NAME || 'Emails');
      const records = allData.slice(0,200).map(row => ({ fields: { JSON: JSON.stringify(row), ScrapedAt: new Date().toISOString() } }));
      table.create(records, (err) => { if (err) console.error('Airtable create error', err); });
    }

    res.json({ rows: allData, headers });
  } catch (err) {
    console.error('dexhive scrape failed', err);
    res.status(500).json({ error: 'scrape failed', details: err.message || String(err) });
  }
});
