// Add 'shy hyphens' to CamelCaseStrings so browsers know where to
// break lines.
// https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens#Suggesting_line_break_opportunities
export function addShyHyphen(txt: string): string {
  const SHY_TAB = "\u00ad";
  return splitParts(txt).join(SHY_TAB);
}

function isLowerCase(str: string): boolean {
  return str == str.toLowerCase();
}

// Split FooBarABCBaz as ["Foo", "Bar", "ABC", "Baz"].
export function splitParts(wikiword: string): string[] {
  const chars = wikiword.split("");

  const parts = [];
  let part = "";
  let prev = "";

  chars.forEach((char) => {
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

  return parts.filter((p) => p != "");
}

export function addSpaces(txt: string): string {
  return (
    splitParts(txt)
      .join(" ")
      // TODO: enforce 'Dont' etc is on a word boundary.
      .replace("Dont", "Don't")
      .replace("Arent", "Aren't")
      .replace("Isnt", "Isn't")
  );
}
