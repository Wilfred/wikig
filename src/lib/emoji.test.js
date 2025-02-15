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
      { key: "woman_technologist" },
    ]);
  });

  test("Word blacklist", () => {
    expect(emoji.findEmoji(["data"])).toStrictEqual([]);
  });

  test("Keyword blacklist", () => {
    expect(emoji.findEmoji(["english"])).toStrictEqual([]);
  });

  test("Prefer fewer keywords", () => {
    expect(emoji.findEmoji(["home"])).toMatchObject([{ key: "house" }]);
  });
});

describe("Language analysis", () => {
  test("Plurals", () => {
    expect(emoji.findWordEmoji("pythons")).toMatchObject([{ key: "snake" }]);
  });
});
