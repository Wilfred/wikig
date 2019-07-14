const commonmark = require("commonmark");
const wikiWordsTransform = require("commonmark-wikiwords");
const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");

const db = require("./db");

const app = express();
app.engine(".html", exphbs({ extname: ".html" }));
app.set("view engine", ".html");

function renderMarkdown(src) {
  const reader = new commonmark.Parser();
  const writer = new commonmark.HtmlRenderer();
  // parsed is a 'Node' tree
  const parsed = reader.parse(src);

  return writer.render(wikiWordsTransform(parsed));
}

app.use(
  "/static/semantic/",
  express.static(path.join(__dirname, "node_modules", "semantic-ui-css"))
);

app.get("/", (req, res) => res.redirect("/page/HomePage"));
app.get("/page/:name", (req, res) => {
  const name = req.params.name;
  db.getPage(name, (err, page) => {
    if (page) {
      return res.render("page", {
        subtitle: "| " + name,
        title: name,
        content: renderMarkdown(page.content)
      });
    }
    res.send("no such page: " + name);
  });
});

app.get("/edit/:name", (req, res) => {
  const name = req.params.name;
  db.getPage(name, (err, page) => {
    if (page) {
      return res.render("edit", {
        subtitle: "| " + name,
        title: name,
        content: page.content
      });
    }
    res.send("no such page: " + name);
  });
});

module.exports = app;
