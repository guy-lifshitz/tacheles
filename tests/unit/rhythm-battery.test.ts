import { describe, test, expect } from "bun:test";
import { paraUniformity } from "../../src/detectors/paraUniformity.js";
import { check } from "../../src/check.js";
import type { Profile } from "../../src/types.js";

// ---------------------------------------------------------------------------
// Sentence / paragraph builder helpers
// Tokenization the detector uses: text.split(/[.!?…]+[\s"»)]*/)
// then keeps segments with ≥1 word.
// Build sentences as "word "-repeated and join with ". "; append trailing ".".
// Paragraphs join sentence-groups with "\n\n".
// Only the literal token "word" is used — no digits or punctuation inside a
// sentence body, which would mis-split.
// ---------------------------------------------------------------------------

const sent = (len: number): string => Array(len).fill("word").join(" ");
const para = (lens: number[]): string => lens.map(sent).join(". ") + ".";
const doc = (paras: number[][]): string => paras.map(para).join("\n\n");

// ---------------------------------------------------------------------------
// AC1 — uniform AI-like text flags
//
// 10 sentences with lengths [17,18,19,17,18,19,17,18,19,17].
// Population CV = sd/mean ≈ 0.83/17.9 ≈ 0.046 — well below the 0.55 floor.
// Split into 2 paragraphs of 5 sentences each.
// ---------------------------------------------------------------------------
describe("AC1 — uniform AI-like text flags", () => {
  test("should emit exactly one r-uniform-polish finding with CV in the message", () => {
    const lens1 = [17, 18, 19, 17, 18];
    const lens2 = [19, 17, 18, 19, 17];
    const text = doc([lens1, lens2]);

    const findings = paraUniformity(text, undefined, "r-uniform-polish", "HIGH");

    const uniformFindings = findings.filter((f) => f.ruleId === "r-uniform-polish");
    expect(uniformFindings.length).toBe(1);
    // Message must contain a decimal CV value and mention CV
    const first = uniformFindings[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(first.message).toMatch(/0\.\d/);
    expect(first.message).toMatch(/CV/i);
  });
});

// ---------------------------------------------------------------------------
// AC2 — bursty human-like text does NOT flag
//
// Sentence lengths [3,21,7,1,34,12,5,28,9] (9 sentences, single paragraph).
// mean ≈ 13.33, population sd ≈ 11.00, CV ≈ 0.825 > 0.55 floor.
// A_n ≈ −0.06 (dominated by σ<μ on typical corpora).
// Zero findings prove we do NOT gate on A_n.
// ---------------------------------------------------------------------------
describe("AC2 — bursty human-like text does NOT flag", () => {
  test("should produce zero r-uniform-polish findings for bursty input (A_n ≈ −0.06 irrelevant)", () => {
    // CV ≈ 0.825 (above sentCvFloor default 0.55). A_n ≈ −0.06 — ignored by spec.
    const lens = [3, 21, 7, 1, 34, 12, 5, 28, 9];
    const text = para(lens);

    const findings = paraUniformity(text, undefined, "r-uniform-polish", "HIGH");

    const uniformFindings = findings.filter((f) => f.ruleId === "r-uniform-polish");
    expect(uniformFindings.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// AC3 — short input gate (minSentences = 8 by default)
//
// 7 sentences each 18 words (maximally uniform — CV = 0).
// Would flag if ≥ 8 sentences, but the minSentences gate fires first.
// ---------------------------------------------------------------------------
describe("AC3 — short input gate (minSentences = 8)", () => {
  test("should return empty array for 7-sentence input regardless of uniformity", () => {
    const lens = [18, 18, 18, 18, 18, 18, 18]; // 7 sentences, perfectly uniform
    const text = para(lens);

    const result = paraUniformity(text, undefined, "r-uniform-polish", "HIGH");

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// AC4 — profile override flows through check() merge
//
// Same bursty AC2 text (CV ≈ 0.825 < 1.2).
// Profile sets sentCvFloor: 1.2 → bursty text now falls below the raised floor.
// Proves the {…registryParams, …rule.params} merge in check.ts works end-to-end.
// ---------------------------------------------------------------------------
describe("AC4 — profile override via check() param merge", () => {
  test("should flag bursty text when sentCvFloor raised to 1.2 via profile params", () => {
    const lens = [3, 21, 7, 1, 34, 12, 5, 28, 9];
    const text = para(lens);

    const profile: Profile = {
      name: "test",
      rules: [
        {
          tellId: "r-uniform-polish",
          enabled: true,
          severity: "HIGH",
          params: { sentCvFloor: 1.2 },
        },
      ],
    };

    const findings = check(text, profile);
    const uniformFindings = findings.filter((f) => f.ruleId === "r-uniform-polish");
    expect(uniformFindings.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// AC5 — paraCV gate fires when sentence CV is OK but paragraphs are uniform
//
// 3 paragraphs with sentence lengths [[2,10,18],[18,2,10],[10,18,2]].
// Each paragraph totals 30 words → paraCV = 0 (< 0.2 floor).
// Combined sentence lengths: 2,10,18,18,2,10,10,18,2 → mean=10, sd≈6.53, CV≈0.653 > 0.55.
// Sentence CV gate does NOT trip; paraCV gate fires. Message must name "paraCV".
// ---------------------------------------------------------------------------
describe("AC5 — paraCV gate triggers when paragraph lengths are uniform", () => {
  test("should flag when paraCV < 0.2 even if sentence CV is above sentCvFloor", () => {
    const text = doc([[2, 10, 18], [18, 2, 10], [10, 18, 2]]);

    const findings = paraUniformity(text, undefined, "r-uniform-polish", "HIGH");

    const uniformFindings = findings.filter((f) => f.ruleId === "r-uniform-polish");
    expect(uniformFindings.length).toBeGreaterThanOrEqual(1);
    const firstPara = uniformFindings[0];
    expect(firstPara).toBeDefined();
    if (!firstPara) return;
    expect(firstPara.message).toMatch(/paraCV/i);
  });
});

// ---------------------------------------------------------------------------
// AC6 — A_n is NOT a gate (regression lock)
//
// Re-asserts the bursty AC2 sample at default params produces zero findings.
// A_n ≈ −0.06 for this sample — locks against re-introducing the broken A_n gate
// that would fire on all natural human prose.
// ---------------------------------------------------------------------------
describe("AC6 — A_n is not a gate (regression lock)", () => {
  test("should produce zero findings for sample with A_n < 0.3 at default params", () => {
    // Same bursty sample as AC2. A_n ≈ −0.06 (σ < μ dominates sign for human corpora).
    // If A_n were gated (< 0.3 → flag), this would emit a finding — locking that behaviour off.
    const lens = [3, 21, 7, 1, 34, 12, 5, 28, 9];
    const text = para(lens);

    const findings = paraUniformity(text, undefined, "r-uniform-polish", "HIGH");

    const uniformFindings = findings.filter((f) => f.ruleId === "r-uniform-polish");
    expect(uniformFindings.length).toBe(0);
  });
});
