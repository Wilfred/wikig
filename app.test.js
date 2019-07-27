const request = require("supertest");
const app = require("./app");

describe("Authentication", () => {
  test("Editing pages", done => {
    request(app)
      .get("/edit/Foo")
      .then(res => {
        expect(res.statusCode).toBe(401);
        expect(res.headers["www-authenticate"]).toBe("Basic");
        done();
      });
  });

  test("Creating pages", done => {
    request(app)
      .get("/new")
      .then(res => {
        expect(res.statusCode).toBe(401);
        expect(res.headers["www-authenticate"]).toBe("Basic");
        done();
      });
  });
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

describe("Editing", () => {
  test("/new", done => {
    request(app)
      .get("/new")
      .auth("admin", ADMIN_PASSWORD)
      .expect(200, done);
  });
});

test("/all", done => {
  request(app)
    .get("/all")
    .expect(200, done);
});
