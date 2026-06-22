import { readFileSync } from "fs";
import { describe, test, expect } from "bun:test";
import { check } from "../../src/check.js";
import type { Profile, Finding } from "../../src/types.js";

// D1CF5FDF collect-safety: profile loaded inside each test body (or beforeAll),
// never as a top-level static import. File absent until GREEN → throws at assert
// time, not at collect time.

function loadProfile(name: string): Profile {
  const url = new URL(`../../src/profiles/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf-8")) as Profile;
}

const FIXTURE = "We harness a robust test harness. Then we delve deeper.";

// ============================================================
// AC1 — profile parses; name, channel, rules non-empty
// ============================================================
describe("AC1: technical-en profile parses and has required top-level fields", () => {
  test('name==="technical-en", channel==="technical", rules non-empty', () => {
    const profile = loadProfile("technical-en");
    expect(profile.name).toBe("technical-en");
    expect(profile.channel).toBe("technical");
    expect(Array.isArray(profile.rules)).toBe(true);
    expect(profile.rules.length).toBeGreaterThan(0);
  });
});

// ============================================================
// AC2 — s-ascii-only severity === LOW
// ============================================================
describe("AC2: s-ascii-only rule has severity LOW", () => {
  test('s-ascii-only severity==="LOW" (lowered from HIGH in substack profile)', () => {
    const profile = loadProfile("technical-en");
    const rule = profile.rules.find((r) => r.tellId === "s-ascii-only");
    expect(rule).toBeDefined();
    expect(rule!.severity).toBe("LOW");
  });
});

// ============================================================
// AC3 — s-banned-vocab: enabled=true, severity=HIGH, exclude includes "harness"
// ============================================================
describe("AC3: s-banned-vocab rule is enabled HIGH with harness in params.exclude", () => {
  test('enabled===true, severity==="HIGH", params.exclude array contains "harness"', () => {
    const profile = loadProfile("technical-en");
    const rule = profile.rules.find((r) => r.tellId === "s-banned-vocab");
    expect(rule).toBeDefined();
    expect(rule!.enabled).toBe(true);
    expect(rule!.severity).toBe("HIGH");
    const exclude = rule!.params?.exclude;
    expect(Array.isArray(exclude)).toBe(true);
    expect((exclude as unknown[]).map((t) => String(t).toLowerCase())).toContain("harness");
  });
});

// ============================================================
// AC4 — r-italic-drama is disabled
// ============================================================
describe("AC4: r-italic-drama rule has enabled===false", () => {
  test("r-italic-drama enabled===false (prose-drama tell disabled for technical register)", () => {
    const profile = loadProfile("technical-en");
    const rule = profile.rules.find((r) => r.tellId === "r-italic-drama");
    expect(rule).toBeDefined();
    expect(rule!.enabled).toBe(false);
  });
});

// ============================================================
// AC5 — fixture: "harness" not flagged, "delve" + "robust" ARE flagged
// ============================================================
describe("AC5: check() with technical-en — harness excluded, delve and robust flagged", () => {
  test('no s-banned-vocab finding for "harness"; findings exist for "delve" and "robust"', () => {
    const profile = loadProfile("technical-en");
    const findings: Finding[] = check(FIXTURE, profile).filter(
      (f) => f.ruleId === "s-banned-vocab"
    );

    // "harness" must NOT appear in any s-banned-vocab finding
    const harnessFindings = findings.filter(
      (f) => f.match != null && f.match.toLowerCase() === "harness"
    );
    expect(harnessFindings.length).toBe(0);

    // "delve" MUST appear
    const delveFindings = findings.filter(
      (f) => f.match != null && f.match.toLowerCase() === "delve"
    );
    expect(delveFindings.length).toBeGreaterThanOrEqual(1);

    // "robust" MUST appear
    const robustFindings = findings.filter(
      (f) => f.match != null && f.match.toLowerCase() === "robust"
    );
    expect(robustFindings.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// AC6 — technical-en HIGH count < essay-en HIGH count on same fixture
// ============================================================
describe("AC6: technical-en produces fewer HIGH findings than essay-en on same fixture", () => {
  test("HIGH count(technical-en) < HIGH count(essay-en) — register-noise reduced", () => {
    const technicalProfile = loadProfile("technical-en");
    const substackProfile = loadProfile("essay-en");

    const technicalHigh = check(FIXTURE, technicalProfile).filter(
      (f) => f.severity === "HIGH"
    ).length;
    const substackHigh = check(FIXTURE, substackProfile).filter(
      (f) => f.severity === "HIGH"
    ).length;

    expect(technicalHigh).toBeLessThan(substackHigh);
  });
});

// ============================================================
// AC7 — same 27 tellIds in technical-en as in essay-en; all severities valid
// ============================================================
describe("AC7: technical-en covers the same 27 tellIds as essay-en; all severities valid", () => {
  test("tellId sets are equal; every severity ∈ {HIGH, MEDIUM, LOW}", () => {
    const technicalProfile = loadProfile("technical-en");
    const substackProfile = loadProfile("essay-en");

    const technicalIds = new Set(technicalProfile.rules.map((r) => r.tellId));
    const substackIds = new Set(substackProfile.rules.map((r) => r.tellId));

    // Every tellId in substack must be present in technical-en (no tells dropped)
    for (const id of substackIds) {
      expect(technicalIds.has(id)).toBe(true);
    }
    // And vice-versa (no extra tells added)
    for (const id of technicalIds) {
      expect(substackIds.has(id)).toBe(true);
    }

    // Total count must match (27 tells)
    expect(technicalIds.size).toBe(substackIds.size);

    // Every severity must be one of the three valid values
    const validSeverities = new Set(["HIGH", "MEDIUM", "LOW"]);
    for (const rule of technicalProfile.rules) {
      expect(validSeverities.has(rule.severity)).toBe(true);
    }
  });
});
