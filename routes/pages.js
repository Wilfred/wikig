const _ = require("lodash");
const moment = require("moment");
const express = require("express");
const wikiwords = require("commonmark-wikiwords");
const stringSimilarity = require("string-similarity");
const randomItem = require("random-item");
const ExpressCache = require("express-cache-middleware");

const commonmark = require("../lib/commonmark");
const emoji = require("../lib/emoji");
const addZeroWidthBreaks = require("../lib/camelcase").addZeroWidthBreaks;
const db = require("../db");
const memoryCache = require("../lib/cache");

const router = express.Router();

function formatDate(dateString) {
  // sqlite uses GMT for datetime values.
  return moment.utc(dateString).format("Do MMMM YYYY");
}

function formatTimeSince(datetime) {
  const m = moment.utc(datetime);
  const elapsed = moment.duration(moment().diff(m));
  if (elapsed.asDays() < 1) {
    return "today";
  }
  return m.fromNow();
}

function formatTime(created, updated) {
  if (created == updated) {
    return formatDate(created);
  }
  return `${formatDate(created)}, updated ${formatTimeSince(updated)}.`;
}

function noSuchPage(name, res) {
  db.allPageNames((err, names) => {
    if (err) {
      console.error(err);
    }

    let similarPages = null;
    if (names) {
      names = names.map(n => n.name);

      let matches = stringSimilarity.findBestMatch(name, names).ratings;
      matches = _.sortBy(matches, "rating").map(match => match.target);
      matches.reverse();

      similarPages = commonmark.render(
        `Did you mean ${matches[0]} or ${matches[1]}?`
      );
    }

    return res.status(404).render("404", {
      title: "No Such Page",
      name,
      similarPages,
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

const cacheMiddleware = new ExpressCache(memoryCache);
cacheMiddleware.attach(router);

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
      const bodyEmoji = emoji.findWordEmoji(commonmark.prose(page.content));

      let emojis = _.uniqBy(_.concat(titleEmoji, bodyEmoji), "key");
      // Render the page, highlighting markdown links to nonexistent
      // pages in a different colour.
      names = names.map(p => p.name);

      page.rendered = commonmark.render(page.content, name =>
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
