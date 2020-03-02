const _ = require("lodash");
const emojilib = require("emojilib");
const nlp = require("compromise");
const twemoji = require("twemoji");

const WORD_BLACKLIST = [
  "data",
  "enter", // boring arrow
  "express",
  "find", // common verb, nouns tend to be more relevant
  "first",
  "hit",
  "more", // plus sign
  "new",
  "see",
  "two", // numbers aren't informative
  "way",
  "write",
  "writing",
  "what", // surprised face
  "yes"
];

const KEYWORD_BLACKLIST = [
  // We sometimes find valid emoji like 'have' mapping to 'u6709' but
  // it doesn't make sense for english readers.
  "chinese",
  "japanese",
  // Word emoji are not visually interesting.
  "words"
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
    const entry = Object.assign(
      { key, target: originalTarget },
      emojilib.lib[key]
    );

    // Ignore emoji if any keywords are in the blacklist.
    if (!_.isEmpty(_.intersection(entry.keywords, KEYWORD_BLACKLIST))) {
      return true; // continue
    }
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
    if (word.length < 3 || WORD_BLACKLIST.includes(word.toLowerCase())) {
      return true;
    }

    const emoji = emojiMatchingKeyword(word.toLowerCase());

    if (emoji && !result.includes(emoji)) {
      result.push(emoji);
    }
  });

  return result;
}

function words(txt) {
  return nlp(txt)
    .normalize({ plurals: true, verbs: true })
    .terms()
    .out("array");
}

function findWordEmoji(src) {
  return findEmoji(words(src));
}

function render(emojiStr) {
  if (!emojiStr) {
    return null;
  }

  return twemoji.parse(emojiStr, {
    base: "/static/twemoji/",
    folder: "72x72"
  });
}

module.exports = { findWordEmoji, findEmoji, render };
