import * as db from "./db";
import app from "./app";
import request from "supertest";

beforeAll(async () => {
  await db.init();
});

test("/random with no pages redirects to the index", async () => {
  const res = await request(app).get("/random");
  expect(res.statusCode).toBe(302);
  expect(res.headers.location).toBe("/");
});
