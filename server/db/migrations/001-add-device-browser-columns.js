const { db } = require("../index");

const migrate = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `
        ALTER TABLE clicks ADD COLUMN device TEXT;
      `,
        (err) => {
          if (err) return reject(err);

          db.run(
            `
          ALTER TABLE clicks ADD COLUMN browser TEXT;
        `,
            (err) => {
              if (err) return reject(err);
              resolve();
            }
          );
        }
      );
    });
  });
};

migrate()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
