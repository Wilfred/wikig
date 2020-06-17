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

describe("Splitting WikiWords", () => {
  test("Simple", () => {
    expect(camelcase.splitParts("FooBar")).toStrictEqual(["Foo", "Bar"]);
  });
  test("Acronym in middle", () => {
    expect(camelcase.splitParts("FooABCBar")).toStrictEqual([
      "Foo",
      "ABC",
      "Bar"
    ]);
  });
  test("Acronym at start", () => {
    expect(camelcase.splitParts("ABCFoo")).toStrictEqual(["ABC", "Foo"]);
  });
  test("Acronym at end", () => {
    expect(camelcase.splitParts("FooABC")).toStrictEqual(["Foo", "ABC"]);
  });
});
