"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.findEmoji = findEmoji;
exports.findWordEmoji = findWordEmoji;
exports.render = render;
const _ = __importStar(require("lodash"));
const compromise_1 = __importDefault(require("compromise"));
const emojilib = require("emojilib");
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
  "yes",
];
const KEYWORD_BLACKLIST = [
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
const EMOJI_BLACKLIST = [
  "radio_button", // associated with 'old'
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
  tree: "deciduous_tree",
};
// Return true if `haystack` contains any of the values in `needles`.
function containsAny(haystack, needles) {
  return !_.isEmpty(_.intersection(haystack, needles));
}
// All the emoji in emojilib that we want to use.
function relevantEmoji() {
  let result = emojilib.lib;
  // Ignore emoji whose name is in the blacklist.
  result = _.omit(result, EMOJI_BLACKLIST);
  // Ignore emoji if any keywords are in the blacklist.
  result = _.omitBy(result, (value) =>
    containsAny(value.keywords, KEYWORD_BLACKLIST),
  );
  return result;
}
function keywordMap(emojiMap) {
  const result = {};
  // TODO: Iterate object more nicely.
  Object.keys(emojiMap).forEach((key) => {
    const value = { key, ...emojiMap[key] };
    value.keywords.forEach((keyword) => {
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
function prefixMap(emojiMap) {
  // If we still haven't found something, try splitting names. This is
  // useful for matching 'page_facing_u' to 'page'.
  const result = {};
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
const ALL_EMOJI = relevantEmoji();
const EMOJI_BY_KEYWORD = keywordMap(ALL_EMOJI);
const EMOJI_BY_PREFIX = prefixMap(ALL_EMOJI);
function emojiMatchingKeyword(originalTarget) {
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
function findEmoji(words) {
  const result = [];
  _.forEach(words, (word) => {
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
  return (0, compromise_1.default)(txt)
    .normalize({ plurals: true, verbs: true })
    .terms()
    .out("array");
}
function findWordEmoji(src) {
  return findEmoji(words(src));
}
/** Replace emojis in emojiStr with img tags.
 */
function render(emojiStr) {
  if (!emojiStr) {
    return null;
  }
  return twemoji.parse(emojiStr, {
    base: "/static/twemoji/",
    folder: "72x72",
  });
}
