import * as _ from "lodash";
import nlp from "compromise";
const emojilib = require("emojilib");
const twemoji = require("twemoji");

type Emoji = {
  keywords: string[];
  char: string;
  fitzpatrick_scale: boolean;
  category: string;
};

type LabelledEmoji = Emoji & { key: string; target: string };

const WORD_BLACKLIST: string[] = [
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
  "yes",
];

const KEYWORD_BLACKLIST: string[] = [
  // We sometimes find valid emoji like 'have' mapping to 'u6709' but
  // it doesn't make sense for english readers.
  "chinese",
  "japanese",
  // Middle finger gesture.
  "rude",
  // Word emoji are not visually interesting.
  "words",
  // Ignore countries, as they can be misleading (e.g. "me" is
  // Macedonia).
  "flag",
];

const EMOJI_BLACKLIST: string[] = [
  "radio_button", // associated with 'old'
];

const REPLACEMENTS: {
  [key: string]: string;
} = {
  // The only emojis associated with 'program' are 'radio' and 'tv'.
  program: "programmer",
  // Since we end up using 'male_technologist' for programmer, use
  // woman_technologist for software to balance it.
  software: "woman_technologist",
  // Otherwise we end up with 'trackball' or 'fax' as they have the
  // fewest keywords.
  technology: "computer",
  // The only emoji with 'tree' as a keyword is 'leaves'.
  tree: "deciduous_tree",
};

// Return true if `haystack` contains any of the values in `needles`.
function containsAny(haystack: string[], needles: string[]): boolean {
  return !_.isEmpty(_.intersection(haystack, needles));
}

// All the emoji in emojilib that we want to use.
function relevantEmoji(): { [key: string]: Emoji } {
  let result = emojilib.lib;

  // Ignore emoji whose name is in the blacklist.
  result = _.omit(result, EMOJI_BLACKLIST);

  // Ignore emoji if any keywords are in the blacklist.
  result = _.omitBy(result, (value: Emoji) =>
    containsAny(value.keywords, KEYWORD_BLACKLIST),
  );

  return result;
}

function keywordMap(emojiMap: { [key: string]: Emoji }): {
  [key: string]: Emoji & { key: string };
} {
  const result: { [key: string]: Emoji & { key: string } } = {};

  // TODO: Iterate object more nicely.
  Object.keys(emojiMap).forEach((key) => {
    const value = { key, ...emojiMap[key] };

    value.keywords.forEach((keyword: string) => {
      const prev = result[keyword];

      // Prefer emoji with fewer keywords as they're usually a better
      // match. For example, 'home' matches family emoji, which have
      // lots of keywords, when we really want a building.
      if (prev == null || prev.keywords.length >= value.keywords.length) {
        result[keyword] = value;
      }
    });
  });

  return result;
}

function prefixMap(emojiMap: { [key: string]: Emoji }): {
  [key: string]: Emoji & { key: string };
} {
  // If we still haven't found something, try splitting names. This is
  // useful for matching 'page_facing_u' to 'page'.

  const result: {
    [key: string]: Emoji & { key: string };
  } = {};

  // TODO: Iterate object more nicely.
  Object.keys(emojiMap).forEach((key) => {
    const value = { key, ...emojiMap[key] };

    // Only use the first part, so 'call_me_hand' doesn't match
    // 'me'.
    const prefix = key.split("_")[0];

    if (prefix.length > 1) {
      result[prefix] = value;
    }
  });

  return result;
}

const ALL_EMOJI: { [key: string]: Emoji } = relevantEmoji();
const EMOJI_BY_KEYWORD = keywordMap(ALL_EMOJI);
const EMOJI_BY_PREFIX = prefixMap(ALL_EMOJI);

function emojiMatchingKeyword(originalTarget: string): LabelledEmoji | null {
  const target = REPLACEMENTS[originalTarget] || originalTarget;

  // If there's an emoji with exactly this name, use it.
  const exactMatch = ALL_EMOJI[target];
  if (exactMatch != null) {
    return { key: target, target: originalTarget, ...exactMatch };
  }

  // Otherwise, try to find an emoji that contains this word as a keyword.
  const keywordMatch = EMOJI_BY_KEYWORD[target];
  if (keywordMatch != null) {
    return { target: originalTarget, ...keywordMatch };
  }

  // If we still haven't found something, try splitting names.
  // useful for matching 'page_facing_u' to 'page'. Don't consider
  // very short targets, as 'do' or 'no' isn't relevant.
  const prefixMatch = EMOJI_BY_PREFIX[target];
  if (target.length > 1 && prefixMatch != null) {
    const prefixMatch = EMOJI_BY_PREFIX[target];
    return { target: originalTarget, ...prefixMatch };
  }

  return null;
}

function findEmoji(words: string[]): LabelledEmoji[] {
  const result: LabelledEmoji[] = [];
  _.forEach(words, (word: string) => {
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

function words(txt: string): string[] {
  return nlp(txt)
    .normalize({ plurals: true, verbs: true })
    .terms()
    .out("array");
}

function findWordEmoji(src: string) {
  return findEmoji(words(src));
}

/** Replace emojis in emojiStr with img tags.
 */
function render(emojiStr: string | null): string | null {
  if (!emojiStr) {
    return null;
  }

  return twemoji.parse(emojiStr, {
    base: "/static/twemoji/",
    folder: "72x72",
  });
}

module.exports = { findWordEmoji, findEmoji, render };
