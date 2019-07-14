const commonmark = require("commonmark");
const wikiWordsTransform = require("commonmark-wikiwords");
const express = require("express");
const Handlebars = require("handlebars");
const db = require("./db");

const port = 3000;
const app = express();

const fs = require("fs"),
  path = require("path"),
  filePath = path.join(__dirname, "concept.md"),
  indexTemplatePath = path.join(__dirname, "templates/index.html");

const homePageSrc = fs.readFileSync(filePath, { encoding: "utf8" });
const indexTemplate = Handlebars.compile(
  fs.readFileSync(indexTemplatePath, { encoding: "utf8" })
);

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
    console.log(err);
    console.log(page);

    if (page) {
      res.send(
        indexTemplate({
          title: name,
          content: renderMarkdown(page.content)
        })
      );
    }
    res.send("no such page: " + name);
  });
});

db.init(() => {
  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
});
