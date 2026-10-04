import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const fixturePath = new URL("./fixtures/security-cases.json", import.meta.url);

test("security training fixtures are static, structured examples", async () => {
  const fixtureText = await readFile(fileURLToPath(fixturePath), "utf8");
  const catalog = JSON.parse(fixtureText);

  assert.match(catalog.notice, /must never be imported or executed/i);
  assert.ok(Array.isArray(catalog.cases));
  assert.deepEqual(
    catalog.cases.map(({ id }) => id),
    [
      "sql-injection",
      "command-injection",
      "path-traversal",
      "insecure-direct-object-reference",
      "hardcoded-credential",
    ],
  );

  for (const trainingCase of catalog.cases) {
    assert.match(trainingCase.weakness, /^CWE-\d+$/);
    assert.equal(typeof trainingCase.source, "string");
    assert.equal(typeof trainingCase.signal, "string");
  }
});
