const commonmark = require("commonmark");
const wikiwords = require("commonmark-wikiwords");
const linkifyTransform = require("commonmark-linkify");
const emojiTransform = require("commonmark-twemoji");

function render(src, linkClassCallback) {
  if (!linkClassCallback) {
    linkClassCallback = () => null;
  }
  const reader = new commonmark.Parser();
  const writer = new commonmark.HtmlRenderer();
  let parsed = reader.parse(src);

  parsed = wikiwords.transform(
    linkifyTransform(
      emojiTransform(parsed, {
        base: "/static/twemoji/",
        folder: "72x72"
      })
    ),
    linkClassCallback
  );

  return writer.render(parsed);
}

module.exports = { render };
