import basicAuth from "express-basic-auth";
import bodyParser from "body-parser";
import express from "express";
import createError from "http-errors";

import memoryCache from "../lib/cache";
import * as emoji from "../lib/emoji";
import { addShyHyphen } from "../lib/camelcase";
import * as db from "../db";
const router = express.Router();

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

router.use(
  "/new",
  basicAuth({
    users: { admin: ADMIN_PASSWORD },
    challenge: true,
  }),
);

router.get("/new", async (req, res) => {
  try {
    const name = req.query.name as string;
    const page = await db.getPageByName(name);

    if (page) {
      // Page already exists, just redirect.
      return res.redirect("/" + name);
    }

    return res.render("edit", {
      title: "New Page",
      emoji: emoji.render("🐣"),
      page: { name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/new", urlencodedParser, async (req, res) => {
  try {
    const name = req.body.name;
    await db.createPage(name, req.body.content);
    // Remove cache of other pages, so we update link colours.
    await memoryCache.reset();
    res.redirect("/" + name);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.use(
  "/edit/:name",
  basicAuth({
    users: { admin: ADMIN_PASSWORD },
    challenge: true,
  }),
);

router.get("/edit/:id", async (req, res, next) => {
  try {
    const page = await db.getPage(req.params.id);
    if (!page) {
      return next(createError(404));
    }

    return res.render("edit", {
      title: addShyHyphen(page.name),
      emoji: emoji.render("✏️"),
      page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/edit/:id", urlencodedParser, async (req, res) => {
  try {
    const name = req.body.name;
    await db.updatePage(req.params.id, name, req.body.content);
    await memoryCache.del("/" + name);
    res.redirect("/" + name);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
