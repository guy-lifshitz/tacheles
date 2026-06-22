import { describe, test, expect } from "bun:test";
import { getRegisteredDetectorNames } from "../../src/check.js";

// densityStat does not exist yet — import is deferred into each test body
// to avoid a collection-time ImportError that would cause a ~30 min hang
// (§1q extension / D1CF5FDF). The test fails at assert time, not collect time.

// Helper: build a text with exactly `wordCount` whitespace-separated words
// and `emDashCount` em-dash characters interspersed.
function buildEmDashText(wordCount: number, emDashCount: number): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(i < emDashCount ? `word—` : "word");
  }
  // Ensure the dashes are separate tokens so they don't inflate word count
  return words.join(" ").replace(/word—/g, "word —");
}

// Helper: build a text containing `repetitions` copies of `phrase` padded to
// reach `totalWords` words.
function buildFillerText(phrase: string, repetitions: number, totalWords: number): string {
  const parts: string[] = [];
  for (let i = 0; i < repetitions; i++) {
    parts.push(phrase);
  }
  const filler = parts.join(" ");
  const extraWords = totalWords - filler.split(/\s+/).filter(Boolean).length;
  const padding = extraWords > 0 ? Array(extraWords).fill("padding").join(" ") : "";
  return padding ? `${padding} ${filler}` : filler;
}

// ============================================================
// AC2.1 — emdash density above threshold → 1 finding
// ============================================================
describe("AC2.1: emdash density above perThousand → 1 finding", () => {
  test("50 words, 5 em-dashes, perThousand:4 → density=100/1000 → 1 finding", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    // 50 words, 5 em-dashes → density = 5/50*1000 = 100 >> 4
    const words = Array(50).fill("word").join(" ");
    const text = words + " — — — — —";
    const findings = densityStat(text, { signal: "emdash", perThousand: 4, minWords: 30 });
    expect(findings.length).toBe(1);
  });
});

// ============================================================
// AC2.2 — emdash density at/below threshold → 0 findings
// ============================================================
describe("AC2.2: emdash density at/below perThousand → 0 findings", () => {
  test("50 words, 0 em-dashes → density=0 ≤ 4 → 0 findings", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    const text = Array(50).fill("word").join(" ");
    const findings = densityStat(text, { signal: "emdash", perThousand: 4, minWords: 30 });
    expect(findings.length).toBe(0);
  });

  test("exactly at threshold (density == perThousand) → 0 findings (boundary <= not <)", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    // 1000 words, 4 em-dashes → density = 4/1000*1000 = 4 exactly ≤ 4 → 0
    const baseWords = Array(1000).fill("word").join(" ");
    const text = baseWords + " — — — —";
    const findings = densityStat(text, { signal: "emdash", perThousand: 4, minWords: 30 });
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// AC2.3 — filler signal above threshold → 1 finding; below → 0
// ============================================================
describe("AC2.3: filler signal density above threshold → 1 finding, below → 0", () => {
  test("filler phrases above threshold → 1 finding", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    // Use 40 total words; phrases "in order to" (3 words each) repeated 5 times = 15 words.
    // density = 5/40*1000 = 125 >> perThousand:4
    const filler = Array(5).fill("in order to").join(" ");
    const padding = Array(25).fill("word").join(" ");
    const text = `${padding} ${filler}`;
    const findings = densityStat(text, {
      signal: "filler",
      list: ["in order to", "the fact that"],
      perThousand: 4,
      minWords: 30,
    });
    expect(findings.length).toBe(1);
  });

  test("filler phrases below threshold → 0 findings", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    // 200 words of padding + 1 filler phrase → density = 1/201*1000 ≈ 4.97
    // Use perThousand:10 to ensure it's below
    const padding = Array(200).fill("word").join(" ");
    const text = `${padding} in order to`;
    const findings = densityStat(text, {
      signal: "filler",
      list: ["in order to", "the fact that"],
      perThousand: 10,
      minWords: 30,
    });
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// AC2.4 — words < minWords → [] regardless
// ============================================================
describe("AC2.4: words < minWords → [] regardless of density", () => {
  test("5 words text with 5 em-dashes but minWords:30 → 0 findings", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    const text = "a — b — c — d — e —";
    const findings = densityStat(text, { signal: "emdash", perThousand: 4, minWords: 30 });
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// AC2.5 — unknown/absent signal → [] (no throw)
// ============================================================
describe("AC2.5: unknown or absent signal → [] (no throw)", () => {
  test("signal:'unknown' → 0 findings, no throw", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    const text = Array(50).fill("word").join(" ");
    expect(() => {
      const result = densityStat(text, { signal: "unknown", perThousand: 4, minWords: 30 });
      expect(result.length).toBe(0);
    }).not.toThrow();
  });

  test("absent signal (no params) → 0 findings, no throw", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    const text = Array(50).fill("word").join(" ");
    expect(() => {
      const result = densityStat(text, {});
      expect(result.length).toBe(0);
    }).not.toThrow();
  });
});

// ============================================================
// AC2.6 — ruleId/severity passthrough honored
// ============================================================
describe("AC2.6: ruleId and severity passthrough", () => {
  test("custom ruleId and severity appear in the finding", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    const baseWords = Array(50).fill("word").join(" ");
    const text = baseWords + " — — — — —";
    const findings = densityStat(
      text,
      { signal: "emdash", perThousand: 4, minWords: 30 },
      "custom-rule-id",
      "LOW"
    );
    expect(findings.length).toBe(1);
    expect(findings[0]!.ruleId).toBe("custom-rule-id");
    expect(findings[0]!.severity).toBe("LOW");
  });

  test("default ruleId is 's-density' when none provided", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    const baseWords = Array(50).fill("word").join(" ");
    const text = baseWords + " — — — — —";
    const findings = densityStat(text, { signal: "emdash", perThousand: 4, minWords: 30 });
    expect(findings[0]!.ruleId).toBe("s-density");
    expect(findings[0]!.severity).toBe("MEDIUM");
  });
});

// ============================================================
// AC2.7 — densityStat in getRegisteredDetectorNames()
// ============================================================
describe("AC2.7: 'densityStat' is in getRegisteredDetectorNames()", () => {
  test("getRegisteredDetectorNames() includes 'densityStat'", () => {
    expect(getRegisteredDetectorNames()).toContain("densityStat");
  });
});

// ============================================================
// Finding shape — match field mirrors emDashDensity format
// ============================================================
describe("Finding shape: match field is 'N / M words'", () => {
  test("match field contains count and word count", async () => {
    const { densityStat } = await import("../../src/detectors/densityStat.js");
    const baseWords = Array(50).fill("word").join(" ");
    const text = baseWords + " — — — — —";
    const findings = densityStat(text, { signal: "emdash", perThousand: 4, minWords: 30 });
    expect(findings.length).toBe(1);
    expect(findings[0]!.match).toMatch(/\d+ \/ \d+ words/);
    expect(findings[0]!.line).toBeUndefined();
  });
});
