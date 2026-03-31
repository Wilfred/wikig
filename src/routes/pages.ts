import _ from "lodash";
import * as express from "express";
import ExpressCache from "express-cache-middleware";
import extract from "commonmark-extract-text";
import wikiwords from "commonmark-wikiwords";
import moment from "moment";
import randomItem from "random-item";
import truncate from "truncate";

import * as commonmark from "../lib/commonmark";
import * as db from "../db";
import * as emoji from "../lib/emoji";
import * as search from "../lib/search";
import memoryCache from "../lib/cache";
import { addSpaces } from "../lib/camelcase";

const router = express.Router();

function formatDate(dateString: string): string {
  // sqlite uses GMT for datetime values.
  return moment.utc(dateString).format("Do MMMM YYYY");
}

function formatTimeSince(datetime: string): string {
  const m = moment.utc(datetime);
  const elapsed = moment.duration(moment().diff(m));
  if (elapsed.asDays() < 1) {
    return "today";
  }
  return m.fromNow();
}

function formatTime(created: string, updated: string): string {
  if (created == updated) {
    return `Created ${formatDate(created)}`;
  }
  return `Created ${formatDate(created)}, updated ${formatTimeSince(updated)}`;
}

async function noSuchPage(
  name: string,
  res: express.Response,
): Promise<void> {
  try {
    const names = await search.similarPages(name);
    let similarPages: string | null = null;
    if (names) {
      similarPages = commonmark.render(
        `The closest matches are ${names[0]} and ${names[1]}.`,
      );
    }

    res.status(404).render("404", {
      title: "No Such Page: " + name,
      name,
      similarPages,
      emoji: emoji.render("🤷"),
      isWikiWord: wikiwords.isWikiWord(name),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
}

router.get("/all", async (req, res) => {
  try {
    let pages = await db.allPages();
    pages = pages.map((page) => {
      return Object.assign({}, page, {
        updated: formatDate(page.updated),
        url: `/${page.name}`,
        name: addSpaces(page.name),
      });
    });

    res.render("all", {
      title: "All Pages",
      emoji: emoji.render("📚"),
      isAllPages: true,
      pages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/random", async (_, res) => {
  try {
    const pages = await db.allPageNames();
    const page = randomItem(pages);
    res.redirect("/" + page.name);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/search", async (req, res) => {
  const term = req.query.term;

  if (!term || typeof term !== "string") {
    return res.render("search_form", {
      title: "Search",
      emoji: emoji.render("🔎"),
    });
  }

  try {
    let pages = await search.search(term);

    pages = pages.map((page) =>
      Object.assign({}, page, { short: truncate(page.content, 200) }),
    );

    pages = pages.slice(0, 5);

    res.render("search_results", {
      title: "Search: " + term,
      emoji: emoji.render("🔎"),
      pages,
    });
  } catch (err) {
    console.error(err);
    res.render("search_results", {
      title: "Search: " + term,
      emoji: emoji.render("🔎"),
      pages: [],
    });
  }
});

const cacheMiddleware = new ExpressCache(memoryCache);
cacheMiddleware.attach(router);

router.get("/:name", async (req, res) => {
  try {
    const name = req.params.name;
    const page = await db.getPageByName(name);

    if (!page) {
      return noSuchPage(name, res);
    }

    const names = await db.allPageNames();

    const titleEmoji = emoji.findEmoji(_.startCase(page.name).split(" "));
    // TODO: It would be nice to rewrite wikiword URLs from FooBar to Foo Bar.
    const bodyEmoji = emoji.findWordEmoji(extract.fromText(page.content));

    let emojis = _.uniqBy(_.concat(titleEmoji, bodyEmoji), "key");
    // Render the page, highlighting markdown links to nonexistent
    // pages in a different colour.
    const pageNames = names.map((p) => p.name);

    // @ts-ignore
    page.rendered = commonmark.render(page.content, (name: string) =>
      pageNames.includes(name) ? null : "no-such-page",
    );

    const related = search
      .similarNames(name, pageNames)
      .slice(0, 2)
      .join(", ");

    let emojiStr: string | null = null;
    let emojiCaption: string | null = null;
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
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
