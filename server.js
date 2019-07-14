const commonmark = require("commonmark");
const wikiWordsTransform = require("commonmark-wikiwords");
const express = require("express");
const exphbs = require("express-handlebars");
const db = require("./db");

const port = 3000;
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

app.get("/", (req, res) => res.redirect("/page/HomePage"));
app.get("/page/:name", (req, res) => {
  const name = req.params.name;
  db.getPage(name, (err, page) => {
    if (page) {
      return res.render("page", {
        title: name,
        content: renderMarkdown(page.content)
      });
    }
    res.send("no such page: " + name);
  });
});

db.init(() => {
  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
});
