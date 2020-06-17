const express = require("express");
const createError = require("http-errors");
const bodyParser = require("body-parser");
const basicAuth = require("express-basic-auth");

const memoryCache = require("../lib/cache");
const emoji = require("../lib/emoji");
const addShyHyphen = require("../lib/camelcase").addShyHyphen;
const db = require("../db");
const router = express.Router();

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

router.use(
  "/new",
  basicAuth({
    users: { admin: ADMIN_PASSWORD },
    challenge: true
  })
);

router.get("/new", (req, res) => {
  const name = req.query.name;

  db.getPageByName(name, (err, page) => {
    if (err) {
      console.error(err);
    }

    if (page) {
      // Page already exists, just redirect.
      return res.redirect("/" + name);
    } else {
      page = { name };
    }

    return res.render("edit", {
      title: "New Page",
      emoji: emoji.render("🐣"),
      page
    });
  });
});

router.post("/new", urlencodedParser, (req, res) => {
  const name = req.body.name;
  db.createPage(name, req.body.content, (err, _page) => {
    if (err) {
      console.error(err);
    }
    // Remove cache of other pages, so we update link colours.
    memoryCache.reset(() => {
      res.redirect("/" + name);
    });
  });
});

router.use(
  "/edit/:name",
  basicAuth({
    users: { admin: ADMIN_PASSWORD },
    challenge: true
  })
);

router.get("/edit/:id", (req, res, next) => {
  db.getPage(req.params.id, (err, page) => {
    if (!page) {
      return next(createError(404));
    }

    return res.render("edit", {
      title: addShyHyphen(page.name),
      emoji: emoji.render("✏️"),
      page
    });
  });
});

router.post("/edit/:id", urlencodedParser, (req, res) => {
  const name = req.body.name;
  db.updatePage(req.params.id, name, req.body.content, (err, _page) => {
    if (err) {
      console.error(err);
    }
    memoryCache.del("/" + name, () => {
      res.redirect("/" + name);
    });
  });
});

module.exports = router;
