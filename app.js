const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");

const indexRouter = require("./routes/index");
const pageRouter = require("./routes/pages");

const app = express();

app.engine(".html", exphbs({ extname: ".html" }));
app.set("view engine", ".html");

app.use(
  "/static/semantic/",
  express.static(path.join(__dirname, "node_modules", "semantic-ui-css"))
);

app.use("/", indexRouter);
app.use("/", pageRouter);

module.exports = app;
