const moment = require("moment");
const express = require("express");
const os = require("os");
const router = express.Router();

router.get("/version", function(req, res) {
  const appUptime = moment
    .duration(-1 * process.uptime(), "seconds")
    .humanize();
  const serverUptime = moment.duration(-1 * os.uptime(), "seconds").humanize();

  return res.render("version", {
    title: "Site Version",
    version: process.versions.node,
    appUptime,
    serverUptime
  });
});

module.exports = router;
