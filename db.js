const sqlite3 = require("sqlite3").verbose();

// This will create the file if it doesn't exist.
const db = new sqlite3.Database(process.env.DB_PATH || "wikig.db");

const fs = require("fs"),
  path = require("path");

const homePageContent = fs.readFileSync(path.join(__dirname, "concept.md"), {
  encoding: "utf8"
});

function needsInit(cb) {
  db.get(
    "select count(name) as count from sqlite_master where type='table'",
    function(err, tables) {
      cb(tables.count === 0);
    }
  );
}

function init(cb) {
  needsInit(needed => {
    db.serialize(function() {
      if (needed) {
        db.run(
          "CREATE TABLE pages (name VARCHAR(1024), content TEXT NOT NULL)"
        );
        db.run("CREATE UNIQUE INDEX idx_name ON pages(name)");

        const stmt = db.prepare(
          "INSERT INTO pages (name, content) VALUES (?, ?)"
        );
        stmt.run("HomePage", homePageContent, cb);
      } else {
        cb();
      }
    });
  });
}

function getPage(name, callback) {
  db.get("SELECT name, content FROM pages WHERE name = ?", [name], callback);
}

function updatePage(name, content, callback) {
  db.get(
    "INSERT OR REPLACE INTO pages (name, content) VALUES(?, ?)",
    [name, content],
    callback
  );
}

module.exports = {
  init: init,
  needsInit: needsInit,
  getPage: getPage,
  updatePage: updatePage
};
