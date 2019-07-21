const request = require("supertest");
const app = require("./app");

test("Editing should require auth", done => {
  request(app)
    .get("/edit/Foo")
    .then(res => {
      expect(res.statusCode).toBe(401);
      expect(res.headers["www-authenticate"]).toBe("Basic");
      done();
    });
});
