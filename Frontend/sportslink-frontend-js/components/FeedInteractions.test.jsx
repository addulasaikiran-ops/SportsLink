/**
 * Lightweight source-contract checks for the feed interaction component.
 * This repository currently has no frontend unit-test runner installed; these
 * checks run under Node's built-in test runner without adding dependencies.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const componentUrl = new URL("./FeedInteractions.jsx", import.meta.url);
const homeFeedUrl = new URL("./HomeFeed.jsx", import.meta.url);
const component = await readFile(componentUrl, "utf8");
const homeFeed = await readFile(homeFeedUrl, "utf8");

test("uses the documented reaction and comment endpoints and request bodies", () => {
  assert.match(component, /\/api\/posts\/\$\{postId\}\/reactions/);
  assert.match(component, /method: "PUT"[\s\S]*body: JSON\.stringify\(\{ reaction \}\)/);
  assert.match(component, /method: "DELETE"/);
  assert.match(component, /\/api\/posts\/\$\{postId\}\/comments/);
  assert.match(component, /method: "POST"[\s\S]*body: JSON\.stringify\(\{ content \}\)/);
});

test("supports only like, celebrate, and support; enforces the comment limit", () => {
  assert.match(component, /value: "like"/);
  assert.match(component, /value: "celebrate"/);
  assert.match(component, /value: "support"/);
  assert.match(component, /maxLength=\{2000\}/);
  assert.match(component, /content\.length > 2000/);
});

test("prevents repeated submits while in flight and handles helper authentication errors", () => {
  assert.match(component, /if \(reactionBusy\) return/);
  assert.match(component, /if \(commentBusy\) return/);
  assert.match(component, /backendRequest/);
  assert.match(component, /Your session is invalid or expired/);
  assert.match(component, /Please sign in to comment\\./);
});

test("HomeFeed wires interactions per post without enabling the global Spring API flag", () => {
  assert.match(homeFeed, /<FeedInteractions postId=\{post\.id\} currentUserId=\{currentUser\?\.id\}\/>/);
  assert.match(homeFeed, /process\.env\.NEXT_PUBLIC_USE_SPRING_API === "true"/);
});
