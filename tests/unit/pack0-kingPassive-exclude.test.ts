import { describe, test, expect } from "bun:test";
import { kingPassive } from "../../src/detectors/kingPassive.js";

// Real detector — no mocking. Exclusion injected through params only.
// kingPassive currently ignores params (_params). GREEN will add exclude seam.

// ============================================================
// AC4.1 — basic exclude: "been pressured" suppressed; other passive remains
// ============================================================
describe("AC4.1: single-term exclude suppresses matched passive span", () => {
  test('exclude:["been pressured"] over text with "has been pressured" + another passive → 1 finding remains', () => {
    // "has been pressured" → passive span "been pressured" should be excluded.
    // "is considered" → should remain.
    const text = "He has been pressured into it. The case is considered closed.";
    const findings = kingPassive(text, { exclude: ["been pressured"] });
    // Without exclude seam (current prod), both are flagged → this test would pass vacuously.
    // The AC requires ONLY "been pressured" suppressed, so assert exactly 1 finding
    // AND that no finding's match lowercased is "been pressured".
    expect(findings.length).toBe(1);
    expect(findings.every((f) => !f.match?.toLowerCase().includes("been pressured"))).toBe(true);
  });
});

// ============================================================
// AC4.2 — case-insensitive exclusion
// ============================================================
describe("AC4.2: exclude is case-insensitive", () => {
  test('"Been Pressured" in text, exclude:["been pressured"] → suppressed (0 findings for that span)', () => {
    // Only "Been Pressured" in text; no other passives → 0 findings after exclusion.
    const text = "She has Been Pressured to comply.";
    const findings = kingPassive(text, { exclude: ["been pressured"] });
    // Every finding must NOT match "been pressured" (case-insensitive)
    expect(findings.every((f) => !f.match?.toLowerCase().includes("been pressured"))).toBe(true);
    // With only one passive in the text and it excluded → 0 findings
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// AC4.3 — regression: absent exclude → all passives flagged
// ============================================================
describe("AC4.3: absent exclude does not suppress (regression guard)", () => {
  test("no exclude param → both passives flagged", () => {
    const text = "He has been pressured into it. The case is considered closed.";
    const findings = kingPassive(text, {});
    expect(findings.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================
// AC4.4 — empty exclude:[] → no suppression
// ============================================================
describe("AC4.4: empty exclude=[] does not suppress", () => {
  test("list=[harness], exclude=[] → passives still flagged", () => {
    const text = "He has been pressured into it. The case is considered closed.";
    const findings = kingPassive(text, { exclude: [] });
    expect(findings.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================
// AC4.5 — hostile mixed-type exclude: non-strings ignored, string entry excludes
// ============================================================
describe("AC4.5: mixed-type exclude ignores non-string entries defensively", () => {
  test('exclude:["been pressured", 42, null] → no throw; "been pressured" excluded, other passive remains', () => {
    const text = "He has been pressured into it. The case is considered closed.";
    let findings: ReturnType<typeof kingPassive>;
    expect(() => {
      findings = kingPassive(text, {
        exclude: ["been pressured", 42, null] as unknown[],
      });
    }).not.toThrow();
    // "been pressured" excluded, "is considered" remains → 1 finding
    expect(findings!.length).toBe(1);
    expect(findings!.every((f) => !f.match?.toLowerCase().includes("been pressured"))).toBe(true);
  });
});

// ============================================================
// AC4.6 — excluding an absent span is a no-op
// ============================================================
describe("AC4.6: excluding a span not in text is a no-op", () => {
  test('exclude:["was forgotten"] over text with "is considered" only → finding remains', () => {
    const text = "The case is considered closed.";
    const findings = kingPassive(text, { exclude: ["was forgotten"] });
    // "was forgotten" not in text → no effect; "is considered" should still be flagged.
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });
});
