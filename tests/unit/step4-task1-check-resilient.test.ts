import { describe, test, expect } from "bun:test";
import type { Profile, Finding, Severity } from "../../src/types.js";
import { check } from "../../src/check.js";
import { bothSidesHedge } from "../../src/detectors/bothSidesHedge.js";

// ── Seam constants ───────────────────────────────────────────────────────────
// tellId → detector name mapping (via resolveDetector in registry):
//   "s-colon-header"     → "colonHeader"    (inject THROWING stub)
//   "s-list-tricolon"    → "tricolon"       (inject THROWING non-Error stub)
//   "s-both-sides-hedge" → "bothSidesHedge" (inject REAL detector)
const ERROR_CRASH_MSG = "test-crash-message";
const NON_ERROR_CRASH_MSG = "non-error-crash";
const CRASHING_TELL_ID = "s-colon-header";
const CRASHING_DETECTOR_NAME = "colonHeader";
const NON_ERROR_TELL_ID = "s-list-tricolon";
const NON_ERROR_DETECTOR_NAME = "tricolon";
const SIBLING_TELL_ID = "s-both-sides-hedge";
// Confirmed to trigger bothSidesHedge (detectors.test.ts line 56)
const SIBLING_TRIGGER_TEXT = "both can be true depending on context";

// DetectorFn type matches check.ts's internal DetectorFn signature exactly
type DetectorFn = (text: string, params?: Record<string, unknown>, ruleId?: string, severity?: Severity) => Finding[];

// ── Detector stubs (no mock.module — plain objects, order-independent) ────────

const throwingColonHeader: DetectorFn = (): never => {
  throw new Error(ERROR_CRASH_MSG);
};

const throwingTricolon: DetectorFn = (): never => {
  throw NON_ERROR_CRASH_MSG;
};

// ── Profile builders ─────────────────────────────────────────────────────────

function crashProfile(): Profile {
  return {
    name: "test-step4-crash",
    rules: [{ tellId: CRASHING_TELL_ID, enabled: true, severity: "HIGH" }],
  };
}

function twoRuleProfile(): Profile {
  return {
    name: "test-step4-two-rules",
    rules: [
      { tellId: CRASHING_TELL_ID, enabled: true, severity: "HIGH" }, // crashes
      { tellId: SIBLING_TELL_ID, enabled: true, severity: "HIGH" },  // real, fires
    ],
  };
}

function cleanProfile(): Profile {
  return {
    name: "test-step4-clean",
    rules: [{ tellId: SIBLING_TELL_ID, enabled: true, severity: "HIGH" }],
  };
}

function nonErrorCrashProfile(): Profile {
  return {
    name: "test-step4-non-error",
    rules: [{ tellId: NON_ERROR_TELL_ID, enabled: true, severity: "HIGH" }],
  };
}

// ── Injected detector maps ────────────────────────────────────────────────────

function crashDetectors(): Record<string, DetectorFn> {
  return { [CRASHING_DETECTOR_NAME]: throwingColonHeader, bothSidesHedge };
}

function twoRuleDetectors(): Record<string, DetectorFn> {
  return { [CRASHING_DETECTOR_NAME]: throwingColonHeader, bothSidesHedge };
}

function cleanDetectors(): Record<string, DetectorFn> {
  return { bothSidesHedge };
}

function nonErrorDetectors(): Record<string, DetectorFn> {
  return { [NON_ERROR_DETECTOR_NAME]: throwingTricolon, bothSidesHedge };
}

// ── AC2: check() must not throw when a detector crashes ──────────────────────
describe("AC2: check() does not throw when detector crashes", () => {
  test("check() returns normally — no exception propagated", () => {
    expect(() =>
      check("some text", crashProfile(), crashDetectors())
    ).not.toThrow();
  });
});

// ── AC1: crashing detector produces exactly one ERROR finding ────────────────
describe("AC1: crashing detector → exactly one ERROR finding", () => {
  test("findings contain exactly one severity='ERROR' entry", () => {
    const findings = check("some text", crashProfile(), crashDetectors());
    const errorFindings = findings.filter((f) => f.severity === "ERROR");
    expect(errorFindings.length).toBe(1);
  });

  test("ERROR finding ruleId equals the crashing rule's tellId", () => {
    const findings = check("some text", crashProfile(), crashDetectors());
    const errFinding = findings.find((f) => f.severity === "ERROR");
    expect(errFinding).toBeDefined();
    expect(errFinding!.ruleId).toBe(CRASHING_TELL_ID);
  });
});

