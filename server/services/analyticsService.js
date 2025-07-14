const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const getAnalyticsData = async () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, original_url, short_code, label, created_at, clicks FROM urls`,
      [],
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return reject(err);
        }
        resolve(rows.map(row => ({
          id: row.id,
          original_url: row.original_url,
          short_code: row.short_code,
          label: row.label,
          created_at: row.created_at,
          clicks: row.clicks
        })));
      }
    );
  });
};

module.exports = { getAnalyticsData };