const commonmark = require("commonmark");
const Koa = require("koa");
const Router = require("koa-router");
const Handlebars = require("handlebars");

const app = new Koa();
const router = new Router();

var fs = require("fs"),
  path = require("path"),
  filePath = path.join(__dirname, "concept.md"),
  indexTemplatePath = path.join(__dirname, "templates/index.html");

const homePageSrc = fs.readFileSync(filePath, { encoding: "utf8" });
const indexTemplate = Handlebars.compile(
  fs.readFileSync(indexTemplatePath, { encoding: "utf8" })
);

function textNode(text) {
  var node = new commonmark.Node("text", undefined);
  node.literal = text;
  return node;
}

function linkNode(text, url) {
  var urlNode = new commonmark.Node("link", undefined);
  urlNode.destination = url;
  urlNode.appendChild(textNode(text));

  return urlNode;
}

// Regexp must be sticky.
function splitMatches(text, regexp) {
  var i = 0;
  var result = [];

  var match = regexp.exec(text);
  while (match) {
    if (match.index > i) {
      result.push([text.substring(i, match.index), false]);
    }

    var found = match[0];
    result.push([found, true]);

    var matchStart = match.index;
    i = matchStart + found.length;

    match = regexp.exec(text);
  }

  if (i < text.length) {
    result.push([text.substring(i, text.length), false]);
  }

  return result;
}

const wikiWordsRegexp = /( |^)[A-Z][a-z]\w*?[A-Z](\w+)?/g;

function splitWikiWordLinks(node) {
  var parts = splitMatches(node.literal, wikiWordsRegexp);

  return parts.map(part => {
    if (part[1]) {
      return linkNode(part[0], part[0]);
    } else {
      return textNode(part[0]);
    }
  });
}

function renderMarkdown(src) {
  var reader = new commonmark.Parser();
  var writer = new commonmark.HtmlRenderer();
  // parsed is a 'Node' tree
  var parsed = reader.parse(src);

  var walker = parsed.walker();
  var event, node;

  while ((event = walker.next())) {
    node = event.node;
    if (event.entering && node.type === "text") {
      splitWikiWordLinks(node).forEach(newNode => {
        node.insertBefore(newNode);
      });
      node.unlink();
    }
  }

  // transform parsed if you like...
  return writer.render(parsed);
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
