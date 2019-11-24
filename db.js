const sqlite3 = require("sqlite3").verbose();

let db;
if (process.env.IN_MEMORY_DB) {
  db = new sqlite3.Database(":memory:");
} else {
  // This will create the file if it doesn't exist.
  db = new sqlite3.Database(process.env.DB_PATH || "wikig.db");
}

function init(cb) {
  db.serialize(() => {
    db.run(`
CREATE TABLE pages (
  page_id INTEGER PRIMARY KEY,
  name VARCHAR(1024) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
)`);

    // TODO: Enable foreign key constraints.
    // https://stackoverflow.com/q/15301643/509706
    db.run(
      `
CREATE TABLE page_revisions (
  revision_id INTEGER PRIMARY KEY,
  name VARCHAR(1024) NOT NULL,
  content TEXT NOT NULL,
  created DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  page_id INTEGER NOT NULL,
  FOREIGN KEY (page_id) references pages(page_id)
)`,
      cb
    );
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

function allPageNames(callback) {
  db.all(
    `SELECT name
     FROM pages`,
    callback
  );
}

function getPageByName(name, callback) {
  db.get(
    `SELECT page_id, name, content, created, updated
     FROM pages WHERE name = ?`,
    [name],
    callback
  );
}

function getPage(rowid, callback) {
  db.get(
    `SELECT page_id, name, content, created, updated
     FROM pages WHERE rowid = ?`,
    [rowid],
    callback
  );
}

function updatePage(pageid, name, content, callback) {
  // Based on https://stackoverflow.com/a/4330694/509706
  db.get(
    `INSERT INTO page_revisions (page_id, name, content) VALUES(?, ?, ?)`,
    [pageid, name, content],
    () =>
      db.get(
        `UPDATE pages SET name = ?, content = ?, updated = ?
     WHERE page_id = ?`,
        [name, content, new Date().toISOString(), pageid],
        callback
      )
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
  init,
  allPages,
  allPageNames,
  getPage,
  getPageByName,
  createPage,
  updatePage
};
