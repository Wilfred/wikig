const moment = require("moment");
const express = require("express");
const os = require("os");
const router = express.Router();

router.get("/version", (req, res) => {
  const appUptime = moment
    .duration(-1 * process.uptime(), "seconds")
    .humanize();
  const serverUptime = moment.duration(-1 * os.uptime(), "seconds").humanize();

  return res.render("version", {
    title: "Site Version",
    emoji: "⚙️⏲️",
    version: process.versions.node,
    appUptime,
    serverUptime
  });
});

module.exports = router;
