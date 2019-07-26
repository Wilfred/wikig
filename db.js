const sqlite3 = require("sqlite3").verbose();

// This will create the file if it doesn't exist.
const db = new sqlite3.Database(process.env.DB_PATH || "wikig.db");

function init(cb) {
  db.serialize(function() {
    db.run(`
CREATE TABLE pages (
  name VARCHAR(1024),
  content TEXT NOT NULL,
  created DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
)`);
    db.run("CREATE UNIQUE INDEX idx_name ON pages(name)", cb);
  });
}

function getPageByName(name, callback) {
  db.get(
    `SELECT rowid, name, content, created, updated
     FROM pages WHERE name = ?`,
    [name],
    callback
  );
}

function getPage(rowid, callback) {
  db.get(
    `SELECT rowid, name, content, created, updated
     FROM pages WHERE rowid = ?`,
    [rowid],
    callback
  );
}

function updatePage(rowid, name, content, callback) {
  // Based on https://stackoverflow.com/a/4330694/509706
  db.get(
    `UPDATE pages SET name = ?, content = ?
     WHERE rowid = ?`,
    [name, content, rowid],
    callback
  );
}

function createPage(name, content, callback) {
  // Based on https://stackoverflow.com/a/4330694/509706
  db.get(
    `INSERT INTO pages (name, content) VALUES(?, ?)`,
    [name, content],
    callback
  );
}

module.exports = {
  init: init,
  getPage: getPage,
  getPageByName: getPageByName,
  createPage: createPage,
  updatePage: updatePage
};
