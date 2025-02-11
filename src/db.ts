import sqlite3 from "sqlite3";

sqlite3.verbose();

let db: sqlite3.Database;
if (process.env.IN_MEMORY_DB) {
  db = new sqlite3.Database(":memory:");
} else {
  // This will create the file if it doesn't exist.
  db = new sqlite3.Database(process.env.DB_PATH || "wikig.db");
}

type Page = {
  page_id: number;
  name: string;
  content: string;
  created: string;
  updated: string;
};

export function init(
  cb: (this: sqlite3.RunResult, err: Error | null) => void,
): void {
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
      cb,
    );
  });
}

export function allPages(
  callback: (this: sqlite3.Statement, err: Error | null, rows: Page[]) => void,
) {
  db.all(
    `SELECT rowid, name, created, updated, content
     FROM pages
     ORDER BY updated DESC`,
    callback,
  );
}

export function allPageNames(
  callback: (
    this: sqlite3.Statement,
    err: Error | null,
    rows: { name: string }[],
  ) => void,
) {
  db.all(
    `SELECT name
     FROM pages`,
    callback,
  );
}

export function getPageByName(
  name: string,
  callback: (this: sqlite3.Statement, err: Error | null, row: Page) => void,
) {
  db.get(
    `SELECT page_id, name, content, created, updated
     FROM pages WHERE name = ?`,
    [name],
    callback,
  );
}

export function getPage(
  rowid: any,
  callback: (this: sqlite3.Statement, err: Error | null, row: Page) => void,
) {
  db.get(
    `SELECT page_id, name, content, created, updated
     FROM pages WHERE rowid = ?`,
    [rowid],
    callback,
  );
}

export function updatePage(
  pageid: any,
  name: string,
  content: string,
  callback: (this: sqlite3.Statement, err: Error | null, result: any) => void,
) {
  // Based on https://stackoverflow.com/a/4330694/509706
  db.get(
    `INSERT INTO page_revisions (page_id, name, content) VALUES(?, ?, ?)`,
    [pageid, name, content],
    () =>
      db.get(
        `UPDATE pages SET name = ?, content = ?, updated = ?
     WHERE page_id = ?`,
        [name, content, new Date().toISOString(), pageid],
        callback,
      ),
  );
}

// Create a page with this name and content, then return the newly
// created page.
export function createPage(
  name: string,
  content: string,
  callback: (this: sqlite3.Statement, err: Error | null, row: Page) => void,
) {
  // Based on https://stackoverflow.com/a/4330694/509706
  db.run(
    `INSERT INTO pages (name, content) VALUES(?, ?)`,
    [name, content],
    (err) => {
      if (err) {
        return err;
      }
      return getPageByName(name, callback);
    },
  );
}
