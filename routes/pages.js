const moment = require("moment");
const express = require("express");
const commonmark = require("commonmark");
const wikiwords = require("commonmark-wikiwords");
const linkifyTransform = require("commonmark-linkify");

const db = require("../db");

const router = express.Router();

function renderMarkdown(src, linkClassCallback) {
  const reader = new commonmark.Parser();
  const writer = new commonmark.HtmlRenderer();
  let parsed = reader.parse(src);

  parsed = wikiwords.transform(linkifyTransform(parsed), linkClassCallback);

  return writer.render(parsed);
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
  return res.status(404).render("404", {
    title: "No Such Page",
    name,
    isWikiWord: wikiwords.isWikiWord(name)
  });
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
      title: "All Pages",
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

    db.allPageNames((err, names) => {
      if (err) {
        console.error(err);
      }

      // Render the page, highlighting markdown links to nonexitsente
      // pages in a different colour.
      names = names.map(p => p.name);
      page.rendered = renderMarkdown(page.content, name =>
        names.includes(name) ? null : "no-such-page"
      );

      return res.render("page", {
        title: name,
        page: page,
        timestamp: formatTime(page.created, page.updated)
      });
    });
  });
});

module.exports = router;
