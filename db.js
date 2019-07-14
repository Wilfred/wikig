const sqlite3 = require("sqlite3").verbose();

// This will create the file if it doesn't exist.
const db = new sqlite3.Database(process.env.DB_PATH || "wikig.db");

const fs = require("fs"),
  path = require("path");

const homePageContent = fs.readFileSync(path.join(__dirname, "concept.md"), {
  encoding: "utf8"
});

function init(cb) {
  db.serialize(function() {
    db.run(`
CREATE TABLE pages (
  name VARCHAR(1024),
  content TEXT NOT NULL,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
    db.run("CREATE UNIQUE INDEX idx_name ON pages(name)");

    const stmt = db.prepare("INSERT INTO pages (name, content) VALUES (?, ?)");
    stmt.run("HomePage", homePageContent, cb);
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
  getPage: getPage,
  updatePage: updatePage
};
