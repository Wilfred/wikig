const _ = require("lodash");
const emojilib = require("emojilib");
const nlp = require("compromise");

const UNWANTED_EMOJI = [
  "hash", // used for twitter, but renders poorly on my laptop
  "frowning", // 'what'
  "sa" // japanese
];

const REPLACEMENTS = {
  // The only emojis associated with 'program' are 'radio' and 'tv'.
  program: "programmer",
  // Since we end up using 'male_technologist' for programmer, use
  // woman_technologist for software to balance it.
  software: "woman_technologist",
  // Otherwise we end up with 'trackball' or 'fax' as they have the
  // fewest keywords.
  technology: "computer",
  // The only emoji with 'tree' as a keyword is 'leaves'.
  tree: "deciduous_tree"
};

function emojiMatchingKeyword(originalTarget) {
  const target = REPLACEMENTS[originalTarget] || originalTarget;

  let result = null;
  _.forEach(Object.keys(emojilib.lib), key => {
    // Ignore banned emojis.
    if (UNWANTED_EMOJI.includes(key)) {
      return true; // continue
    }

    const entry = Object.assign(
      { key, target: originalTarget },
      emojilib.lib[key]
    );
    // Ignore countries, as they can be misleading (e.g. "me" is
    // Macedonia).
    if (entry.category == "flags") {
      return true;
    }

    // If there's an emoji with exactly this name, use it.
    if (key == target) {
      result = entry;
      return false; // break
    }

    // Otherwise, use an emoji that matches by keyword. Prefer emoji
    // with fewer keywords as they're usually a better match. For
    // example, 'home' matches family emoji, which have lots of
    // keywords, when we really want a building.
    if (entry.keywords.includes(target)) {
      if (result === null || entry.keywords.length <= result.keywords.length) {
        result = entry;
      }
    }
  });

  // If we still haven't found something, try splitting names. This is
  // useful for matching 'page_facing_u' to 'page'. Don't consider
  // very short targets, as 'do' or 'no' isn't relevant.
  if (!result && target.length > 2) {
    _.forEach(Object.keys(emojilib.lib), key => {
      const parts = key.split("_");
      // Only use the first part, so 'call_me_hand' doesn't match
      // 'me'.
      if (parts.length > 1 && parts[0] == target) {
        result = Object.assign(
          { key, target: originalTarget },
          emojilib.lib[key]
        );
      }
    });
  }

  return result;
}

function findEmoji(words) {
  const result = [];
  _.forEach(words, word => {
    const emoji = emojiMatchingKeyword(word.toLowerCase());

    if (emoji && !result.includes(emoji)) {
      result.push(emoji);
    }
  });

  return result;
}

function findNounEmoji(src) {
  const nouns = nlp(src)
    .nouns()
    .trim()
    .setPunctuation("") // strip . or ,
    .data()
    .map(word => word.singular);

  return findEmoji(nouns);
}

module.exports = { findNounEmoji: findNounEmoji, findEmoji: findEmoji };
