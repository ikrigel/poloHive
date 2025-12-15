const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'jobs.db');
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    url TEXT,
    params TEXT,
    status TEXT,
    result TEXT,
    createdAt TEXT,
    startedAt TEXT,
    finishedAt TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jobId TEXT,
    record TEXT,
    createdAt TEXT
  )`);
});

module.exports = {
  db,
  createJob: (job) => new Promise((res, rej) => {
    const stmt = db.prepare('INSERT INTO jobs(id,url,params,status,createdAt) VALUES(?,?,?,?,?)');
    stmt.run(job.id, job.url, JSON.stringify(job.params||{}), job.status||'queued', job.createdAt||new Date().toISOString(), function(err){ if (err) return rej(err); res(job); });
  }),
  updateJobStatus: (id, fields) => new Promise((res, rej) => {
    const allowed = ['status','result','startedAt','finishedAt','params','url'];
    const sets = [];
    const vals = [];
    for (const k of Object.keys(fields)){
      if (!allowed.includes(k)) continue;
      sets.push(`${k} = ?`);
      vals.push(typeof fields[k] === 'string' ? fields[k] : JSON.stringify(fields[k]));
    }
    if (sets.length === 0) return res();
    vals.push(id);
    db.run(`UPDATE jobs SET ${sets.join(',')} WHERE id = ?`, vals, function(err){ if (err) return rej(err); res(); });
  }),
  getJob: (id) => new Promise((res, rej) => db.get('SELECT * FROM jobs WHERE id = ?', [id], (e,r)=> e?rej(e):res(r))),
  fetchNextQueued: () => new Promise((res, rej) => db.get("SELECT * FROM jobs WHERE status='queued' ORDER BY createdAt LIMIT 1", (e,r)=> e?rej(e):res(r))),
  insertResult: (jobId, record) => new Promise((res, rej) => {
    const stmt = db.prepare('INSERT INTO results(jobId,record,createdAt) VALUES(?,?,?)');
    stmt.run(jobId, JSON.stringify(record), new Date().toISOString(), function(err){ if (err) return rej(err); res(this.lastID); });
  }),
  getResultsForJob: (jobId) => new Promise((res, rej) => db.all('SELECT * FROM results WHERE jobId = ?', [jobId], (e,r)=> e?rej(e):res(r)))
};
