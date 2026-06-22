import { describe, test, expect } from "bun:test";
import { check } from "../../src/check";
import { resolveDetector } from "../../src/tells/registry";
import { antithesis, aphoristicClose } from "../../src/detectors/disabled";
import type { Profile } from "../../src/types";

// Minimal profile used across tests — registry-based Rule shape throughout.
const minProfile: Profile = {
  name: "test-min",
  rules: [
    { tellId: "s-colon-header", enabled: true, severity: "HIGH" },
    { tellId: "r-uniform-polish", enabled: true, severity: "HIGH" },
  ],
};

// ─── H1: Frontmatter stripping ───────────────────────────────────────────────

describe("Frontmatter stripping", () => {
  test("valid frontmatter containing title: does not produce colonHeader finding", () => {
    const text = [
      "---",
      "title: My Article",
      "date: 2026-04-22",
      "---",
      "",
      "This is the actual content.",
    ].join("\n");
    const findings = check(text, minProfile);
    const colonFindings = findings.filter((f) => f.ruleId === "s-colon-header");
    expect(colonFindings.length).toBe(0);
  });

  test("unclosed frontmatter — lints full text (no crash, no empty output)", () => {
    const text = "---\ntitle: foo\nno closing delimiter here";
    // Should not throw; frontmatter is passed through as-is
    const findings = check(text, minProfile);
    // The title: line will fire colonHeader since frontmatter is not stripped
    const colonFindings = findings.filter((f) => f.ruleId === "s-colon-header");
    expect(colonFindings.length).toBeGreaterThan(0);
  });

  test("text NOT starting with --- is not mis-stripped even if --- appears mid-text", () => {
    const text = "Some intro text\n---\nsetup: this line comes after a mid-text ---";
    const findings = check(text, minProfile);
    // The setup: line MUST still be found (frontmatter strip must not apply)
    const colonFindings = findings.filter((f) => f.ruleId === "s-colon-header");
    expect(colonFindings.length).toBeGreaterThan(0);
  });

  test("line numbers in findings are relative to the original file, not stripped body", () => {
    // Frontmatter is 3 lines (--- ... ---) so body starts at line 4 (1-based)
    const text = [
      "---",          // line 1
      "title: foo",   // line 2
      "---",          // line 3
      "",             // line 4
      "setup: check", // line 5 — should be reported as line 5, not line 2
    ].join("\n");
    const findings = check(text, minProfile);
    const colonFindings = findings.filter((f) => f.ruleId === "s-colon-header");
    expect(colonFindings.length).toBeGreaterThan(0);
    // Line must be >= 4 (file-relative, not stripped-body-relative)
    const first = colonFindings.at(0);
    if (first === undefined) return;
    expect(first.line).toBeGreaterThanOrEqual(4);
  });
});

// ─── H3: Distinct rule IDs on negative seed ──────────────────────────────────

describe("Acceptance: negative seed rule-set assertion", () => {
  test("negative seed: HIGH findings include s-colon-header AND at least one structural tell (rhythm correctly abstains on bursty human text)", () => {
    const { readFileSync } = require("fs");
    const { resolve } = require("path");
    const NEGATIVE = resolve(import.meta.dir, "../fixtures/negative-slop.md");
    const text = readFileSync(NEGATIVE, "utf-8");

    const fullProfile: Profile = {
      name: "test-strict",
      rules: [
        { tellId: "s-colon-header", enabled: true, severity: "HIGH" },
        { tellId: "s-list-tricolon", enabled: true, severity: "HIGH" },
        { tellId: "s-both-sides-hedge", enabled: true, severity: "HIGH" },
        { tellId: "r-uniform-polish", enabled: true, severity: "HIGH" },
      ],
    };

    const findings = check(text, fullProfile);
    const high = findings.filter((f) => f.severity === "HIGH");
    const highRuleIds = new Set(high.map((f) => f.ruleId));

    // Must have s-colon-header (the strongest single surface signal)
    expect(highRuleIds.has("s-colon-header")).toBe(true);
    // Must have at least one of the structural tells.
    // r-uniform-polish correctly abstains on bursty human text (sentence-CV gate).
    const hasTricolon = highRuleIds.has("s-list-tricolon");
    const hasParaUniformity = highRuleIds.has("r-uniform-polish");
    const hasBothSidesHedge = highRuleIds.has("s-both-sides-hedge");
    expect(hasTricolon || hasParaUniformity || hasBothSidesHedge).toBe(true);
  });
});

