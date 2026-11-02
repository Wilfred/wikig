import request from "supertest";
import app from "./app";
import * as db from "./db";

beforeAll(async () => {
  await db.init();
});

describe("Authentication", () => {
  test("/edit GET", async () => {
    const res = await request(app).get("/edit/Foo");
    expect(res.statusCode).toBe(401);
    expect(res.headers["www-authenticate"]).toBe("Basic");
  });
  test("/edit POST", async () => {
    const page = await db.createPage("EditAuthExample", "foo bar");

    const res = await request(app)
      .post("/edit/" + page.page_id)
      .type("form")
      .send({ name: "EditPostExample", content: "hello world" });
    expect(res.statusCode).toBe(401);
    expect(res.headers["www-authenticate"]).toBe("Basic");
  });

  test("/new GET", async () => {
    const res = await request(app).get("/new");
    expect(res.statusCode).toBe(401);
    expect(res.headers["www-authenticate"]).toBe("Basic");
  });
  test("/new POST", async () => {
    await request(app)
      .post("/new")
      .type("form")
      .send({ name: "FooBarBaz", content: "hello world" })
      .expect(401);
  });
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

describe("Editing", () => {
  test("/new GET", async () => {
    await request(app).get("/new").auth("admin", ADMIN_PASSWORD).expect(200);
  });
  test("/new POST", async () => {
    await request(app)
      .post("/new")
      .type("form")
      .send({ name: "FooBar", content: "hello world" })
      .auth("admin", ADMIN_PASSWORD)
      .expect(302);
  });

  test("/new when page exists", async () => {
    await db.createPage("ExistingPage", "foo bar");

    await request(app)
      .get("/new?name=ExistingPage")
      .auth("admin", ADMIN_PASSWORD)
      .expect(302);
  });

  test("/edit GET", async () => {
    const page = await db.createPage("EditGetExample", "foo bar");

    await request(app)
      .get("/edit/" + page.page_id)
      .auth("admin", ADMIN_PASSWORD)
      .expect(200);
  });
  test("/edit POST", async () => {
    const page = await db.createPage("EditPostExample2", "foo bar");

    await request(app)
      .post("/edit/" + page.page_id)
      .type("form")
      .send({ name: "EditPostExample2", content: "hello world" })
      .auth("admin", ADMIN_PASSWORD)
      .expect(302);
  });
});

describe("Database errors", () => {
  test("init rejects when tables already exist", async () => {
    await expect(db.init()).rejects.toThrow(/already exists/);
  });

  test("/new POST with an existing name responds with 500", async () => {
    await db.createPage("DuplicateNewPage", "foo bar");

    await request(app)
      .post("/new")
      .type("form")
      .send({ name: "DuplicateNewPage", content: "hello world" })
      .auth("admin", ADMIN_PASSWORD)
      .timeout(2000)
      .expect(500);
  });

  test("/edit POST renaming to an existing name responds with 500", async () => {
    await db.createPage("RenameTarget", "foo bar");
    const page = await db.createPage("RenameSource", "foo bar");

    await request(app)
      .post("/edit/" + page.page_id)
      .type("form")
      .send({ name: "RenameTarget", content: "hello world" })
      .auth("admin", ADMIN_PASSWORD)
      .expect(500);

    const unchanged = await db.getPage(page.page_id);
    expect(unchanged?.name).toBe("RenameSource");
  });

  test("/all renders the error page and logs when the database fails", async () => {
    const dbError = new Error("SQLITE_ERROR: simulated failure");
    const allPages = jest.spyOn(db, "allPages").mockRejectedValue(dbError);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const res = await request(app).get("/all").timeout(2000).expect(500);

      expect(res.headers["content-type"]).toMatch(/text\/html/);
      expect(res.text).toContain("Something went wrong");
      expect(res.text).not.toBe("Internal Server Error");
      expect(consoleError).toHaveBeenCalledWith(dbError);
    } finally {
      allPages.mockRestore();
      consoleError.mockRestore();
    }
  });
});

describe("Viewing", () => {
  test("/", async () => {
    await request(app).get("/").expect(302);
  });
  test("/all", async () => {
    await request(app).get("/all").expect(200);
  });

  test("/random", async () => {
    await request(app).get("/random").expect(302);
  });

  test("/version", async () => {
    await request(app).get("/version").expect(200);
  });

  test("/AnExamplePage", async () => {
    await db.createPage("AnExamplePage", "foo **bar**");
    const res = await request(app).get("/AnExamplePage").expect(200);
    expect(res.text).toContain("<p>foo <strong>bar</strong></p>");
  });

  test("/NoSuchPage", async () => {
    await request(app).get("/NoSuchPage").expect(404);
  });

  test("/search?term=foo", async () => {
    await request(app).get("/search?term=foo").expect(200);
  });

  test("/search", async () => {
    await request(app).get("/search").expect(200);
  });
});

describe("Static content", () => {
  test("/robots.txt", async () => {
    await request(app).get("/robots.txt").expect(200);
  });
});
