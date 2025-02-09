const _ = require("lodash");
const moment = require("moment");
const express = require("express");
const wikiwords = require("commonmark-wikiwords");
const extract = require("commonmark-extract-text");
const randomItem = require("random-item");
const truncate = require("truncate");
const ExpressCache = require("express-cache-middleware");

const commonmark = require("../lib/commonmark");
const search = require("../lib/search");
const emoji = require("../lib/emoji");
const addSpaces = require("../lib/camelcase").addSpaces;
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
    return `Created ${formatDate(created)}`;
  }
  return `Created ${formatDate(created)}, updated ${formatTimeSince(updated)}`;
}

function noSuchPage(name, res) {
  search.similarPages(name, (err, names) => {
    if (err) {
      console.error(err);
    }

    let similarPages = null;
    if (names) {
      similarPages = commonmark.render(
        `The closest matches are ${names[0]} and ${names[1]}.`,
      );
    }

    return res.status(404).render("404", {
      title: "No Such Page: " + name,
      name,
      similarPages,
      emoji: emoji.render("🤷"),
      isWikiWord: wikiwords.isWikiWord(name),
    });
  });
}

router.get("/all", (req, res) => {
  db.allPages((err, pages) => {
    if (err) {
      console.error(err);
    }
    pages = pages.map((page) => {
      return Object.assign({}, page, {
        updated: formatDate(page.updated),
        url: `/${page.name}`,
        name: addSpaces(page.name),
      });
    });

    return res.render("all", {
      title: "All Pages",
      emoji: emoji.render("📚"),
      isAllPages: true,
      pages,
    });
  });
});

router.get("/random", (req, res) => {
  db.allPageNames((err, pages) => {
    if (err) {
      console.error(err);
    }

    const page = randomItem(pages);
    return res.redirect("/" + page.name);
  });
});

router.get("/search", (req, res) => {
  const term = req.query.term;

  if (!term) {
    return res.render("search_form", {
      title: "Search",
      emoji: emoji.render("🔎"),
    });
  }

  search.search(term, (err, pages) => {
    if (err) {
      console.error(err);
    }

    pages = pages.map((page) =>
      Object.assign({}, page, { short: truncate(page.content, 200) }),
    );

    pages = pages.slice(0, 5);

    return res.render("search_results", {
      title: "Search: " + term,
      emoji: emoji.render("🔎"),
      pages,
    });
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
      // TODO: It would be nice to rewrite wikiword URLs from FooBar to Foo Bar.
      const bodyEmoji = emoji.findWordEmoji(extract.fromText(page.content));

      let emojis = _.uniqBy(_.concat(titleEmoji, bodyEmoji), "key");
      // Render the page, highlighting markdown links to nonexistent
      // pages in a different colour.
      names = names.map((p) => p.name);

      page.rendered = commonmark.render(page.content, (name) =>
        names.includes(name) ? null : "no-such-page",
      );

      const related = search.similarNames(name, names).slice(0, 2).join(", ");

      let emojiStr = null;
      let emojiCaption = null;
      if (emojis.length) {
        emojis = emojis.slice(0, 3);
        emojiStr = emojis.map((e) => e.char).join("");
        emojiCaption = emojis
          .map(
            (e) =>
              '<div class="ui pointing below label">' + e.target + "</div>",
          )
          .join("");
      }

      res.render("page", {
        title: addSpaces(page.name),
        page,
        isHomePage: page.name === "HomePage",
        emojiStr,
        emoji: emoji.render(emojiStr),
        emoji_caption: emojiCaption,
        footer: commonmark.render(
          `${formatTime(page.created, page.updated)}. Related: ${related}`,
        ),
      });
    });
  });
});

module.exports = router;
