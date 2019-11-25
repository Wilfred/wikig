const createError = require("http-errors");
const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const twemoji = require("twemoji");

const indexRouter = require("./routes/index");
const pageRouter = require("./routes/pages");
const editingRouter = require("./routes/editing");
const versionRouter = require("./routes/version");
const config = require("./config");

const app = express();

app.engine(".html", exphbs({ extname: ".html" }));
app.locals.SITE_NAME = config.SITE_NAME;
app.locals.GOOGLE_ANALYTICS = config.GOOGLE_ANALYTICS;

app.set("view engine", ".html");

app.use(
  "/static/semantic/",
  express.static(path.join(__dirname, "node_modules", "semantic-ui-css"))
);
app.use(
  "/static/font-awesome/",
  express.static(path.join(__dirname, "node_modules", "font-awesome"))
);

app.use("/static/", express.static(path.join(__dirname, "static")));

app.use("/", indexRouter);
app.use("/", editingRouter);
app.use("/", versionRouter);

// Needs to come last, so we register /:name after other routes.
app.use("/", pageRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error", { emoji: twemoji.parse("‼️") });
});

module.exports = app;
