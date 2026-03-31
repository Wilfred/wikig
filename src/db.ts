import { promisify } from "util";
import sqlite3 from "sqlite3";

sqlite3.verbose();

let db: sqlite3.Database;
if (process.env.IN_MEMORY_DB) {
  db = new sqlite3.Database(":memory:");
} else {
  // This will create the file if it doesn't exist.
  db = new sqlite3.Database(process.env.DB_PATH || "wikig.db");
}

const dbRun = promisify<string, any[]>(
  db.run.bind(db) as (sql: string, params: any[], cb: (err: Error | null) => void) => void,
);
const dbGet = promisify<string, any[], any>(
  db.get.bind(db) as (sql: string, params: any[], cb: (err: Error | null, row: any) => void) => void,
);
const dbAll = promisify<string, any[]>(
  db.all.bind(db) as (sql: string, cb: (err: Error | null, rows: any[]) => void) => void,
);

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

export async function allPages(): Promise<Page[]> {
  return (await dbAll(
    `SELECT rowid, name, created, updated, content
     FROM pages
     ORDER BY updated DESC`,
  )) as Page[];
}

export async function allPageNames(): Promise<{ name: string }[]> {
  return (await dbAll(
    `SELECT name
     FROM pages`,
  )) as { name: string }[];
}

export async function getPageByName(
  name: string,
): Promise<Page | undefined> {
  return (await dbGet(
    `SELECT page_id, name, content, created, updated
     FROM pages WHERE name = ?`,
    [name],
  )) as Page | undefined;
}

export async function getPage(rowid: any): Promise<Page | undefined> {
  return (await dbGet(
    `SELECT page_id, name, content, created, updated
     FROM pages WHERE rowid = ?`,
    [rowid],
  )) as Page | undefined;
}

export async function updatePage(
  pageid: any,
  name: string,
  content: string,
): Promise<void> {
  // Based on https://stackoverflow.com/a/4330694/509706
  await dbGet(
    `INSERT INTO page_revisions (page_id, name, content) VALUES(?, ?, ?)`,
    [pageid, name, content],
  );
  await dbGet(
    `UPDATE pages SET name = ?, content = ?, updated = ?
     WHERE page_id = ?`,
    [name, content, new Date().toISOString(), pageid],
  );
}

// Create a page with this name and content, then return the newly
// created page.
export async function createPage(
  name: string,
  content: string,
): Promise<Page> {
  // Based on https://stackoverflow.com/a/4330694/509706
  await dbRun(
    `INSERT INTO pages (name, content) VALUES(?, ?)`,
    [name, content],
  );
  const page = await getPageByName(name);
  return page!;
}
