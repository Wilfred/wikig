const moment = require("moment");
const express = require("express");
const commonmark = require("commonmark");
const wikiwords = require("commonmark-wikiwords");

const db = require("../db");
const SITE_NAME = require("../config").SITE_NAME;

const router = express.Router();

function renderMarkdown(src) {
  const reader = new commonmark.Parser();
  const writer = new commonmark.HtmlRenderer();
  // parsed is a 'Node' tree
  const parsed = reader.parse(src);

  return writer.render(wikiwords.transform(parsed));
}

function formatDate(dateString) {
  // sqlite uses GMT for datetime values.
  return moment.utc(dateString).format("Do MMMM YYYY");
}

function formatTime(created, updated) {
  if (created == updated) {
    return formatDate(created);
  }
  const updatedM = moment.utc(updated);
  return `Created ${formatDate(created)}, last updated ${updatedM.fromNow()}.`;
}

function noSuchPage(name, res) {
  return res.status(404).render("404", { name });
}

router.get("/all", (req, res) => {
  db.allPages((err, pages) => {
    if (err) {
      console.error(err);
    }
    pages = pages.map(page => {
      return Object.assign({}, page, { updated: formatDate(page.updated) });
    });

    return res.render("all", {
      SITE_NAME: SITE_NAME,
      title: "All | " + SITE_NAME,
      pages: pages
    });
  });
});

router.get("/:name", (req, res) => {
  const name = req.params.name;
  db.getPageByName(name, (err, page) => {
    if (!page) {
      return noSuchPage(name, res);
    }
    page.rendered = renderMarkdown(page.content);
    return res.render("page", {
      SITE_NAME: SITE_NAME,
      title: name + " | " + SITE_NAME,
      subtitle: ": " + name,
      page: page,
      timestamp: formatTime(page.created, page.updated)
    });
  });
});

module.exports = router;
