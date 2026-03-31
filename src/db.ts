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

export function init(): Promise<void> {
  return new Promise((resolve, reject) => {
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
        (err) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });
  });
}

export function allPages(): Promise<Page[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT rowid, name, created, updated, content
     FROM pages
     ORDER BY updated DESC`,
      (err, rows: Page[]) => {
        if (err) reject(err);
        else resolve(rows);
      },
    );
  });
}

export function allPageNames(): Promise<{ name: string }[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT name
     FROM pages`,
      (err, rows: { name: string }[]) => {
        if (err) reject(err);
        else resolve(rows);
      },
    );
  });
}

export function getPageByName(name: string): Promise<Page | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT page_id, name, content, created, updated
     FROM pages WHERE name = ?`,
      [name],
      (err, row: Page | undefined) => {
        if (err) reject(err);
        else resolve(row);
      },
    );
  });
}

export function getPage(rowid: any): Promise<Page | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT page_id, name, content, created, updated
     FROM pages WHERE rowid = ?`,
      [rowid],
      (err, row: Page | undefined) => {
        if (err) reject(err);
        else resolve(row);
      },
    );
  });
}

export async function updatePage(
  pageid: any,
  name: string,
  content: string,
): Promise<void> {
  // Based on https://stackoverflow.com/a/4330694/509706
  await new Promise<void>((resolve, reject) => {
    db.get(
      `INSERT INTO page_revisions (page_id, name, content) VALUES(?, ?, ?)`,
      [pageid, name, content],
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
  await new Promise<void>((resolve, reject) => {
    db.get(
      `UPDATE pages SET name = ?, content = ?, updated = ?
     WHERE page_id = ?`,
      [name, content, new Date().toISOString(), pageid],
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
}

// Create a page with this name and content, then return the newly
// created page.
export async function createPage(
  name: string,
  content: string,
): Promise<Page> {
  // Based on https://stackoverflow.com/a/4330694/509706
  await new Promise<void>((resolve, reject) => {
    db.run(
      `INSERT INTO pages (name, content) VALUES(?, ?)`,
      [name, content],
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
  const page = await getPageByName(name);
  return page!;
}
