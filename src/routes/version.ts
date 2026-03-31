const moment = require("moment");
import express from "express";
import os from "os";
import * as emoji from "../lib/emoji";
import { execSync } from "child_process";
const router = express.Router();

router.get("/version", (req, res) => {
  const appUptime = moment
    .duration(-1 * process.uptime(), "seconds")
    .humanize();
  const serverUptime = moment.duration(-1 * os.uptime(), "seconds").humanize();

  const commit = execSync("git rev-parse HEAD").toString();
  const commitUrl = `https://github.com/Wilfred/wikig/commit/${commit}`;

  return res.render("version", {
    title: "Site Version",
    emoji: emoji.render("⚙️"),
    version: process.versions.node,
    commit: commit.substring(0, 8),
    commitUrl,
    appUptime,
    serverUptime,
  });
});

export default router;
