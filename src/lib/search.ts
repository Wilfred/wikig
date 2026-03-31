import _ from "lodash";
import Fuse from "fuse.js";
import stringSimilarity from "string-similarity";
import * as db from "../db";

export function similarNames(name: string, names: string[]): string[] {
  let matches = stringSimilarity.findBestMatch(name, names).ratings;
  matches = _.sortBy(matches, "rating").map((match) => match.target);
  matches.reverse();

  return matches.filter((m) => m !== name);
}

// Find other pages whose name looks similar.
// TODO: Consider word boundaries, so BananaPie and BandanaClothes are
// less similar.
export async function similarPages(name: string): Promise<string[]> {
  const names = await db.allPageNames();
  const nameStrings = names.map((n) => n.name);
  return similarNames(name, nameStrings);
}

export async function search(input: string): Promise<any[]> {
  const pages = await db.allPages();
  const fuse = new Fuse(pages, {
    keys: ["name", "content"],
  });
  return fuse.search(input).map((r) => r.item);
}
