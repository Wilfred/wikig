const emoji = require("./emoji");

describe("Emoji", () => {
  test("Find a word that matches exactly", () => {
    expect(emoji.findEmoji(["python"])).toMatchObject([{ target: "python" }]);
  });

  test("Case insensitivity", () => {
    expect(emoji.findEmoji(["PythoN"])).toMatchObject([{ target: "python" }]);
  });

  test("Replacements", () => {
    expect(emoji.findEmoji(["software"])).toMatchObject([
      { key: "woman_technologist" }
    ]);
  });
});
