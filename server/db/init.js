const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../../database.sqlite');

const initializeTable = async () => {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_url TEXT NOT NULL,
        short_code TEXT NOT NULL UNIQUE,
        label TEXT,
        created_at TEXT NOT NULL,
        clicks INTEGER DEFAULT 0
      )`,
      (err) => {
        if (err) {
          console.error('Error creating urls table:', err.message);
          return reject(err);
        }
        console.log('urls table created or already exists');
        resolve();
      }
    );
  });
};

const migrate = async () => {
  const migrations = [
    // Add label column if it doesn't exist
    `ALTER TABLE urls ADD COLUMN label TEXT`,
    // Add user_id column if needed (commented out as not used in current codebase)
    // `ALTER TABLE urls ADD COLUMN user_id INTEGER`
  ];

  for (const migration of migrations) {
    try {
      await new Promise((resolve, reject) => {
        db.run(migration, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error(`Migration failed: ${migration}`, err.message);
            reject(err);
          } else {
            console.log(`Migration applied: ${migration}`);
            resolve();
          }
        });
      });
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        throw err;
      }
    }
  }
};

const createAdminUser = async () => {
  console.log('Admin user creation skipped (not implemented)');
};

db.serialize(async () => {
  try {
    await initializeTable();
    await migrate();
    await createAdminUser();
    console.log('✅ Database migrated successfully');
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        process.exit(1);
      }
      console.log('Database connection closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Database migration failed:', err);
    db.close();
    process.exit(1);
  }
});