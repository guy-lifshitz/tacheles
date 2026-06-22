import { describe, test, expect } from "bun:test";
import { check } from "../../src/check";
import { resolveDetector } from "../../src/tells/registry";
import type { Profile } from "../../src/types";

function singleTellProfile(tellId: string, severity: "HIGH" | "MEDIUM" | "LOW"): Profile {
  return {
    name: "test-step3-batch-c",
    rules: [{ tellId, enabled: true, severity }],
  };
}

// ============================================================
// r-significance-announce
// ============================================================
describe("r-significance-announce", () => {
  test("positive: ≥3 MEDIUM findings on significance-announce text (AC1)", () => {
    // resolveDetector returns null while planned — assertion fails in RED phase
    expect(resolveDetector("r-significance-announce")).not.toBeNull();
    const profile = singleTellProfile("r-significance-announce", "MEDIUM");
    const findings = check(
      "Here's the thing: the honest picture is a little surprising.",
      profile
    ).filter((f) => f.ruleId === "r-significance-announce");
    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings.every((f) => f.severity === "MEDIUM")).toBe(true);
  });

  test("negative: 0 findings on neutral sentence (AC2)", () => {
    expect(resolveDetector("r-significance-announce")).not.toBeNull();
    const profile = singleTellProfile("r-significance-announce", "MEDIUM");
    const findings = check(
      "We measured the latency and wrote it down.",
      profile
    ).filter((f) => f.ruleId === "r-significance-announce");
    expect(findings.length).toBe(0);
  });

  test("apostrophe-form: ≥2 findings for contracted phrases (AC3)", () => {
    expect(resolveDetector("r-significance-announce")).not.toBeNull();
    const profile = singleTellProfile("r-significance-announce", "MEDIUM");
    // "it's worth noting" + "what's interesting" → 2 matches
    const findings = check(
      "It's worth noting that what's interesting is the cost.",
      profile
    ).filter((f) => f.ruleId === "r-significance-announce");
    expect(findings.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================
// r-bold-aphorism
// ============================================================
describe("r-bold-aphorism", () => {
  test("positive: exactly 1 HIGH finding on standalone bold line (AC4)", () => {
    expect(resolveDetector("r-bold-aphorism")).not.toBeNull();
    const profile = singleTellProfile("r-bold-aphorism", "HIGH");
    const findings = check(
      "**wall clock is tokens is round trips.**",
      profile
    ).filter((f) => f.ruleId === "r-bold-aphorism");
    expect(findings.length).toBe(1);
    expect(findings[0]!.severity).toBe("HIGH");
  });

  test("minWords guard: 0 findings for single-word bold (AC5)", () => {
    expect(resolveDetector("r-bold-aphorism")).not.toBeNull();
    const profile = singleTellProfile("r-bold-aphorism", "HIGH");
    const findings = check(
      "**Done.**",
      profile
    ).filter((f) => f.ruleId === "r-bold-aphorism");
    expect(findings.length).toBe(0);
  });

  test("label guard: 0 findings for colon-terminated bold (AC6)", () => {
    expect(resolveDetector("r-bold-aphorism")).not.toBeNull();
    const profile = singleTellProfile("r-bold-aphorism", "HIGH");
    const findings = check(
      "**Files in scope:**",
      profile
    ).filter((f) => f.ruleId === "r-bold-aphorism");
    expect(findings.length).toBe(0);
  });

  test("inline negative: 0 findings when bold is embedded in prose (AC7)", () => {
    expect(resolveDetector("r-bold-aphorism")).not.toBeNull();
    const profile = singleTellProfile("r-bold-aphorism", "HIGH");
    const findings = check(
      "This is **really important** to the result.",
      profile
    ).filter((f) => f.ruleId === "r-bold-aphorism");
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// r-italic-drama
// ============================================================
describe("r-italic-drama", () => {
  test("positive: exactly 1 MEDIUM finding on mid-line italic (AC8)", () => {
    expect(resolveDetector("r-italic-drama")).not.toBeNull();
    const profile = singleTellProfile("r-italic-drama", "MEDIUM");
    const findings = check(
      "The subprocess time *is* the wall clock.",
      profile
    ).filter((f) => f.ruleId === "r-italic-drama");
    expect(findings.length).toBe(1);
    expect(findings[0]!.severity).toBe("MEDIUM");
  });

  test("excludeTerms guard: 0 findings for capitalized/identifier italic (AC9)", () => {
    expect(resolveDetector("r-italic-drama")).not.toBeNull();
    const profile = singleTellProfile("r-italic-drama", "MEDIUM");
    // *Authoring* → uppercase → [a-z]+ no match; *config.ts* → dot → [a-z]+ no match
    const findings = check(
      "We shipped *Authoring* and edited *config.ts* today.",
      profile
    ).filter((f) => f.ruleId === "r-italic-drama");
    expect(findings.length).toBe(0);
  });

  test("no-italic negative: 0 findings when no italic present (AC10)", () => {
    expect(resolveDetector("r-italic-drama")).not.toBeNull();
    const profile = singleTellProfile("r-italic-drama", "MEDIUM");
    const findings = check(
      "The subprocess time is the wall clock.",
      profile
    ).filter((f) => f.ruleId === "r-italic-drama");
    expect(findings.length).toBe(0);
  });

  test("underscore form: ≥1 finding for underscore single lowercase word mid-line (AC11)", () => {
    expect(resolveDetector("r-italic-drama")).not.toBeNull();
    const profile = singleTellProfile("r-italic-drama", "MEDIUM");
    const findings = check(
      "It really _is_ the bottleneck.",
      profile
    ).filter((f) => f.ruleId === "r-italic-drama");
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });

  test("leading-token guard: 0 findings when italic is first token on line (AC14)", () => {
    // *really* is the first non-whitespace token → mid-sentence guard skips it
    // This pairs with AC8 (*is* mid-line → 1 finding) to make the guard non-removable
    expect(resolveDetector("r-italic-drama")).not.toBeNull();
    const profile = singleTellProfile("r-italic-drama", "MEDIUM");
    const findings = check(
      "*really* this matters.",
      profile
    ).filter((f) => f.ruleId === "r-italic-drama");
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// Line offset honored (AC12) — uses r-significance-announce on body line 1
// ============================================================
describe("Line offset honored (AC12)", () => {
  test("finding.line accounts for 4-line frontmatter offset", () => {
    // Frontmatter "---\ntitle: t\nauthor: a\n---\n" → lineOffset = 4
    // "Here's the thing..." on body line 1 → finding.line = 1 + 4 = 5
    expect(resolveDetector("r-significance-announce")).not.toBeNull();
    const text = "---\ntitle: t\nauthor: a\n---\nHere's the thing: this matters.";
    const profile = singleTellProfile("r-significance-announce", "MEDIUM");
    const findings = check(text, profile).filter((f) => f.ruleId === "r-significance-announce");
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.line).toBe(5);
  });
});

// ============================================================
// Registry parity + activation (AC13)
// ============================================================
describe("Registry parity + activation (AC13)", () => {
  test("resolveDetector('r-significance-announce') returns non-null string", () => {
    const name = resolveDetector("r-significance-announce");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });

  test("resolveDetector('r-bold-aphorism') returns non-null string", () => {
    const name = resolveDetector("r-bold-aphorism");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });

  test("resolveDetector('r-italic-drama') returns non-null string", () => {
    const name = resolveDetector("r-italic-drama");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });
});

// ============================================================
// boldAphorism default-minWords direct-call (AC15)
// ============================================================
describe("boldAphorism default-minWords direct-call (AC15)", () => {
  test("no-params: 3-word bold → 1 finding; 2-word bold → 0 findings", async () => {
    // Deferred import per D1CF5FDF — module does not exist until GREEN phase;
    // top-level import would cause collection failure (ImportError at collect time).
    const { boldAphorism } = await import("../../src/detectors/boldAphorism.js");
    // 3 words satisfies default minWords 3 → 1 finding
    const r1 = boldAphorism("**alpha beta gamma.**");
    expect(r1.length).toBe(1);
    // 2 words < default minWords 3 → 0 findings; exercises the ?? 3 default branch
    const r2 = boldAphorism("**alpha beta.**");
    expect(r2.length).toBe(0);
  });

  test("no trailing punctuation: [.!?]? is optional — bold without punctuation still fires", async () => {
    const { boldAphorism } = await import("../../src/detectors/boldAphorism.js");
    // No trailing punctuation — regex [.!?]? makes it optional; 3 words satisfies minWords 3
    const r = boldAphorism("**wall clock is tokens**");
    expect(r.length).toBe(1);
  });
});

// ============================================================
// significanceAnnounce absent-list direct-call (AC16)
// ============================================================
describe("significanceAnnounce absent-list direct-call (AC16)", () => {
  test("no-params (absent params.list) → [] without throwing", async () => {
    // Deferred import per D1CF5FDF — module does not exist until GREEN phase.
    const { significanceAnnounce } = await import("../../src/detectors/significanceAnnounce.js");
    // No params → params?.list is undefined → Array.isArray(undefined) = false → list = [] → []
    const result = significanceAnnounce("Here's the thing and the takeaway.");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});
