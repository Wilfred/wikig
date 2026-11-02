declare module "commonmark-linkify" {
  import { Node } from "commonmark";
  function transform(parsed: Node): Node;
  export = transform;
}

declare module "commonmark-twemoji" {
  import { Node } from "commonmark";
  function transform(
    parsed: Node,
    options: { base: string; folder: string },
  ): Node;
  export = transform;
}

declare module "commonmark-wikiwords" {
  import { Node } from "commonmark";
  export function isWikiWord(text: string): boolean;
  export function transform(
    parsed: Node,
    classCallback?: (text: string) => string | null,
    exclude?: string[],
  ): Node;
}

declare module "commonmark-extract-text" {
  export function fromText(text: string): string;
}

declare module "emojilib" {
  const lib: Record<
    string,
    {
      keywords: string[];
      char: string;
      fitzpatrick_scale: boolean;
      category: string;
    }
  >;
  export { lib };
}

declare module "express-cache-middleware" {
  import { Cache } from "cache-manager";
  import { Router } from "express";
  class CacheMiddleware {
    constructor(cache: Cache);
    attach(router: Router): void;
  }
  export = CacheMiddleware;
}