// ─── H4: Disabled-rule filtering ─────────────────────────────────────────────

describe("Disabled-rule filtering", () => {
  test("enabled:false rules produce no findings even when text would trigger them", () => {
    // Text that WOULD trigger antithesis ("not X but Y") and aphoristicClose (3 paras, each
    // ending with a short nugget) — enabled:false is the only suppressor.
    const profileWithDisabled: Profile = {
      name: "test-disabled",
      rules: [
        { tellId: "r-reframe-opener", enabled: false, severity: "HIGH" },
        { tellId: "r-closing-nugget", enabled: false, severity: "HIGH" },
      ],
    };
    const text = [
      "not speed but quality defines the work. Floor, not ceiling.",
      "",
      "The system is complicated and interconnected. Cost is the lever.",
      "",
      "Results depend on decisions made early. Defaults matter.",
    ].join("\n");
    const findings = check(text, profileWithDisabled);
    expect(findings.filter((f) => f.ruleId === "r-reframe-opener").length).toBe(0);
    expect(findings.filter((f) => f.ruleId === "r-closing-nugget").length).toBe(0);
  });

  test("enabling a rule activates it (enabled:true is the only gate)", () => {
    // s-both-sides-hedge enabled here — verifies enabled:true is the only gate
    const profileEnabled: Profile = {
      name: "test-enabled",
      rules: [
        { tellId: "s-both-sides-hedge", enabled: true, severity: "HIGH" },
      ],
    };
    const text = "both can be true depending on the task.";
    const findings = check(text, profileEnabled);
    expect(findings.filter((f) => f.ruleId === "s-both-sides-hedge").length).toBeGreaterThan(0);
  });
});

// ─── H5: Planned/unimplemented tell handling ─────────────────────────────────

describe("Planned tell handling", () => {
  test("planned tell in profile emits no throw; other enabled rules in same profile still fire", () => {
    // r-significance-announce is planned — resolveDetector returns null → warn+skip.
    // s-colon-header is active — must still fire.
    const profileWithPlanned: Profile = {
      name: "test-planned",
      rules: [
        { tellId: "s-colon-header", enabled: true, severity: "HIGH" },
        { tellId: "r-significance-announce", enabled: true, severity: "MEDIUM" },
      ],
    };
    const text = "setup: this should fire s-colon-header";
    // Must not throw
    const findings = check(text, profileWithPlanned);
    // Active rule fires
    expect(findings.filter((f) => f.ruleId === "s-colon-header").length).toBeGreaterThan(0);
    // Planned rule produces no findings
    expect(findings.filter((f) => f.ruleId === "r-significance-announce").length).toBe(0);
  });
});

// ─── M2: Line-number assertions ───────────────────────────────────────────────

describe("Line number correctness", () => {
  test("colonHeader reports correct 1-based line number", () => {
    const text = "first line\nsecond line\nsetup: third line is the finding";
    const findings = check(text, minProfile);
    const colonFindings = findings.filter((f) => f.ruleId === "s-colon-header");
    expect(colonFindings.length).toBeGreaterThan(0);
    const firstColon = colonFindings.at(0);
    if (firstColon === undefined) return;
    expect(firstColon.line).toBe(3);
  });

  test("bothSidesHedge reports correct 1-based line number", () => {
    const hedgeProfile: Profile = {
      name: "test-hedge",
      rules: [{ tellId: "s-both-sides-hedge", enabled: true, severity: "HIGH" }],
    };
    const text = "first line\nsecond line\nboth can be true depending on context";
    const findings = check(text, hedgeProfile);
    expect(findings.length).toBeGreaterThan(0);
    const firstHedge = findings.at(0);
    if (firstHedge === undefined) return;
    expect(firstHedge.line).toBe(3);
  });
});

