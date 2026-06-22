import { describe, test, expect } from "bun:test";
// densityStat is imported inside each test body to avoid collection-time ImportError
// on a not-yet-existing branch (§1q extension / D1CF5FDF): the file collects fine
// and tests fail at assert time, not collect time.

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

/** Pad `core` words to reach `targetWords` total whitespace-separated tokens. */
function pad(core: string, targetWords: number): string {
  const coreCount = core.split(/\s+/).filter(Boolean).length;
  const extra = targetWords - coreCount;
  if (extra <= 0) return core;
  return Array(extra).fill("the").join(" ") + " " + core;
}

// ---------------------------------------------------------------------------
// AC1 — many nominalizations over threshold → exactly 1 finding
// ---------------------------------------------------------------------------
describe("AC1: nominalization density above threshold → 1 finding", () => {
  test("6 nominalization nouns in 35 words at perThousand:5 → 1 finding with correct fields", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    // 6 nominalizations in ~35 words → density = 6/35*1000 ≈ 171 >> 5
    const core =
      "implementation management compliance governance documentation evaluation";
    const text = pad(core, 35);
    const findings = densityStat(text, { signal: "nominalization", perThousand: 5, minWords: 30 });
    expect(findings.length).toBe(1);
    expect(findings[0]!.message).toContain("nominalization density");
    expect(findings[0]!.ruleId).toBe("s-density");
    expect(findings[0]!.severity).toBe("MEDIUM");
  });
});

// ---------------------------------------------------------------------------
// AC2 — few/zero nominalizations → 0 findings
// ---------------------------------------------------------------------------
describe("AC2: text with zero nominalization-suffix words → 0 findings", () => {
  test("plain Anglo-Saxon prose (≥30 words, 0 nominalizations) → 0 findings", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    // No word ends in -tion/-ment/-ance/-ence
    const text =
      "The dog ran fast and the cat sat on the warm mat by the door " +
      "while we watched the rain fall on the green grass all day long today. " +
      "We all felt glad and went home.";
    // Verify word count ≥ 30 (this text is 36 words)
    const wc = text.split(/\s+/).filter(Boolean).length;
    expect(wc).toBeGreaterThanOrEqual(30);
    const findings = densityStat(text, { signal: "nominalization", perThousand: 5, minWords: 30 });
    expect(findings.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// AC3 — plural nominalizations are counted
// ---------------------------------------------------------------------------
describe("AC3: plural nominalization forms (-tions, -ments, -ances, -ences) are counted", () => {
  test("plural forms 'implementations' and 'recommendations' count toward density → ≥1 finding", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    // 4 plural nominalizations in 32 words → density = 4/32*1000 = 125 >> 5
    const core = "implementations recommendations performances achievements";
    const text = pad(core, 32);
    const findings = densityStat(text, { signal: "nominalization", perThousand: 5, minWords: 30 });
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// AC4 — text shorter than minWords → [] regardless
// ---------------------------------------------------------------------------
describe("AC4: words < minWords → [] regardless of nominalization count", () => {
  test("5-word text of all nominalizations at perThousand:1 → 0 findings", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    // 5 nominalization words, well above any threshold — but below minWords:30
    const text = "implementation management compliance governance documentation";
    const wc = text.split(/\s+/).filter(Boolean).length;
    expect(wc).toBeLessThan(30);
    const findings = densityStat(text, { signal: "nominalization", perThousand: 1, minWords: 30 });
    expect(findings.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// AC5 — ruleId and severity passthrough
// ---------------------------------------------------------------------------
describe("AC5: custom ruleId and severity appear on the nominalization finding", () => {
  test("ruleId:'s-nominalization', severity:'LOW' passed through to finding", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    const core = "implementation management compliance governance documentation evaluation";
    const text = pad(core, 35);
    const findings = densityStat(
      text,
      { signal: "nominalization", perThousand: 5, minWords: 30 },
      "s-nominalization",
      "LOW"
    );
    expect(findings.length).toBe(1);
    expect(findings[0]!.ruleId).toBe("s-nominalization");
    expect(findings[0]!.severity).toBe("LOW");
  });
});

// ---------------------------------------------------------------------------
// AC6 — regression: emdash, filler, and unknown signal still behave as before
// ---------------------------------------------------------------------------
describe("AC6 regression: emdash and filler signals unaffected; unknown signal → []", () => {
  test("signal:'emdash' still returns 1 finding when above threshold", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    const baseWords = Array(50).fill("word").join(" ");
    const text = baseWords + " — — — — —";
    const findings = densityStat(text, { signal: "emdash", perThousand: 4, minWords: 30 });
    expect(findings.length).toBe(1);
  });

  test("signal:'filler' still returns 1 finding when above threshold", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    const filler = Array(5).fill("in order to").join(" ");
    const padding = Array(25).fill("word").join(" ");
    const text = `${padding} ${filler}`;
    const findings = densityStat(text, {
      signal: "filler",
      list: ["in order to"],
      perThousand: 4,
      minWords: 30,
    });
    expect(findings.length).toBe(1);
  });

  test("unknown signal → [] (no throw, no findings)", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    const text = Array(50).fill("word").join(" ");
    const findings = densityStat(text, { signal: "banana", perThousand: 4, minWords: 30 });
    expect(findings.length).toBe(0);
  });
});
