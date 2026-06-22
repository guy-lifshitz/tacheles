import { describe, test, expect } from "bun:test";
import { makeWordlistDetector } from "../../src/detectors/wordlist.js";
import { getRegisteredDetectorNames } from "../../src/check.js";

// Real detectors — no mocking.

// ============================================================
// AC1.1 — "wordlist" key registered in DETECTORS map
// ============================================================
describe("AC1.1: getRegisteredDetectorNames includes 'wordlist'", () => {
  test("'wordlist' is a registered detector name", () => {
    expect(getRegisteredDetectorNames()).toContain("wordlist");
  });
});

// ============================================================
// AC1.3 — generic wordlist detector, default message label
// ============================================================
describe("AC1.3: default message label is 'wordlist: \"...\"'", () => {
  // Build a detector with the generic label the new generic key will use.
  const detect = makeWordlistDetector("s-wordlist", "HIGH", "wordlist");

  test("detect('delve into the tapestry', {list:[delve,tapestry]}) → 2 findings with label 'wordlist:'", () => {
    const findings = detect("delve into the tapestry", { list: ["delve", "tapestry"] });
    expect(findings.length).toBe(2);
    for (const f of findings) {
      expect(f.message).toMatch(/^wordlist:/);
    }
  });
});

// ============================================================
// AC1.4 — params.label overrides the message label
// ============================================================
describe("AC1.4: params.label overrides message label", () => {
  const detect = makeWordlistDetector("s-wordlist", "HIGH", "wordlist");

  test("params.label:'hollow filler' → message starts with 'hollow filler:'", () => {
    const findings = detect("in order to win", {
      list: ["in order to"],
      label: "hollow filler",
    });
    expect(findings.length).toBe(1);
    expect(findings[0]!.message).toMatch(/^hollow filler:/);
  });

  test("non-empty label replaces factory messageLabel entirely", () => {
    const findings = detect("just delve right in", {
      list: ["delve"],
      label: "GPT-vocab",
    });
    expect(findings.length).toBe(1);
    // Must NOT start with the factory default label
    expect(findings[0]!.message).not.toMatch(/^wordlist:/);
    expect(findings[0]!.message).toMatch(/^GPT-vocab:/);
  });
});

// ============================================================
// AC1.5 — regression: bannedVocab own label "AI vocabulary" unchanged
// ============================================================
describe("AC1.5: bannedVocab label is unaffected when no params.label is passed", () => {
  // bannedVocab is built with messageLabel "AI vocabulary" — it must stay that way.
  const bannedVocabDetect = makeWordlistDetector("s-banned-vocab", "HIGH", "AI vocabulary");

  test("no params.label → message label stays 'AI vocabulary:'", () => {
    const findings = bannedVocabDetect("delve deeply", { list: ["delve"] });
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message).toMatch(/^AI vocabulary:/);
  });

  test("empty string params.label falls back to factory messageLabel", () => {
    const findings = bannedVocabDetect("delve deeply", { list: ["delve"], label: "" });
    // empty string → falsy → fallback to factory label "AI vocabulary"
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message).toMatch(/^AI vocabulary:/);
  });
});

// ============================================================
// AC1.6 — params.exclude still honored alongside params.label
// ============================================================
describe("AC1.6: params.exclude works alongside params.label (no regression)", () => {
  const detect = makeWordlistDetector("s-wordlist", "HIGH", "wordlist");

  test("label='filler' + exclude=['delve'] → excluded term not in findings", () => {
    const findings = detect("delve into the tapestry", {
      list: ["delve", "tapestry"],
      label: "filler",
      exclude: ["delve"],
    });
    // "delve" excluded, "tapestry" remains → exactly 1 finding
    expect(findings.length).toBe(1);
    expect(findings[0]!.match!.toLowerCase()).toBe("tapestry");
    // label override still applies
    expect(findings[0]!.message).toMatch(/^filler:/);
  });
});