// ─── M1: Boundary tests ───────────────────────────────────────────────────────

describe("Boundary inputs", () => {
  test("empty string produces no findings and does not throw", () => {
    const findings = check("", minProfile);
    expect(findings.length).toBe(0);
  });

  test("whitespace-only string produces no findings", () => {
    const findings = check("   \n  \n  ", minProfile);
    expect(findings.length).toBe(0);
  });

  test("paraUniformity: fewer than 3 paragraphs returns empty", () => {
    const paraProfile: Profile = {
      name: "test-para",
      rules: [{ tellId: "r-uniform-polish", enabled: true, severity: "HIGH" }],
    };
    const text = "word ".repeat(20) + "\n\n" + "word ".repeat(20);
    const findings = check(text, paraProfile);
    expect(findings.filter((f) => f.ruleId === "r-uniform-polish").length).toBe(0);
  });

  test("transitionStack: single transition word returns no finding", () => {
    const transProfile: Profile = {
      name: "test-trans",
      rules: [{ tellId: "s-transition-stack", enabled: true, severity: "MEDIUM" }],
    };
    const text = "furthermore there is only one transition word in this text.";
    const findings = check(text, transProfile);
    expect(findings.filter((f) => f.ruleId === "s-transition-stack").length).toBe(0);
  });
});

// ─── M3: Multi-match within one input ─────────────────────────────────────────

describe("Multi-match counting", () => {
  test("colonHeader returns one finding per colon-header line", () => {
    const text = [
      "setup: line one",
      "context: line two",
      "fix: line three",
      "result: line four",
      "note: line five",
    ].join("\n");
    const findings = check(text, minProfile);
    const colonFindings = findings.filter((f) => f.ruleId === "s-colon-header");
    expect(colonFindings.length).toBe(5);
  });
});

// ─── L1: Code-fence exclusion ─────────────────────────────────────────────────

describe("Code-fence exclusion", () => {
  test("boldfaceInline does not flag bold inside a fenced code block", () => {
    const boldProfile: Profile = {
      name: "test-bold",
      rules: [{ tellId: "s-boldface-inline", enabled: true, severity: "MEDIUM" }],
    };
    const text = "prose text\n```\n**bold** inside fence\n```\nmore prose";
    const findings = check(text, boldProfile);
    expect(findings.filter((f) => f.ruleId === "s-boldface-inline").length).toBe(0);
  });
});

// ─── TransitionStack: multiple clusters ──────────────────────────────────────

