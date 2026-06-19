import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveString } from "../assets/js/i18n.js";

const strings = {
  "hub.hero.title": { sk: "Vitaj v KROSe!", en: "Welcome to KROS!" },
  "nav.hub": { sk: "Domov", en: "Hub" },
};

test("resolveString returns the requested language", () => {
  assert.equal(resolveString(strings, "hub.hero.title", "sk"), "Vitaj v KROSe!");
  assert.equal(resolveString(strings, "hub.hero.title", "en"), "Welcome to KROS!");
});

test("resolveString falls back to sk when lang missing", () => {
  assert.equal(resolveString(strings, "nav.hub", "de"), "Domov");
});

test("resolveString returns the key itself when key missing", () => {
  assert.equal(resolveString(strings, "does.not.exist", "sk"), "does.not.exist");
});
