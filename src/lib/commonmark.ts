import * as commonmark from "commonmark";

// No types yet.
const wikiwords = require("commonmark-wikiwords");
const linkifyTransform = require("commonmark-linkify");
const emojiTransform = require("commonmark-twemoji");

export function render(
  src: string,
  linkClassCallback: (text: string) => string | null,
): string {
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
        folder: "72x72",
      }),
    ),
    linkClassCallback,
    ["GitHub"],
  );

  return writer.render(parsed);
}
