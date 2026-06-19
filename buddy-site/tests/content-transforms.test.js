import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugify, parseSubtopics, calloutClassFor, replaceGlossaryTokens,
} from "../assets/js/content-transforms.js";

test("slugify lowercases, strips diacritics, hyphenates", () => {
  assert.equal(slugify("Backlog vs. Sprint"), "backlog-vs-sprint");
  assert.equal(slugify("Stavy úloh"), "stavy-uloh");
});

test("parseSubtopics extracts ## headings with slug ids", () => {
  const md = "# Title\n\nintro\n\n## Async metódy\ntext\n\n## DI\nmore";
  assert.deepEqual(parseSubtopics(md), [
    { id: "async-metody", title: "Async metódy" },
    { id: "di", title: "DI" },
  ]);
});

test("parseSubtopics ignores ## lines inside fenced code blocks", () => {
  const md = "## Real One\ntext\n\n```http\n## TEST-EXPECT-STATUS: [200]\n## TEST-JSON-HAS-ID\n```\n\n## Real Two\nmore";
  assert.deepEqual(parseSubtopics(md), [
    { id: "real-one", title: "Real One" },
    { id: "real-two", title: "Real Two" },
  ]);
});

test("calloutClassFor maps the leading emoji", () => {
  assert.equal(calloutClassFor("💡 Tip: do this"), "tip");
  assert.equal(calloutClassFor("⚠️ Pozor: careful"), "warn");
  assert.equal(calloutClassFor("🏢 V KROSe: internal"), "kros");
  assert.equal(calloutClassFor("plain quote"), null);
});

test("replaceGlossaryTokens swaps {{term:id|text}} for tooltip spans", () => {
  const glossary = { sb: { term_sk: "Service Bus", def_sk: "Fronta správ.",
    def_en: "Message queue." } };
  const out = replaceGlossaryTokens("Use {{term:sb|Service Bus}} here", glossary, "sk");
  assert.match(out, /<span class="term"/);
  assert.match(out, /Service Bus/);
  assert.match(out, /Fronta správ\./);
});

test("replaceGlossaryTokens leaves unknown terms as plain text", () => {
  const out = replaceGlossaryTokens("Use {{term:xx|Foo}} here", {}, "sk");
  assert.equal(out, "Use Foo here");
});
