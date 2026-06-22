import { describe, test, expect } from "bun:test";
import { makeWordlistDetector } from "../../src/detectors/wordlist.js";

// Real detector — no mocking. Exclusion injected through params only.
const detect = makeWordlistDetector("s-banned-vocab", "HIGH", "AI vocabulary");

// ============================================================
// AC1 — basic exclude: "harness" skipped, "leverage" flagged
// ============================================================
describe("AC1: single-term exclude filters matched term", () => {
  test('list=[harness,leverage], exclude=[harness] → exactly 1 finding ("leverage")', () => {
    const findings = detect(
      "harness the leverage here",
      { list: ["harness", "leverage"], exclude: ["harness"] }
    );
    expect(findings.length).toBe(1);
    expect(findings[0]!.match!.toLowerCase()).toBe("leverage");
  });
});

// ============================================================
// AC2 — case-insensitive exclusion: "Harness" / "HARNESS" both suppressed
// ============================================================
describe("AC2: exclude is case-insensitive", () => {
  test('text "Harness the HARNESS", exclude=["harness"] → 0 findings', () => {
    const findings = detect(
      "Harness the HARNESS",
      { list: ["harness"], exclude: ["harness"] }
    );
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// AC3 — regression: absent exclude → today's behavior (harness IS flagged)
// ============================================================
describe("AC3: absent exclude does not suppress (regression guard)", () => {
  test("list=[harness], no exclude param → harness flagged", () => {
    const findings = detect("harness the power", { list: ["harness"] });
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.match!.toLowerCase()).toBe("harness");
  });
});

// ============================================================
// AC4 — regression: empty exclude array → no-op
// ============================================================
describe("AC4: empty exclude=[] does not suppress", () => {
  test("list=[harness], exclude=[] → harness still flagged", () => {
    const findings = detect("harness the power", { list: ["harness"], exclude: [] });
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.match!.toLowerCase()).toBe("harness");
  });
});

// ============================================================
// AC5 — excluding an absent term changes nothing
// ============================================================
describe("AC5: excluding a term not in text is a no-op", () => {
  test("list=[leverage], exclude=[harness], text has only leverage → leverage flagged", () => {
    const findings = detect(
      "leverage this approach",
      { list: ["leverage"], exclude: ["harness"] }
    );
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.match!.toLowerCase()).toBe("leverage");
  });
});

// ============================================================
// AC6 — multi-term exclude: both listed terms suppressed
// ============================================================
describe("AC6: multi-term exclude suppresses all listed terms", () => {
  test("list=[harness,delve], exclude=[harness,delve], text has both + unlisted leverage → 0 findings", () => {
    // "leverage" is not in the list so it is never matched regardless;
    // both "harness" and "delve" are listed AND excluded → expect 0 findings.
    const findings = detect(
      "harness the delve and leverage",
      { list: ["harness", "delve"], exclude: ["harness", "delve"] }
    );
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// AC7 — hostile mixed-type exclude: non-strings ignored, "harness" still excluded
// ============================================================
describe("AC7: mixed-type exclude ignores non-string entries defensively", () => {
  test('exclude=["harness", 42, null] → no throw; "harness" excluded, other matches intact', () => {
    // Pass a hostile exclude array; detector must not throw.
    // "delve" is in the list but NOT in exclude → should be flagged.
    // "harness" is in the list AND in exclude (as string) → should NOT be flagged.
    const findings = detect(
      "harness the delve",
      { list: ["harness", "delve"], exclude: ["harness", 42, null] as unknown[] }
    );
    // Must not throw — assert on results shape.
    // "harness" excluded; "delve" still matched → exactly 1 finding.
    expect(findings.length).toBe(1);
    expect(findings[0]!.match!.toLowerCase()).toBe("delve");
  });
});
