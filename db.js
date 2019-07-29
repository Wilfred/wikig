const sqlite3 = require("sqlite3").verbose();

let db;
if (process.env.IN_MEMORY_DB) {
  db = new sqlite3.Database(":memory:");
} else {
  // This will create the file if it doesn't exist.
  db = new sqlite3.Database(process.env.DB_PATH || "wikig.db");
}

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

function allPages(callback) {
  db.all(
    `SELECT rowid, name, created, updated
     FROM pages
     ORDER BY updated DESC`,
    callback
  );
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

// Create a page with this name and content, then return the newly
// created page.
function createPage(name, content, callback) {
  // Based on https://stackoverflow.com/a/4330694/509706
  db.run(
    `INSERT INTO pages (name, content) VALUES(?, ?)`,
    [name, content],
    err => {
      if (err) {
        return err;
      }
      return getPageByName(name, callback);
    }
  );
}

module.exports = {
  init: init,
  allPages: allPages,
  getPage: getPage,
  getPageByName: getPageByName,
  createPage: createPage,
  updatePage: updatePage
};
