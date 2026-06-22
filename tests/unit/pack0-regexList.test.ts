import { describe, test, expect } from "bun:test";
import { getRegisteredDetectorNames } from "../../src/check.js";

// regexList does not exist yet — import is deferred into each test body
// to avoid collection-time ImportError (§1q extension / D1CF5FDF).

// ============================================================
// AC3.1 — single pattern, expletive sentence → ≥1 finding
// ============================================================
describe("AC3.1: single pattern matches expletive 'there is/are ... that'", () => {
  test("{re:'there (is|are) \\\\w+ that'} over matching text → ≥1 finding", async () => {
    const { regexList } = await import("../../src/detectors/regexList.js");
    const text = "There is something that bothers me here.";
    const findings = regexList(text, {
      patterns: [{ re: "there (is|are) \\w+ that" }],
    });
    expect(findings.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// AC3.2 — custom message used verbatim
// ============================================================
describe("AC3.2: custom pattern message used verbatim in finding", () => {
  test("pattern.message is copied verbatim into finding.message", async () => {
    const { regexList } = await import("../../src/detectors/regexList.js");
    const text = "There is evidence that supports this.";
    const findings = regexList(text, {
      patterns: [
        { re: "there (is|are) \\w+ that", message: "expletive construction detected" },
      ],
    });
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message).toBe("expletive construction detected");
  });

  test("absent message falls back to regex: format", async () => {
    const { regexList } = await import("../../src/detectors/regexList.js");
    const text = "There is something that we know.";
    const findings = regexList(text, {
      patterns: [{ re: "there (is|are) \\w+ that" }],
    });
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message).toMatch(/^regex:/);
  });
});

// ============================================================
// AC3.3 — multiple patterns each contribute findings
// ============================================================
describe("AC3.3: multiple patterns each contribute findings", () => {
  test("two patterns over matching text → findings from both", async () => {
    const { regexList } = await import("../../src/detectors/regexList.js");
    const text = "There is evidence that matters. It is very important to note.";
    const findings = regexList(text, {
      patterns: [
        { re: "there (is|are) \\w+ that", message: "expletive" },
        { re: "very important", message: "hedging intensifier" },
      ],
    });
    const expletiveFindings = findings.filter((f) => f.message === "expletive");
    const hedgeFindings = findings.filter((f) => f.message === "hedging intensifier");
    expect(expletiveFindings.length).toBeGreaterThanOrEqual(1);
    expect(hedgeFindings.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// AC3.4 — invalid regex skipped; valid sibling still matches
// ============================================================
describe("AC3.4: invalid regex entry skipped, valid sibling still matches (no throw)", () => {
  test("re:'(' invalid + valid sibling → no throw, sibling matches", async () => {
    const { regexList } = await import("../../src/detectors/regexList.js");
    const text = "There is something that we must address.";
    let findings: ReturnType<typeof regexList>;
    expect(() => {
      findings = regexList(text, {
        patterns: [
          { re: "(" }, // invalid — should be skipped
          { re: "there (is|are) \\w+ that", message: "expletive" },
        ],
      });
    }).not.toThrow();
    expect(findings!.length).toBeGreaterThanOrEqual(1);
    expect(findings!.some((f) => f.message === "expletive")).toBe(true);
  });
});

// ============================================================
// AC3.5 — non-global flags still iterate all matches (g auto-appended)
// ============================================================
describe("AC3.5: non-global flags → all matches iterated (g auto-appended)", () => {
  test("pattern with flags:'i' (no 'g') still finds all case-insensitive matches", async () => {
    const { regexList } = await import("../../src/detectors/regexList.js");
    // Without auto-g, the first match only would be found and the loop would stall.
    const text =
      "There is evidence that A. There are reasons that B. There is proof that C.";
    const findings = regexList(text, {
      patterns: [{ re: "there (is|are) \\w+ that", flags: "i" }],
    });
    // "i" flag without "g" in a normal exec loop would find only 1; with g auto-appended → 3
    expect(findings.length).toBeGreaterThanOrEqual(2);
  });

  test("pattern with no flags at all still finds all matches", async () => {
    const { regexList } = await import("../../src/detectors/regexList.js");
    const text = "abc abc abc";
    const findings = regexList(text, {
      patterns: [{ re: "abc" }],
    });
    expect(findings.length).toBe(3);
  });
});

// ============================================================
// AC3.6 — absent/empty patterns → []
// ============================================================
describe("AC3.6: absent or empty patterns → []", () => {
  test("patterns:[] → 0 findings", async () => {
    const { regexList } = await import("../../src/detectors/regexList.js");
    const findings = regexList("any text here whatsoever", { patterns: [] });
    expect(findings.length).toBe(0);
  });

  test("no params → 0 findings", async () => {
    const { regexList } = await import("../../src/detectors/regexList.js");
    const findings = regexList("any text here whatsoever", {});
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// AC3.7 — regexList in getRegisteredDetectorNames()
// ============================================================
describe("AC3.7: 'regexList' is in getRegisteredDetectorNames()", () => {
  test("getRegisteredDetectorNames() includes 'regexList'", () => {
    expect(getRegisteredDetectorNames()).toContain("regexList");
  });
});

// ============================================================
// Finding shape — line computed from match index, match clipped to 60
// ============================================================
describe("Finding shape: line from index, match clipped to 60 chars, ruleId/severity passthrough", () => {
  test("finding.line ≥ 1 and match is at most 60 chars", async () => {
    const { regexList } = await import("../../src/detectors/regexList.js");
    const text = "There is something that stands out here.";
    const findings = regexList(text, {
      patterns: [{ re: "there (is|are) \\w+ that" }],
    });
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.line).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.match!.length).toBeLessThanOrEqual(60);
  });

  test("custom ruleId and severity appear in findings", async () => {
    const { regexList } = await import("../../src/detectors/regexList.js");
    const text = "There is evidence that matters.";
    const findings = regexList(
      text,
      { patterns: [{ re: "there (is|are) \\w+ that" }] },
      "custom-rule",
      "LOW"
    );
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.ruleId).toBe("custom-rule");
    expect(findings[0]!.severity).toBe("LOW");
  });

  test("default ruleId is 's-regexlist'", async () => {
    const { regexList } = await import("../../src/detectors/regexList.js");
    const text = "There is reason that we do this.";
    const findings = regexList(text, {
      patterns: [{ re: "there (is|are) \\w+ that" }],
    });
    expect(findings[0]!.ruleId).toBe("s-regexlist");
    expect(findings[0]!.severity).toBe("MEDIUM");
  });
});
