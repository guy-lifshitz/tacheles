import { describe, test, expect } from "bun:test";
import { check } from "../../src/check";
import { resolveDetector } from "../../src/tells/registry";
import { bannedVocab } from "../../src/detectors/bannedVocab";
import type { Profile } from "../../src/types";

function singleTellProfile(tellId: string, severity: "HIGH" | "MEDIUM" | "LOW"): Profile {
  return {
    name: "test-step3-batch-a",
    rules: [{ tellId, enabled: true, severity }],
  };
}

// ============================================================
// s-banned-vocab
// ============================================================
describe("s-banned-vocab", () => {
  test("positive: ≥4 HIGH findings on AI-vocab sentence (AC1)", () => {
    expect(resolveDetector("s-banned-vocab")).not.toBeNull();
    const profile = singleTellProfile("s-banned-vocab", "HIGH");
    const findings = check(
      "leverage robust frameworks to foster a seamless journey",
      profile
    ).filter((f) => f.ruleId === "s-banned-vocab");
    expect(findings.length).toBeGreaterThanOrEqual(4);
    expect(findings.every((f) => f.severity === "HIGH")).toBe(true);
  });

  test("negative: 0 findings on clean sentence (AC2)", () => {
    expect(resolveDetector("s-banned-vocab")).not.toBeNull();
    const profile = singleTellProfile("s-banned-vocab", "HIGH");
    const findings = check(
      "we shipped the fix on Friday and rolled back Monday",
      profile
    ).filter((f) => f.ruleId === "s-banned-vocab");
    expect(findings.length).toBe(0);
  });

  test("boundary: suffixed form 'leveraged' must NOT match (AC3)", () => {
    expect(resolveDetector("s-banned-vocab")).not.toBeNull();
    const profile = singleTellProfile("s-banned-vocab", "HIGH");
    const findings = check("a leveraged buyout", profile).filter(
      (f) => f.ruleId === "s-banned-vocab"
    );
    expect(findings.length).toBe(0);
  });

  test("profile params.list:[] overrides registry list → 0 findings (profile-override path)", () => {
    expect(resolveDetector("s-banned-vocab")).not.toBeNull();
    const profile: Profile = {
      name: "test-empty-list",
      rules: [{ tellId: "s-banned-vocab", enabled: true, severity: "HIGH", params: { list: [] } }],
    };
    const findings = check("leverage robust seamless journey", profile).filter(
      (f) => f.ruleId === "s-banned-vocab"
    );
    expect(findings.length).toBe(0);
  });

  test("detector called with params=undefined returns [] and does not throw (missing-params guard)", () => {
    const findings = bannedVocab("leverage robust seamless", undefined);
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// s-banned-copula
// ============================================================
describe("s-banned-copula", () => {
  test("positive: ≥1 MEDIUM finding on 'serves as' (AC4)", () => {
    expect(resolveDetector("s-banned-copula")).not.toBeNull();
    const profile = singleTellProfile("s-banned-copula", "MEDIUM");
    const findings = check("The framework serves as a cornerstone.", profile).filter(
      (f) => f.ruleId === "s-banned-copula"
    );
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.every((f) => f.severity === "MEDIUM")).toBe(true);
  });

  test("negative: 0 findings on plain copula 'is' (AC5)", () => {
    expect(resolveDetector("s-banned-copula")).not.toBeNull();
    const profile = singleTellProfile("s-banned-copula", "MEDIUM");
    const findings = check("The framework is small.", profile).filter(
      (f) => f.ruleId === "s-banned-copula"
    );
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// s-hedge-opener
// ============================================================
describe("s-hedge-opener", () => {
  test("positive: ≥1 HIGH finding on 'It's worth noting' (AC6)", () => {
    expect(resolveDetector("s-hedge-opener")).not.toBeNull();
    const profile = singleTellProfile("s-hedge-opener", "HIGH");
    const findings = check(
      "It's worth noting that the vendor shipped defaults.",
      profile
    ).filter((f) => f.ruleId === "s-hedge-opener");
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.every((f) => f.severity === "HIGH")).toBe(true);
  });

  test("negative: 0 findings on clean sentence (AC7)", () => {
    expect(resolveDetector("s-hedge-opener")).not.toBeNull();
    const profile = singleTellProfile("s-hedge-opener", "HIGH");
    const findings = check("The vendor shipped defaults.", profile).filter(
      (f) => f.ruleId === "s-hedge-opener"
    );
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// s-significance-wrap
// ============================================================
describe("s-significance-wrap", () => {
  test("positive: ≥1 HIGH finding on 'This underscores the importance of' (AC8)", () => {
    expect(resolveDetector("s-significance-wrap")).not.toBeNull();
    const profile = singleTellProfile("s-significance-wrap", "HIGH");
    const findings = check(
      "This underscores the importance of proactive resilience.",
      profile
    ).filter((f) => f.ruleId === "s-significance-wrap");
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.every((f) => f.severity === "HIGH")).toBe(true);
  });

  test("negative: 0 findings on fact sentence (AC9)", () => {
    expect(resolveDetector("s-significance-wrap")).not.toBeNull();
    const profile = singleTellProfile("s-significance-wrap", "HIGH");
    const findings = check("We cut the cost by 30%.", profile).filter(
      (f) => f.ruleId === "s-significance-wrap"
    );
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// s-rhetorical-qa
// ============================================================
describe("s-rhetorical-qa", () => {
  test("positive: ≥1 MEDIUM finding on short-answer rhetorical Q (AC10)", () => {
    expect(resolveDetector("s-rhetorical-qa")).not.toBeNull();
    const profile = singleTellProfile("s-rhetorical-qa", "MEDIUM");
    const findings = check("The result? Resilience.", profile).filter(
      (f) => f.ruleId === "s-rhetorical-qa"
    );
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.every((f) => f.severity === "MEDIUM")).toBe(true);
  });

  test("negative: 0 findings when answer is ≥4 words (AC11)", () => {
    expect(resolveDetector("s-rhetorical-qa")).not.toBeNull();
    const profile = singleTellProfile("s-rhetorical-qa", "MEDIUM");
    const findings = check(
      "What did we change? We rolled the deploy back and paged the on-call.",
      profile
    ).filter((f) => f.ruleId === "s-rhetorical-qa");
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// Frontmatter line offset (AC12)
// ============================================================
describe("Frontmatter line offset", () => {
  test("finding.line accounts for frontmatter offset (AC12)", () => {
    // Use s-hedge-opener: "it's worth noting" triggers on body line 1.
    // Frontmatter: "---\ntitle: test\nauthor: test\n---\n"
    //   split("\n") → ["---","title: test","author: test","---",""] → length 5 → lineOffset = 4
    // Banned term on body line 1 → expected finding.line = 1 + 4 = 5
    expect(resolveDetector("s-hedge-opener")).not.toBeNull();
    const text =
      "---\ntitle: test\nauthor: test\n---\nit's worth noting that the vendor shipped defaults.";
    const profile = singleTellProfile("s-hedge-opener", "HIGH");
    const findings = check(text, profile).filter((f) => f.ruleId === "s-hedge-opener");
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.line).toBe(5);
  });
});

// ============================================================
// Dual-tell coexistence: "is a testament to" fires from both tells
// ============================================================
describe("dual-tell coexistence (spec duplication note)", () => {
  test("'is a testament to' generates findings from both s-banned-copula and s-significance-wrap", () => {
    const profile: Profile = {
      name: "test-dual-tell",
      rules: [
        { tellId: "s-banned-copula", enabled: true, severity: "MEDIUM" },
        { tellId: "s-significance-wrap", enabled: true, severity: "HIGH" },
      ],
    };
    const findings = check("The approach is a testament to our resilience.", profile);
    const copulaFindings = findings.filter((f) => f.ruleId === "s-banned-copula");
    const wrapFindings = findings.filter((f) => f.ruleId === "s-significance-wrap");
    expect(copulaFindings.length).toBeGreaterThanOrEqual(1);
    expect(wrapFindings.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// Registry parity after flip (AC13)
// ============================================================
describe("Registry parity after flip (AC13)", () => {
  test("resolveDetector('s-banned-vocab') returns detector fn name", () => {
    const name = resolveDetector("s-banned-vocab");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });

  test("resolveDetector('s-banned-copula') returns detector fn name", () => {
    const name = resolveDetector("s-banned-copula");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });

  test("resolveDetector('s-hedge-opener') returns detector fn name", () => {
    const name = resolveDetector("s-hedge-opener");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });

  test("resolveDetector('s-significance-wrap') returns detector fn name", () => {
    const name = resolveDetector("s-significance-wrap");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });

  test("resolveDetector('s-rhetorical-qa') returns detector fn name", () => {
    const name = resolveDetector("s-rhetorical-qa");
    expect(name).not.toBeNull();
    expect(typeof name).toBe("string");
  });
});
