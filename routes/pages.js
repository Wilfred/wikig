const _ = require("lodash");
const moment = require("moment");
const express = require("express");
const commonmark = require("commonmark");
const wikiwords = require("commonmark-wikiwords");
const linkifyTransform = require("commonmark-linkify");
const stringSimilarity = require("string-similarity");
const randomItem = require("random-item");

const emojiTransform = require("../lib/commonmark-emoji");
const emoji = require("../lib/emoji");
const addZeroWidthBreaks = require("../lib/camelcase").addZeroWidthBreaks;
const db = require("../db");

const router = express.Router();

function renderMarkdown(src, linkClassCallback) {
  const reader = new commonmark.Parser();
  const writer = new commonmark.HtmlRenderer();
  let parsed = reader.parse(src);

  parsed = wikiwords.transform(
    linkifyTransform(
      emojiTransform(parsed, {
        base: "/static/twemoji/",
        folder: "72x72"
      })
    ),
    linkClassCallback
  );

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
  return `${formatDate(created)}, updated ${updatedM.fromNow()}.`;
}

function noSuchPage(name, res) {
  db.allPageNames((err, names) => {
    if (err) {
      console.error(err);
    }

    let similarName = null;
    if (names) {
      names = names.map(n => n.name);
      similarName = stringSimilarity.findBestMatch(name, names).bestMatch
        .target;
    }

    return res.status(404).render("404", {
      title: "No Such Page",
      name,
      similarName,
      emoji: emoji.render("❓"),
      isWikiWord: wikiwords.isWikiWord(name)
    });
  });
}

router.get("/all", (req, res) => {
  db.allPages((err, pages) => {
    if (err) {
      console.error(err);
    }
    pages = pages.map(page => {
      return Object.assign({}, page, {
        updated: formatDate(page.updated),
        name: addZeroWidthBreaks(page.name)
      });
    });

    return res.render("all", {
      title: "All Pages",
      emoji: emoji.render("📚"),
      pages
    });
  });
});

router.get("/random", (req, res) => {
  db.allPages((err, pages) => {
    if (err) {
      console.error(err);
    }

    const page = randomItem(pages);
    return res.redirect("/" + page.name);
  });
});

// Exclude link URLs and code from markdown.
function markdownProse(src) {
  // Remove URLs. TODO: It would be nice to split CamelCase too.
  src = src.replace(/\[(.*?)\]\(.*?\)/g, "$1");
  // Remove code.
  return src.replace(/`.*?`/, "");
}

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

      const titleEmoji = emoji.findEmoji(_.startCase(page.name).split(" "));
      const bodyEmoji = emoji.findNounEmoji(markdownProse(page.content));

      let emojis = _.uniqBy(_.concat(titleEmoji, bodyEmoji), "key");
      // Render the page, highlighting markdown links to nonexistent
      // pages in a different colour.
      names = names.map(p => p.name);

      page.rendered = renderMarkdown(page.content, name =>
        names.includes(name) ? null : "no-such-page"
      );

      let emojiStr = null;
      let emojiCaption = null;
      if (emojis.length) {
        emojis = emojis.slice(0, 3);
        emojiStr = emojis.map(e => e.char).join("");
        emojiCaption = emojis.map(e => e.target).join(" ");
      }

      res.render("page", {
        title: addZeroWidthBreaks(page.name),
        page,
        isHomePage: page.name === "HomePage",
        emoji: emoji.render(emojiStr),
        emoji_caption: emojiCaption,
        timestamp: formatTime(page.created, page.updated)
      });
    });
  });
});

module.exports = router;
