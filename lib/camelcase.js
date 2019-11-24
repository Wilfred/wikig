// Add zero width spaces to CamelCaseStrings so browsers know where to
// break lines.
function addZeroWidthBreaks(txt) {
  const ZERO_WIDTH_SPACE = "\u200B";
  // Look for transitions from lowercase to uppercase.
  return txt.replace(/([a-z])([A-Z])/g, "$1" + ZERO_WIDTH_SPACE + "$2");
}

module.exports = { addZeroWidthBreaks };
