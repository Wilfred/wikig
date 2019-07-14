const createError = require("http-errors");
const express = require("express");
const bodyParser = require("body-parser");
const commonmark = require("commonmark");
const wikiWordsTransform = require("commonmark-wikiwords");

const db = require("../db");

const router = express.Router();

const urlencodedParser = bodyParser.urlencoded({ extended: false });

function renderMarkdown(src) {
  const reader = new commonmark.Parser();
  const writer = new commonmark.HtmlRenderer();
  // parsed is a 'Node' tree
  const parsed = reader.parse(src);

  return writer.render(wikiWordsTransform(parsed));
}

router.get("/page/:name", (req, res, next) => {
  const name = req.params.name;
  db.getPage(name, (err, page) => {
    if (!page) {
      return next(createError(404));
    }
    return res.render("page", {
      subtitle: "| " + name,
      title: name,
      content: renderMarkdown(page.content)
    });
  });
});

router.get("/edit/:name", (req, res, next) => {
  const name = req.params.name;
  db.getPage(name, (err, page) => {
    if (!page) {
      return next(createError(404));
    }

    return res.render("edit", {
      subtitle: "| " + name,
      title: name,
      content: page.content
    });
  });
});

router.post("/edit/:name", urlencodedParser, (req, res) => {
  // Prefer the POST parameter to the URL, so we can rename pages.
  const name = req.body.title;
  db.updatePage(name, req.body.content, (err, _page) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/page/" + name);
  });
});

module.exports = router;
