import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, test, expect } from "bun:test";
import { check } from "../src/check";
import type { Profile } from "../src/types";

// Load profile from JSON
function loadProfile(name: string): Profile {
  const path = `../src/profiles/${name}.json`;
  const content = readFileSync(new URL(path, import.meta.url), "utf-8");
  return JSON.parse(content);
}

const FIXTURES = resolve(import.meta.dir, "fixtures");

describe("Acceptance Tests", () => {
  test("negative seed: ≥3 HIGH findings", () => {
    const text = readFileSync(resolve(FIXTURES, "negative-slop.md"), "utf-8");
    const profile = loadProfile("essay-en");
    const findings = check(text, profile);
    const high = findings.filter((f) => f.severity === "HIGH");
    expect(high.length).toBeGreaterThanOrEqual(3);
  });

  test("positive seed: 0 HIGH findings", () => {
    const text = readFileSync(resolve(FIXTURES, "positive-clean.md"), "utf-8");
    const profile = loadProfile("essay-en");
    const findings = check(text, profile);
    const high = findings.filter((f) => f.severity === "HIGH");
    expect(high.length).toBe(0);
  });
});
