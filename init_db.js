const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("wikig.db");

const fs = require("fs"),
  path = require("path");

const homePageContent = fs.readFileSync(path.join(__dirname, "concept.md"), {
  encoding: "utf8"
});

db.serialize(function() {
  db.run("CREATE TABLE pages (name VARCHAR(1024), content TEXT NOT NULL)");
  db.run("CREATE UNIQUE INDEX name ON pages(name)");

  const stmt = db.prepare("INSERT INTO pages (name, content) VALUES (?, ?)");
  stmt.run("HomePage", homePageContent);
  stmt.finalize();

  db.each("SELECT rowid AS id, name, content FROM pages", function(err, row) {
    console.log(row.id + ": " + row.name + " : " + row.content);
  });
});

db.close();
