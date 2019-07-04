const commonmark = require("commonmark");
const Koa = require("koa");
const Router = require("koa-router");

const app = new Koa();
const router = new Router();

var fs = require("fs"),
  path = require("path"),
  filePath = path.join(__dirname, "concept.md");

const homePageSrc = fs.readFileSync(filePath, { encoding: "utf8" });

function renderMarkdown(src) {
  var reader = new commonmark.Parser();
  var writer = new commonmark.HtmlRenderer();
  // parsed is a 'Node' tree
  var parsed = reader.parse(src);

  // transform parsed if you like...
  return writer.render(parsed);
}

router.get("/", (ctx, next) => {
  ctx.body = renderMarkdown(homePageSrc);
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);
console.log("Server listening on 3000");
