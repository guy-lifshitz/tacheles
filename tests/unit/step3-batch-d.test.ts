import { describe, test, expect } from "bun:test";
import { check, getRegisteredDetectorNames } from "../../src/check";
import { resolveDetector, getAllTells } from "../../src/tells/registry";
import type { Profile } from "../../src/types";

function singleTellProfile(tellId: string, severity: "HIGH" | "MEDIUM" | "LOW"): Profile {
  return {
    name: "test-step3-batch-d",
    rules: [{ tellId, enabled: true, severity }],
  };
}

// ============================================================
// s-em-dash-density
// ============================================================
describe("s-em-dash-density", () => {
  test("AC1 positive: ≥30-word paragraph with density > 4/1000 → exactly 1 MEDIUM finding", () => {
    const profile = singleTellProfile("s-em-dash-density", "MEDIUM");
    // "word ".repeat(34) = 34 tokens; "a — b — c — d" = 7 tokens (incl. 3 em-dashes)
    // words=41 ≥ 30, emCount=3, density≈73/1000 > 4 → fires
    const findings = check(
      "word ".repeat(34) + "a — b — c — d",
      profile
    ).filter((f) => f.ruleId === "s-em-dash-density");
    expect(findings.length).toBe(1);
    expect(findings[0]!.severity).toBe("MEDIUM");
  });

  test("AC2 no-em-dash negative: ≥30 words with zero em-dashes → 0 findings", () => {
    // Verify detector is active: resolveDetector returns non-null after flipping status planned→active
    expect(resolveDetector("s-em-dash-density")).not.toBeNull();
    const profile = singleTellProfile("s-em-dash-density", "MEDIUM");
    const findings = check(
      "word ".repeat(40),
      profile
    ).filter((f) => f.ruleId === "s-em-dash-density");
    expect(findings.length).toBe(0);
  });

  test("AC3 small-sample guard: <minWords text → 0 findings regardless of density", () => {
    // Verify detector is active: resolveDetector returns non-null after flipping status planned→active
    expect(resolveDetector("s-em-dash-density")).not.toBeNull();
    const profile = singleTellProfile("s-em-dash-density", "MEDIUM");
    // ~9 tokens (including em-dashes as tokens) < 30 → minWords guard fires
    const findings = check(
      "It worked — mostly — and then — done.",
      profile
    ).filter((f) => f.ruleId === "s-em-dash-density");
    expect(findings.length).toBe(0);
  });

  test("AC4 under-threshold negative: 1 em-dash in ~300 words (density < 4/1000) → 0 findings", () => {
    // Verify detector is active: resolveDetector returns non-null after flipping status planned→active
    expect(resolveDetector("s-em-dash-density")).not.toBeNull();
    const profile = singleTellProfile("s-em-dash-density", "MEDIUM");
    // words≈304, emCount=1, density≈3.28/1000 < 4 → threshold not exceeded
    const findings = check(
      "word ".repeat(300) + "a — b",
      profile
    ).filter((f) => f.ruleId === "s-em-dash-density");
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// r-sentence-triad
// ============================================================
describe("r-sentence-triad", () => {
  test("AC5 positive: 3 consecutive sentences sharing opener → exactly 1 MEDIUM finding", () => {
    const profile = singleTellProfile("r-sentence-triad", "MEDIUM");
    const findings = check(
      "It reports the result. It marks the failure. It writes the log.",
      profile
    ).filter((f) => f.ruleId === "r-sentence-triad");
    expect(findings.length).toBe(1);
    expect(findings[0]!.severity).toBe("MEDIUM");
  });

  test("AC6 two-only negative: only 2 sentences share an opener → 0 findings", () => {
    // Verify detector is active: resolveDetector returns non-null after flipping status planned→active
    expect(resolveDetector("r-sentence-triad")).not.toBeNull();
    const profile = singleTellProfile("r-sentence-triad", "MEDIUM");
    const findings = check(
      "It reports the result. It marks the failure. Then we stop.",
      profile
    ).filter((f) => f.ruleId === "r-sentence-triad");
    expect(findings.length).toBe(0);
  });

  test("AC7 single-list negative: 3-item comma list is one sentence → 0 findings", () => {
    // Verify detector is active: resolveDetector returns non-null after flipping status planned→active
    expect(resolveDetector("r-sentence-triad")).not.toBeNull();
    const profile = singleTellProfile("r-sentence-triad", "MEDIUM");
    // Single sentence — sentence-split never forms a 3-sentence window
    const findings = check(
      "It was efficient, reliable, and effective.",
      profile
    ).filter((f) => f.ruleId === "r-sentence-triad");
    expect(findings.length).toBe(0);
  });

  test("AC8 varied-opener negative: 3 sentences with different openers → 0 findings", () => {
    // Verify detector is active: resolveDetector returns non-null after flipping status planned→active
    expect(resolveDetector("r-sentence-triad")).not.toBeNull();
    const profile = singleTellProfile("r-sentence-triad", "MEDIUM");
    const findings = check(
      "The cat sat down. A dog ran past. Birds flew away.",
      profile
    ).filter((f) => f.ruleId === "r-sentence-triad");
    expect(findings.length).toBe(0);
  });

  test("AC9 run-of-four positive: 4 consecutive sentences sharing opener → ≥1 finding", () => {
    const profile = singleTellProfile("r-sentence-triad", "MEDIUM");
    const findings = check(
      "We ship. We test. We log. We learn.",
      profile
    ).filter((f) => f.ruleId === "r-sentence-triad");
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// Registry activation (AC10)
// ============================================================
describe("Registry activation (AC10)", () => {
  test("resolveDetector('s-em-dash-density') returns non-null string after activation", () => {
    const name = resolveDetector("s-em-dash-density");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });

  test("resolveDetector('r-sentence-triad') returns non-null string after activation", () => {
    const name = resolveDetector("r-sentence-triad");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });
});

// ============================================================
// DETECTORS map cross-check (SFH-002 guard)
// ============================================================
describe("DETECTORS map cross-check", () => {
  test("every active non-llm-only registry entry has a wired detector in DETECTORS map", () => {
    const wired = new Set(getRegisteredDetectorNames());
    for (const tell of getAllTells()) {
      if (tell.status === "active" && tell.method !== "llm-only") {
        expect(wired.has(tell.detector)).toBe(true);
      }
    }
  });
});
