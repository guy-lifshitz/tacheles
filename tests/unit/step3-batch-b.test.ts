import { describe, test, expect } from "bun:test";
import { check } from "../../src/check";
import { resolveDetector } from "../../src/tells/registry";
import type { Profile } from "../../src/types";

function singleTellProfile(tellId: string, severity: "HIGH" | "MEDIUM" | "LOW"): Profile {
  return {
    name: "test-step3-batch-b",
    rules: [{ tellId, enabled: true, severity }],
  };
}

// ============================================================
// k-fancy-word
// ============================================================
describe("k-fancy-word", () => {
  test("positive: ≥3 MEDIUM findings on fancy-word sentence (AC1)", () => {
    expect(resolveDetector("k-fancy-word")).not.toBeNull();
    const profile = singleTellProfile("k-fancy-word", "MEDIUM");
    const findings = check(
      "We must utilize the methodology to ascertain the plethora of options.",
      profile
    ).filter((f) => f.ruleId === "k-fancy-word");
    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings.every((f) => f.severity === "MEDIUM")).toBe(true);
  });

  test("negative: 0 findings on clean sentence (AC2)", () => {
    expect(resolveDetector("k-fancy-word")).not.toBeNull();
    const profile = singleTellProfile("k-fancy-word", "MEDIUM");
    const findings = check(
      "We used the method to find the options.",
      profile
    ).filter((f) => f.ruleId === "k-fancy-word");
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// k-cliche-simile
// ============================================================
describe("k-cliche-simile", () => {
  test("positive: ≥1 MEDIUM finding on 'at the speed of light' (AC3)", () => {
    expect(resolveDetector("k-cliche-simile")).not.toBeNull();
    const profile = singleTellProfile("k-cliche-simile", "MEDIUM");
    const findings = check(
      "It scaled at the speed of light.",
      profile
    ).filter((f) => f.ruleId === "k-cliche-simile");
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.every((f) => f.severity === "MEDIUM")).toBe(true);
  });

  test("negative: 0 findings on clean sentence (AC4)", () => {
    expect(resolveDetector("k-cliche-simile")).not.toBeNull();
    const profile = singleTellProfile("k-cliche-simile", "MEDIUM");
    const findings = check(
      "It scaled to ten thousand requests per second.",
      profile
    ).filter((f) => f.ruleId === "k-cliche-simile");
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// k-pet-peeve
// ============================================================
describe("k-pet-peeve", () => {
  test("positive: ≥2 MEDIUM findings on pet-peeve sentence (AC5)", () => {
    expect(resolveDetector("k-pet-peeve")).not.toBeNull();
    const profile = singleTellProfile("k-pet-peeve", "MEDIUM");
    const findings = check(
      "At this point in time the fact that it works matters.",
      profile
    ).filter((f) => f.ruleId === "k-pet-peeve");
    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings.every((f) => f.severity === "MEDIUM")).toBe(true);
  });

  test("negative: 0 findings on clean sentence (AC6)", () => {
    expect(resolveDetector("k-pet-peeve")).not.toBeNull();
    const profile = singleTellProfile("k-pet-peeve", "MEDIUM");
    const findings = check(
      "Now it works, because we fixed the bug.",
      profile
    ).filter((f) => f.ruleId === "k-pet-peeve");
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// k-adverbs
// ============================================================
describe("k-adverbs", () => {
  test("positive: ≥2 HIGH findings on adverb sentence (AC7)", () => {
    expect(resolveDetector("k-adverbs")).not.toBeNull();
    const profile = singleTellProfile("k-adverbs", "HIGH");
    const findings = check(
      "It significantly improved and rapidly evolved.",
      profile
    ).filter((f) => f.ruleId === "k-adverbs");
    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings.every((f) => f.severity === "HIGH")).toBe(true);
  });

  test("exclude-guard: 0 findings when all -ly words are in stoplist (AC8)", () => {
    expect(resolveDetector("k-adverbs")).not.toBeNull();
    const profile = singleTellProfile("k-adverbs", "HIGH");
    const findings = check(
      "The only reply from the family came early.",
      profile
    ).filter((f) => f.ruleId === "k-adverbs");
    expect(findings.length).toBe(0);
  });

  test("mixed: exactly 1 finding for 'remarkably', 'friendly' excluded (AC9)", () => {
    expect(resolveDetector("k-adverbs")).not.toBeNull();
    const profile = singleTellProfile("k-adverbs", "HIGH");
    const findings = check(
      "The friendly team shipped it remarkably fast.",
      profile
    ).filter((f) => f.ruleId === "k-adverbs");
    expect(findings.length).toBe(1);
    expect(findings[0]!.match).toBe("remarkably");
  });
});

// ============================================================
// k-passive
// ============================================================
describe("k-passive", () => {
  test("positive: ≥2 HIGH findings on passive sentence (AC10)", () => {
    expect(resolveDetector("k-passive")).not.toBeNull();
    const profile = singleTellProfile("k-passive", "HIGH");
    const findings = check(
      "40GB was exfiltrated and the files were encrypted.",
      profile
    ).filter((f) => f.ruleId === "k-passive");
    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings.every((f) => f.severity === "HIGH")).toBe(true);
  });

  test("adjectival negative: 0 findings when be-verb + plain adjective (AC11)", () => {
    expect(resolveDetector("k-passive")).not.toBeNull();
    const profile = singleTellProfile("k-passive", "HIGH");
    const findings = check(
      "The data was comprehensive and the report is short.",
      profile
    ).filter((f) => f.ruleId === "k-passive");
    expect(findings.length).toBe(0);
  });

  test("active negative: 0 findings with no be-verb (AC12)", () => {
    expect(resolveDetector("k-passive")).not.toBeNull();
    const profile = singleTellProfile("k-passive", "HIGH");
    const findings = check(
      "Attackers exfiltrated 40GB.",
      profile
    ).filter((f) => f.ruleId === "k-passive");
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// Frontmatter line offset (AC13) — uses k-pet-peeve on body line 1
// ============================================================
describe("Frontmatter line offset (AC13)", () => {
  test("finding.line accounts for 4-line frontmatter offset", () => {
    // Frontmatter "---\ntitle: t\nauthor: a\n---\n" → lineOffset = 4
    // "in order to" on body line 1 → finding.line = 1 + 4 = 5
    expect(resolveDetector("k-pet-peeve")).not.toBeNull();
    const text = "---\ntitle: t\nauthor: a\n---\nin order to fix it.";
    const profile = singleTellProfile("k-pet-peeve", "MEDIUM");
    const findings = check(text, profile).filter((f) => f.ruleId === "k-pet-peeve");
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.line).toBe(5);
  });
});

// ============================================================
// Registry parity after flip (AC14)
// ============================================================
describe("Registry parity after flip (AC14)", () => {
  test("resolveDetector('k-fancy-word') returns non-null string", () => {
    const name = resolveDetector("k-fancy-word");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });

  test("resolveDetector('k-cliche-simile') returns non-null string", () => {
    const name = resolveDetector("k-cliche-simile");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });

  test("resolveDetector('k-pet-peeve') returns non-null string", () => {
    const name = resolveDetector("k-pet-peeve");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });

  test("resolveDetector('k-adverbs') returns non-null string", () => {
    const name = resolveDetector("k-adverbs");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });

  test("resolveDetector('k-passive') returns non-null string", () => {
    const name = resolveDetector("k-passive");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });
});

// ============================================================
// Wordlist missing-params guard (AC15)
// ============================================================
describe("Wordlist missing-params guard (AC15)", () => {
  test("kingFancyWord with undefined params returns [] without throwing", async () => {
    // Deferred import: src/detectors/kingFancyWord.ts does not exist until GREEN phase.
    // Top-level import would cause collection failure (D1CF5FDF).
    const { kingFancyWord } = await import("../../src/detectors/kingFancyWord.js");
    const result = kingFancyWord("utilize the methodology", undefined);
    expect(result.length).toBe(0);
  });
});

// ============================================================
// kingAdverbs bespoke-guard direct-call coverage
// (deterministic_guard_exercising: params?.minLength + Array.isArray(params?.exclude))
// ============================================================
describe("kingAdverbs missing-params guard", () => {
  test("kingAdverbs with undefined params does not throw and uses defaults", async () => {
    const { kingAdverbs } = await import("../../src/detectors/kingAdverbs.js");
    // undefined params → minLength defaults to 5, exclude defaults to []
    const findings = kingAdverbs("It significantly improved.", undefined);
    expect(Array.isArray(findings)).toBe(true);
    // "significantly" is not in the exclude list when exclude=[] → fires
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });
});
