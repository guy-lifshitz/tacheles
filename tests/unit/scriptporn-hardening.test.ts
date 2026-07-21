import { describe, test, expect } from "bun:test";

// T1 — shared countWords convention (NEW src/words.ts, does not exist pre-GREEN).
describe("countWords (src/words.ts)", () => {
  test("T1: counts whitespace-split non-empty tokens", async () => {
    const { countWords } = await import("../../src/words.ts");
    expect(countWords("a  b\nc")).toBe(3);
  });

  test("T1: empty string is 0 words", async () => {
    const { countWords } = await import("../../src/words.ts");
    expect(countWords("")).toBe(0);
  });

  test("T1: whitespace-only string is 0 words", async () => {
    const { countWords } = await import("../../src/words.ts");
    expect(countWords("   ")).toBe(0);
  });

  test("T1: single padded token is 1 word", async () => {
    const { countWords } = await import("../../src/words.ts");
    expect(countWords(" x ")).toBe(1);
  });
});

// T2 — emDashDensity must reject non-finite numeric params (NaN) and fall
// back to the documented default, instead of letting `typeof x === "number"`
// (true for NaN) silently disable the minWords/perThousand gate.
describe("emDashDensity NaN-param fallback (src/detectors/emDashDensity.ts)", () => {
  test("T2: NaN minWords falls back to default (30) on a short dash-heavy text", async () => {
    const { emDashDensity } = await import("../../src/detectors/emDashDensity.ts");
    // 10 words, 3 em-dashes: extremely dash-heavy but under the default 30-word floor.
    const text = "one — two — three — four five six seven eight nine ten";
    const findings = emDashDensity(text, { minWords: NaN });
    expect(findings).toEqual([]);
  });

  test("T2: NaN perThousand falls back to default (4), suppressing a low-density long text", async () => {
    const { emDashDensity } = await import("../../src/detectors/emDashDensity.ts");
    // 500 words, exactly 1 em-dash -> density = 1000/500 = 2/1000, BELOW the real default (4).
    // Pre-fix: `typeof params.perThousand === "number"` is true for NaN, so perThousand=NaN is
    // used verbatim; `density <= NaN` is always false (NaN comparisons never true), so the
    // suppression branch never fires and a finding is (wrongly) always returned regardless of
    // actual density. Post-fix: NaN is rejected by the finite guard, perThousand defaults to 4,
    // and 2 <= 4 correctly suppresses this low-density text -> [].
    const words = Array(500).fill("word");
    words[10] = "word —";
    const text = words.join(" ");
    const findings = emDashDensity(text, { perThousand: NaN });
    expect(findings).toEqual([]);
  });
});

// T3 — parseRegistry: a pure, exported, unit-testable JSON.parse + invariant
// guard (does not yet exist as an export pre-GREEN).
describe("parseRegistry (src/tells/registry.ts)", () => {
  test("T3: malformed JSON throws a wrapped 'invalid JSON' error", async () => {
    const { parseRegistry } = await import("../../src/tells/registry.ts");
    expect(() => parseRegistry("{ not json")).toThrow(/invalid JSON/);
  });

  test("T3: duplicate tell id throws a 'duplicate' error", async () => {
    const { parseRegistry } = await import("../../src/tells/registry.ts");
    const payload = JSON.stringify({
      version: 1,
      tells: [
        { id: "dup-id", detector: "someDetector", status: "active" },
        { id: "dup-id", detector: "someDetector", status: "active" },
      ],
    });
    expect(() => parseRegistry(payload)).toThrow(/duplicate/);
  });

  test("T3: planned: detector prefix with status active throws a 'planned' error", async () => {
    const { parseRegistry } = await import("../../src/tells/registry.ts");
    const payload = JSON.stringify({
      version: 1,
      tells: [{ id: "mismatched", detector: "planned:x", status: "active" }],
    });
    expect(() => parseRegistry(payload)).toThrow(/planned/);
  });
});
