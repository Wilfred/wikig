const cacheManager = require("cache-manager");

const memoryCache = cacheManager.caching({
  store: "memory",
  max: 10000,
  ttl: 24 * 60 * 60,
});

module.exports = memoryCache;
