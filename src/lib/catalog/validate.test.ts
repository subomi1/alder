import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApiError } from "./errors.ts";
import {
  dollarsToCents,
  emailSchema,
  likePattern,
  normalizeList,
  passwordSchema,
  reviewInput,
  slugify,
} from "./validate.ts";
import { parse } from "./validate.ts";

describe("catalog validation", () => {
  it("slugifies names without keeping punctuation", () => {
    assert.equal(slugify("Kettle No. 4"), "kettle-no-4");
    assert.equal(slugify("  ---  "), "object");
  });

  it("builds a bound LIKE pattern and strips wildcards", () => {
    assert.equal(likePattern("  lamp  "), "%lamp%");
    assert.equal(likePattern("%_\\"), "");
    assert.equal(likePattern("a%b_c"), "%abc%");
  });

  it("rejects a rating outside 1 to 5", () => {
    assert.throws(
      () =>
        parse(reviewInput, {
          productId: 1,
          score: 0,
          title: "Honest note",
          body: "This is long enough to be a real review.",
        }),
      (err: unknown) => err instanceof ApiError && err.status === 400,
    );
    assert.throws(
      () =>
        parse(reviewInput, {
          productId: 1,
          score: 6,
          title: "Honest note",
          body: "This is long enough to be a real review.",
        }),
      (err: unknown) => err instanceof ApiError && err.status === 400,
    );
  });

  it("accepts a complete review, including text that must be escaped later", () => {
    const review = parse(reviewInput, {
      productId: 3,
      score: 4,
      title: "<script>alert(1)</script>",
      body: "The markup is stored as text and rendered as text, not HTML.",
    });
    assert.equal(review.score, 4);
    assert.match(review.title, /script/);
  });

  it("rejects SQL-shaped category filters before they reach the query", () => {
    assert.throws(
      () => normalizeList({ category: "listening' OR 1=1 --", q: "", sort: "rating" }),
      (err: unknown) => err instanceof ApiError && err.status === 400,
    );
  });

  it("keeps a search payload as a value, not a sort column", () => {
    const list = normalizeList({ q: "'; drop table products; --", sort: "newest" });
    assert.equal(list.sort, "newest");
    assert.match(likePattern(list.q), /drop table products/);
  });

  it("parses dollar prices into cents and rejects junk", () => {
    assert.equal(dollarsToCents("164"), 16400);
    assert.equal(dollarsToCents("24.50"), 2450);
    assert.equal(dollarsToCents("24.5"), 2450);
    assert.equal(dollarsToCents("1,000"), null);
    assert.equal(dollarsToCents("-1"), null);
    assert.equal(dollarsToCents("6000"), null);
  });

  it("checks password and email shape", () => {
    assert.equal(passwordSchema.safeParse("short1").success, false);
    assert.equal(passwordSchema.safeParse("longpassword").success, false);
    assert.equal(passwordSchema.safeParse("harbor-24").success, true);
    assert.equal(emailSchema.safeParse("not-an-email").success, false);
    assert.equal(emailSchema.safeParse("ada@alder.test").success, true);
  });
});
