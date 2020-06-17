// Add zero width spaces to CamelCaseStrings so browsers know where to
// break lines.
function addZeroWidthBreaks(txt) {
  const ZERO_WIDTH_SPACE = "\u200B";
  return splitParts(txt).join(ZERO_WIDTH_SPACE);
}

function isLowerCase(str) {
  return str == str.toLowerCase();
}

// Split FooBarABCBaz as ["Foo", "Bar", "ABC", "Baz"].
function splitParts(wikiword) {
  const chars = wikiword.split("");

  const parts = [];
  let part = "";
  let prev = "";

  chars.forEach(char => {
    if (isLowerCase(prev) && isLowerCase(char)) {
      // 'ab', continue this part.
      part = part + char;
    } else if (isLowerCase(prev) && !isLowerCase(char)) {
      // 'aB', so B starts a new part.
      parts.push(part);
      part = char;
    } else if (!isLowerCase(prev) && isLowerCase(char)) {
      // 'Ab', so A starts a new part.
      parts.push(part.slice(0, -1));
      part = prev + char;
    } else {
      // 'AB', continue this part.
      part = part + char;
    }

    prev = char;
  });

  parts.push(part);

  return parts.filter(p => p != "");
}

function addSpaces(txt) {
  return (
    splitParts(txt)
      .join(" ")
      // TODO: enforce 'Dont' etc is on a word boundary.
      .replace("Dont", "Don't")
      .replace("Arent", "Aren't")
      .replace("Isnt", "Isn't")
  );
}

module.exports = { addZeroWidthBreaks, addSpaces, splitParts };
