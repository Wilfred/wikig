const _ = require("lodash");
const stringSimilarity = require("string-similarity");
const db = require("../db");
const Fuse = require("fuse.js");

function similarNames(name, names) {
  let matches = stringSimilarity.findBestMatch(name, names).ratings;
  matches = _.sortBy(matches, "rating").map(match => match.target);
  matches.reverse();

  return matches.filter(m => m !== name);
}

// Find other pages whose name looks similar.
// TODO: Consider word boundaries, so BananaPie and BandanaClothes are
// less similar.
function similarPages(name, cb) {
  db.allPageNames((err, names) => {
    if (err) {
      return cb(err);
    }

    names = names.map(n => n.name);
    return cb(null, similarNames(name, names));
  });
}

function search(input, cb) {
  db.allPages((err, pages) => {
    if (err) {
      return cb(err);
    }

    const fuse = new Fuse(pages, {
      keys: ["name", "content"]
    });
    const results = fuse.search(input).map(r => r.item);
    return cb(null, results);
  });
}

module.exports = { search, similarNames, similarPages };
