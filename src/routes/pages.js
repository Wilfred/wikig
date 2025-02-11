"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const moment = require("moment");
const express = require("express");
const wikiwords = require("commonmark-wikiwords");
const extract = require("commonmark-extract-text");
const randomItem = require("random-item");
const truncate = require("truncate");
const ExpressCache = require("express-cache-middleware");
const db = __importStar(require("../db"));
const emoji = __importStar(require("../lib/emoji"));
const commonmark = require("../lib/commonmark");
const search = require("../lib/search");
const addSpaces = require("../lib/camelcase").addSpaces;
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
      const titleEmoji = emoji.findEmoji(
        lodash_1.default.startCase(page.name).split(" "),
      );
      // TODO: It would be nice to rewrite wikiword URLs from FooBar to Foo Bar.
      const bodyEmoji = emoji.findWordEmoji(extract.fromText(page.content));
      let emojis = lodash_1.default.uniqBy(
        lodash_1.default.concat(titleEmoji, bodyEmoji),
        "key",
      );
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
        emojis = emojis.slice(0, 2);
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
