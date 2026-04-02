import sqlite3 from "sqlite3";

sqlite3.verbose();

let db: sqlite3.Database;
if (process.env.IN_MEMORY_DB) {
  db = new sqlite3.Database(":memory:");
} else {
  // This will create the file if it doesn't exist.
  db = new sqlite3.Database(process.env.DB_PATH || "wikig.db");
}

export type Page = {
  page_id: number;
  name: string;
  content: string;
  created: string;
  updated: string;
};

type Param = string | number | null;

function run(sql: string, params: Param[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err: Error | null) => (err ? reject(err) : resolve()));
  });
}

function get<T>(sql: string, params: Param[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err: Error | null, row: T | undefined) =>
      err ? reject(err) : resolve(row),
    );
  });
}

function all<T>(sql: string, params: Param[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: Error | null, rows: T[]) =>
      err ? reject(err) : resolve(rows),
    );
  });
}

export async function init(): Promise<void> {
  await run(`
CREATE TABLE pages (
  page_id INTEGER PRIMARY KEY,
  name VARCHAR(1024) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
)`);

  // TODO: Enable foreign key constraints.
  // https://stackoverflow.com/q/15301643/509706
  await run(`
CREATE TABLE page_revisions (
  revision_id INTEGER PRIMARY KEY,
  name VARCHAR(1024) NOT NULL,
  content TEXT NOT NULL,
  created DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  page_id INTEGER NOT NULL,
  FOREIGN KEY (page_id) references pages(page_id)
)`);
}

export function allPages(): Promise<Page[]> {
  return all<Page>(
    `SELECT rowid, name, created, updated, content
     FROM pages
     ORDER BY updated DESC`,
  );
}

export function allPageNames(): Promise<{ name: string }[]> {
  return all<{ name: string }>(
    `SELECT name
     FROM pages`,
  );
}

export function getPageByName(name: string): Promise<Page | undefined> {
  return get<Page>(
    `SELECT page_id, name, content, created, updated
     FROM pages WHERE name = ?`,
    [name],
  );
}

export function getPage(rowid: number | string): Promise<Page | undefined> {
  return get<Page>(
    `SELECT page_id, name, content, created, updated
     FROM pages WHERE rowid = ?`,
    [rowid],
  );
}

export async function updatePage(
  pageid: number | string,
  name: string,
  content: string,
): Promise<void> {
  // Based on https://stackoverflow.com/a/4330694/509706
  await run(
    `INSERT INTO page_revisions (page_id, name, content) VALUES(?, ?, ?)`,
    [pageid, name, content],
  );
  await run(
    `UPDATE pages SET name = ?, content = ?, updated = ?
     WHERE page_id = ?`,
    [name, content, new Date().toISOString(), pageid],
  );
}

// Create a page with this name and content, then return the newly
// created page.
export async function createPage(name: string, content: string): Promise<Page> {
  // Based on https://stackoverflow.com/a/4330694/509706
  await run(`INSERT INTO pages (name, content) VALUES(?, ?)`, [name, content]);
  const page = await getPageByName(name);
  if (!page) {
    throw new Error(`Page ${name} was not found after insertion`);
  }
  return page;
}
