import cacheManager from "cache-manager";

const memoryCache = cacheManager.caching({
  store: "memory",
  max: 10000,
  ttl: 24 * 60 * 60,
});

export default memoryCache;