describe("transitionStack multi-cluster detection", () => {
  test("two distinct transition clusters in long text produce two findings", () => {
    const transProfile: Profile = {
      name: "test-trans-multi",
      rules: [{ tellId: "s-transition-stack", enabled: true, severity: "MEDIUM" }],
    };
    // First cluster: furthermore + moreover near the start
    // Then 600+ words of filler
    // Second cluster: additionally + nevertheless near the end
    const filler = "word ".repeat(600);
    const text = `furthermore there is one. moreover there is two. ${filler} additionally there is three. nevertheless there is four.`;
    const findings = check(text, transProfile);
    expect(findings.filter((f) => f.ruleId === "s-transition-stack").length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Fail-loud: llm-only and unknown-id must throw ────────────────────────────

describe("Fail-loud registry resolution", () => {
  test("resolveDetector throws on unknown tell id (not silent skip)", () => {
    expect(() => resolveDetector("__nonexistent_tell_id__")).toThrow(/unknown tell id/);
  });

  test("unknown tell id referenced by an enabled registry rule causes check() to throw", () => {
    const profileWithBadTellId: Profile = {
      name: "test-bad-tell",
      rules: [
        { tellId: "__nonexistent_tell_id__", enabled: true, severity: "HIGH" },
      ],
    };
    expect(() => check("some text", profileWithBadTellId)).toThrow(/unknown tell id/);
  });

  test("unknown tell id with enabled:false is skipped before resolution — no throw", () => {
    // enabled:false guard fires before resolveDetector, so no throw for disabled bad tells
    const profileWithBadDisabled: Profile = {
      name: "test-bad-disabled",
      rules: [
        { tellId: "__nonexistent_tell_id__", enabled: false, severity: "HIGH" },
      ],
    };
    expect(() => check("some text", profileWithBadDisabled)).not.toThrow();
  });
});

// ─── Detectors: antithesis (r-reframe-opener) ────────────────────────────────

describe("antithesis detector", () => {
  test("positive: text with 'not X but Y' yields at least one finding", () => {
    const text = "not speed but quality defines the work.";
    const findings = antithesis(text, undefined, "r-reframe-opener", "HIGH");
    expect(findings.length).toBeGreaterThan(0);
    const finding = findings.at(0);
    if (finding === undefined) return;
    expect(finding.ruleId).toBe("r-reframe-opener");
    expect(finding.severity).toBe("HIGH");
  });

  test("positive: antithesis fires via check() with registry rule enabled", () => {
    const profile: Profile = {
      name: "test-antithesis-enabled",
      rules: [{ tellId: "r-reframe-opener", enabled: true, severity: "HIGH" }],
    };
    const text = "not speed but quality defines the work.";
    const findings = check(text, profile);
    expect(findings.filter((f) => f.ruleId === "r-reframe-opener").length).toBeGreaterThan(0);
  });

  test("negative: plain text with no reframe pattern yields 0 findings", () => {
    const text = "The system processes requests and returns results.";
    const findings = antithesis(text, undefined, "r-reframe-opener", "HIGH");
    expect(findings.length).toBe(0);
  });

  test("negative: antithesis rule disabled in profile yields no findings even on matching text", () => {
    const profile: Profile = {
      name: "test-antithesis-disabled",
      rules: [{ tellId: "r-reframe-opener", enabled: false, severity: "HIGH" }],
    };
    const text = "not speed but quality defines the work.";
    const findings = check(text, profile);
    expect(findings.filter((f) => f.ruleId === "r-reframe-opener").length).toBe(0);
  });
});

// ─── Detectors: aphoristicClose (r-closing-nugget) ───────────────────────────

describe("aphoristicClose detector", () => {
  // Three paragraphs each ending with a short (≤9 words) non-connective declarative.
  const NUGGET_TEXT = [
    "The system is complicated and has many moving parts. Cost is the lever.",
    "",
    "Results depend on early decisions about architecture and defaults. Defaults matter.",
    "",
    "Execution speed is only one axis. Speed is secondary.",
  ].join("\n");

  test("positive: text with 3 nugget-ending paragraphs yields a finding", () => {
    const findings = aphoristicClose(NUGGET_TEXT, undefined, "r-closing-nugget", "MEDIUM");
    expect(findings.length).toBeGreaterThan(0);
    const nuggetFinding = findings.at(0);
    if (nuggetFinding === undefined) return;
    expect(nuggetFinding.ruleId).toBe("r-closing-nugget");
    expect(nuggetFinding.severity).toBe("MEDIUM");
  });

  test("positive: aphoristicClose fires via check() with registry rule enabled", () => {
    const profile: Profile = {
      name: "test-nugget-enabled",
      rules: [{ tellId: "r-closing-nugget", enabled: true, severity: "MEDIUM" }],
    };
    const findings = check(NUGGET_TEXT, profile);
    expect(findings.filter((f) => f.ruleId === "r-closing-nugget").length).toBeGreaterThan(0);
  });

  test("negative: single short paragraph (fewer than 3) yields 0 findings", () => {
    const text = "One paragraph only. It ends here.";
    const findings = aphoristicClose(text, undefined, "r-closing-nugget", "MEDIUM");
    expect(findings.length).toBe(0);
  });

  test("negative: aphoristicClose rule disabled in profile yields no findings", () => {
    const profile: Profile = {
      name: "test-nugget-disabled",
      rules: [{ tellId: "r-closing-nugget", enabled: false, severity: "MEDIUM" }],
    };
    const findings = check(NUGGET_TEXT, profile);
    expect(findings.filter((f) => f.ruleId === "r-closing-nugget").length).toBe(0);
  });
});