// ── AC3: sibling detectors still run after crash ─────────────────────────────
describe("AC3: siblings run after crash", () => {
  test("both ERROR finding and sibling finding appear in results", () => {
    const findings = check(SIBLING_TRIGGER_TEXT, twoRuleProfile(), twoRuleDetectors());
    const errorFindings = findings.filter((f) => f.severity === "ERROR");
    const siblingFindings = findings.filter((f) => f.ruleId === SIBLING_TELL_ID);
    // First rule crashed → one ERROR finding for CRASHING_TELL_ID
    expect(errorFindings.length).toBe(1);
    expect(errorFindings[0]!.ruleId).toBe(CRASHING_TELL_ID);
    // Second rule ran normally → at least one finding from sibling
    expect(siblingFindings.length).toBeGreaterThanOrEqual(1);
  });
});

// ── AC4: crash finding message shape ─────────────────────────────────────────
describe("AC4: ERROR finding message shape", () => {
  test("message starts with 'detector crashed: '", () => {
    const findings = check("some text", crashProfile(), crashDetectors());
    const msg = findings.find((f) => f.severity === "ERROR")!.message;
    expect(msg).toMatch(/^detector crashed: /);
  });

  test("message contains the detector name", () => {
    const findings = check("some text", crashProfile(), crashDetectors());
    const msg = findings.find((f) => f.severity === "ERROR")!.message;
    expect(msg).toContain(CRASHING_DETECTOR_NAME);
  });

  test("message contains the thrown error's message text", () => {
    const findings = check("some text", crashProfile(), crashDetectors());
    const msg = findings.find((f) => f.severity === "ERROR")!.message;
    expect(msg).toContain(ERROR_CRASH_MSG);
  });
});

// ── AC5: ERROR finding carries no source locus ───────────────────────────────
describe("AC5: ERROR finding has no line or match", () => {
  test("ERROR finding line is undefined", () => {
    const findings = check("some text", crashProfile(), crashDetectors());
    const errFinding = findings.find((f) => f.severity === "ERROR")!;
    expect(errFinding.line).toBeUndefined();
  });

  test("ERROR finding match is undefined", () => {
    const findings = check("some text", crashProfile(), crashDetectors());
    const errFinding = findings.find((f) => f.severity === "ERROR")!;
    expect(errFinding.match).toBeUndefined();
  });
});

// ── AC6: clean run is unaffected (regression guard) ──────────────────────────
// These tests pass at RED time — clean-run behavior uses the real injected detector.
// They serve as regression guards: GREEN must not break normal detector output.
describe("AC6: clean run produces no ERROR findings (regression guard)", () => {
  test("profile with no crashing detectors → zero ERROR findings", () => {
    const findings = check(SIBLING_TRIGGER_TEXT, cleanProfile(), cleanDetectors());
    const errorFindings = findings.filter((f) => f.severity === "ERROR");
    expect(errorFindings.length).toBe(0);
  });

  test("clean profile still produces its normal findings", () => {
    const findings = check(SIBLING_TRIGGER_TEXT, cleanProfile(), cleanDetectors());
    const normalFindings = findings.filter((f) => f.ruleId === SIBLING_TELL_ID);
    expect(normalFindings.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Behavior: non-Error throw → String(err) used in message ─────────────────
describe("Behavior: non-Error thrown value is converted via String(err)", () => {
  test("non-Error throw still produces an ERROR finding", () => {
    const findings = check("some text", nonErrorCrashProfile(), nonErrorDetectors());
    const errorFindings = findings.filter((f) => f.severity === "ERROR");
    expect(errorFindings.length).toBe(1);
  });

  test("non-Error thrown value appears in message via String(err)", () => {
    const findings = check("some text", nonErrorCrashProfile(), nonErrorDetectors());
    const msg = findings.find((f) => f.severity === "ERROR")!.message;
    expect(msg).toContain(NON_ERROR_CRASH_MSG);
  });

  test("non-Error throw ERROR finding carries detector name in message", () => {
    const findings = check("some text", nonErrorCrashProfile(), nonErrorDetectors());
    const msg = findings.find((f) => f.severity === "ERROR")!.message;
    expect(msg).toContain(NON_ERROR_DETECTOR_NAME);
  });
});
