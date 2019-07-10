const commonmark = require("commonmark");
const wikiWordsTransform = require("commonmark-wikiwords");
const Koa = require("koa");
const Router = require("koa-router");
const Handlebars = require("handlebars");

const app = new Koa();
const router = new Router();

const fs = require("fs"),
  path = require("path"),
  filePath = path.join(__dirname, "concept.md"),
  indexTemplatePath = path.join(__dirname, "templates/index.html");

const homePageSrc = fs.readFileSync(filePath, { encoding: "utf8" });
const indexTemplate = Handlebars.compile(
  fs.readFileSync(indexTemplatePath, { encoding: "utf8" })
);

function renderMarkdown(src) {
  const reader = new commonmark.Parser();
  const writer = new commonmark.HtmlRenderer();
  // parsed is a 'Node' tree
  const parsed = reader.parse(src);

  return writer.render(wikiWordsTransform(parsed));
}

router.get("/", (ctx, next) => {
  ctx.body = indexTemplate({
    title: "HomePage",
    content: renderMarkdown(homePageSrc)
  });
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);
console.log("Server listening on 3000");
