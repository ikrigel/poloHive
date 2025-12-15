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

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`poloHive server listening on ${port}`));
