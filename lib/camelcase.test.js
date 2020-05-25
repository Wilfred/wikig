const camelcase = require("./camelcase");

describe("Camelcase", () => {
  test("Add spaces to simple WikiWords", () => {
    expect(camelcase.addSpaces("FooBar")).toBe("Foo Bar");
  });

  test("Handle common contractions", () => {
    expect(camelcase.addSpaces("FooDontBar")).toBe("Foo Don't Bar");
    expect(camelcase.addSpaces("FooIsntBar")).toBe("Foo Isn't Bar");
    expect(camelcase.addSpaces("FoosArentBars")).toBe("Foos Aren't Bars");
  });
});
