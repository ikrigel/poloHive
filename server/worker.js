const { db, fetchNextQueued, updateJobStatus, insertResult } = require('./db');
const { scrapeDexHive } = require('./scraper');
const airtableBase = require('./index').airtableBase; // circular but index exports airtableBase

// proxy rotation
const PROXIES = process.env.PROXIES ? process.env.PROXIES.split(',').map(s=>s.trim()).filter(Boolean) : [];

function pickProxy(jobParams){
  if (jobParams && jobParams.proxy) return jobParams.proxy;
  if (PROXIES.length === 0) return null;
  // simple random rotation
  return PROXIES[Math.floor(Math.random()*PROXIES.length)];
}

let running = false;

async function runWorker(){
  if (running) return;
  running = true;
  while(true){
    try{
      const job = await fetchNextQueued();
      if (!job){ await new Promise(r=>setTimeout(r, 2000)); continue; }
      const { id, url, params } = job;
      await updateJobStatus(id, { status: 'running', startedAt: new Date().toISOString() });

      const jobParams = JSON.parse(params||'{}');
      const proxy = pickProxy(jobParams);
      const cfg = Object.assign({ baseUrl: url }, jobParams, { proxy, minHostDelayMs: parseInt(process.env.SCRAPE_MIN_DELAY_MS || '1000') });
      const result = await scrapeDexHive(cfg);

      // store each row as a result and optionally to airtable
      for (const row of result.rows){
        await insertResult(id, row);
      }

      // Airtable write
      if (airtableBase && result.rows && result.rows.length){
        const table = airtableBase(process.env.AIRTABLE_TABLE_NAME || 'Emails');
        const recs = result.rows.slice(0,200).map(r => ({ fields: { JSON: JSON.stringify(r), ScrapedAt: new Date().toISOString() } }));
        table.create(recs, (err) => { if (err) console.error('Airtable create error', err); });
      }

      await updateJobStatus(id, { status: 'finished', result: JSON.stringify(result), finishedAt: new Date().toISOString() });
    }catch(err){ console.error('worker error', err); await new Promise(r=>setTimeout(r,2000)); }
  }
}

module.exports = { runWorker };
