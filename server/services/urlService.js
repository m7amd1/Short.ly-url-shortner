const sqlite3 = require("sqlite3").verbose();
const { nanoid } = require("nanoid");
const db = new sqlite3.Database("./database.sqlite");

const createShortUrl = async (originalUrl, label) => {
  return new Promise((resolve, reject) => {
    const shortCode = nanoid(6);
    const createdAt = new Date().toISOString();
    db.run(
      `INSERT INTO urls (original_url, short_code, label, created_at, clicks) VALUES (?, ?, ?, ?, ?)`,
      [originalUrl, shortCode, label || null, createdAt, 0],
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve({
          id: this.lastID,
          originalUrl,
          shortUrl: `http://localhost:3000/${shortCode}`,
          shortCode,
          label: label || null,
          createdAt,
          clicks: 0,
        });
      }
    );
  });
};

const getOriginalUrl = async (shortCode) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT original_url FROM urls WHERE short_code = ?`,
      [shortCode],
      (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row ? { original_url: row.original_url } : null);
      }
    );
  });
};

const getUrlByCode = async (shortCode) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, original_url, short_code, label, created_at, clicks FROM urls WHERE short_code = ?`,
      [shortCode],
      (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(
          row
            ? {
                id: row.id,
                original_url: row.original_url,
                short_code: row.short_code,
                label: row.label,
                created_at: row.created_at,
                clicks: row.clicks,
              }
            : null
        );
      }
    );
  });
};

const incrementClicks = async (shortCode) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?`,
      [shortCode],
      (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      }
    );
  });
};

const getAllUrls = async () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, original_url, short_code, label, created_at, clicks FROM urls`,
      [],
      (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(
          rows.map((row) => ({
            id: row.id,
            original_url: row.original_url,
            short_code: row.short_code,
            label: row.label,
            created_at: row.created_at,
            clicks: row.clicks,
          }))
        );
      }
    );
  });
};

const deleteUrl = async (id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM urls WHERE id = ?`, [id], (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

const updateUrl = async (id, label, originalUrl) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE urls SET label = ?, original_url = ? WHERE id = ?`,
      [label || null, originalUrl, id],
      (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      }
    );
  });
};

module.exports = {
  createShortUrl,
  getOriginalUrl,
  getUrlByCode,
  incrementClicks,
  getAllUrls,
  deleteUrl,
  updateUrl,
};
