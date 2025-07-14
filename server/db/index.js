const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = path.join(__dirname, "../../database.sqlite");
const db = new sqlite3.Database(DB_PATH);

const testConnection = () => {
  return new Promise((resolve, reject) => {
    db.get("SELECT 1", (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

module.exports = {
  db,
  testConnection,
};
