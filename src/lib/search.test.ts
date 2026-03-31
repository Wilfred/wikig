import * as search from "./search";

describe("String similarity", () => {
  test("Similar names", () => {
    expect(search.similarNames("Foo", ["Foob", "Foo", "Abc"])).toStrictEqual([
      "Foob",
      "Abc",
    ]);
  });
});
