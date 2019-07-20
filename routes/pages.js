const moment = require("moment");
const createError = require("http-errors");
const express = require("express");
const bodyParser = require("body-parser");
const commonmark = require("commonmark");
const wikiWordsTransform = require("commonmark-wikiwords");

const db = require("../db");
const SITE_NAME = require("../config").SITE_NAME;

const router = express.Router();

const urlencodedParser = bodyParser.urlencoded({ extended: false });

function renderMarkdown(src) {
  const reader = new commonmark.Parser();
  const writer = new commonmark.HtmlRenderer();
  // parsed is a 'Node' tree
  const parsed = reader.parse(src);

  return writer.render(wikiWordsTransform(parsed));
}

function formatTime(created, updated) {
  if (created == updated) {
    return created;
  }
  const updatedM = moment(updated);
  return `Created ${created}, updated ${updatedM.fromNow()}.`;
}

router.get("/:name", (req, res) => {
  const name = req.params.name;
  db.getPage(name, (err, page) => {
    if (!page) {
      return res.redirect("/edit/" + name);
    }
    page.rendered = renderMarkdown(page.content);
    return res.render("page", {
      SITE_NAME: SITE_NAME,
      title: name + " | " + SITE_NAME,
      page: page,
      timestamp: formatTime(page.created, page.updated)
    });
  });
});

router.get("/edit/:name", (req, res) => {
  const name = req.params.name;
  db.getPage(name, (err, page) => {
    if (!page) {
      page = { name: name, content: "" };
    }

    return res.render("edit", {
      SITE_NAME: SITE_NAME,
      title: name + " | " + SITE_NAME,
      page: page
    });
  });
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

router.post("/edit/:name", urlencodedParser, (req, res, next) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return next(createError(403));
  }

  // Prefer the POST parameter to the URL, so we can rename pages.
  const name = req.body.title;
  db.updatePage(name, req.body.content, (err, _page) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/" + name);
  });
});

module.exports = router;
