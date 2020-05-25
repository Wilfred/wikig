const _ = require("lodash");
const moment = require("moment");
const express = require("express");
const wikiwords = require("commonmark-wikiwords");
const extract = require("commonmark-extract-text");
const stringSimilarity = require("string-similarity");
const randomItem = require("random-item");
const ExpressCache = require("express-cache-middleware");

const commonmark = require("../lib/commonmark");
const emoji = require("../lib/emoji");
const addZeroWidthBreaks = require("../lib/camelcase").addZeroWidthBreaks;
const addSpaces = require("../lib/camelcase").addSpaces;
const db = require("../db");
const memoryCache = require("../lib/cache");

const router = express.Router();

function formatDate(dateString) {
  // sqlite uses GMT for datetime values.
  return "Created " + moment.utc(dateString).format("Do MMMM YYYY");
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
  return `${formatDate(created)}, updated ${formatTimeSince(updated)}`;
}

function similarNames(name, names) {
  let matches = stringSimilarity.findBestMatch(name, names).ratings;
  matches = _.sortBy(matches, "rating").map(match => match.target);
  matches.reverse();

  return matches.filter(m => m !== name);
}

// Find other pages whose name looks similar.
// TODO: Consider word boundaries, so BananaPie and BandanaClothes are
// less similar.
function similarPages(name, cb) {
  db.allPageNames((err, names) => {
    if (err) {
      return cb(err);
    }

    names = names.map(n => n.name);
    return cb(null, similarNames(name, names));
  });
}

function noSuchPage(name, res) {
  similarPages(name, (err, names) => {
    if (err) {
      console.error(err);
    }

    let similarPages = null;
    if (names) {
      similarPages = commonmark.render(
        `The closest matches are ${names[0]} and ${names[1]}.`
      );
    }

    return res.status(404).render("404", {
      title: "No Such Page: " + name,
      name,
      similarPages,
      emoji: emoji.render("🤷"),
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
        url: `/${page.name}`,
        name: addZeroWidthBreaks(page.name)
      });
    });

    return res.render("all", {
      title: "All Pages",
      emoji: emoji.render("📚"),
      isAllPages: true,
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
      // TODO: It would be nice to rewrite wikiword URLs from FooBar to Foo Bar.
      const bodyEmoji = emoji.findWordEmoji(extract.fromText(page.content));

      let emojis = _.uniqBy(_.concat(titleEmoji, bodyEmoji), "key");
      // Render the page, highlighting markdown links to nonexistent
      // pages in a different colour.
      names = names.map(p => p.name);

      page.rendered = commonmark.render(page.content, name =>
        names.includes(name) ? null : "no-such-page"
      );

      let related = similarNames(name, names)
        .slice(0, 2)
        .join(", ");

      let emojiStr = null;
      let emojiCaption = null;
      if (emojis.length) {
        emojis = emojis.slice(0, 4);
        emojiStr = emojis.map(e => e.char).join("");
        emojiCaption = emojis
          .map(
            e => '<div class="ui black pointing label">' + e.target + "</div>"
          )
          .join("");
      }

      res.render("page", {
        title: addSpaces(page.name),
        page,
        isHomePage: page.name === "HomePage",
        emoji: emoji.render(emojiStr),
        emoji_caption: emojiCaption,
        footer: commonmark.render(
          `${formatTime(page.created, page.updated)}. Related: ${related}`
        )
      });
    });
  });
});

module.exports = router;
