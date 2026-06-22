import { readFileSync } from "fs";
import { describe, test, expect } from "bun:test";
import { check } from "../../src/check";
import { getAllTells, resolveDetector } from "../../src/tells/registry";
import type { Profile } from "../../src/types";

// D1CF5FDF collect-safety: loadProfile reads from disk inside each test body (or beforeAll),
// never as a top-level static import. File absent until GREEN → throws at assert time, not
// at collect time.
function loadProfile(name: string): Profile {
  const url = new URL(`../../src/profiles/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf-8")) as Profile;
}

function profileWith(tellId: string): Profile {
  return {
    name: "test-profile",
    rules: [{ tellId, enabled: true, severity: "MEDIUM" }],
  };
}

// ============================================================
// AC1 — s-hollow-filler flags ≥2 hollow phrases in one sentence
// ============================================================
describe("AC1: s-hollow-filler flags ≥2 hollow phrases in fixture", () => {
  test('≥2 findings, all ruleId==="s-hollow-filler", messages start with "hollow filler:"', () => {
    const text = "It is important to note that in order to win we must act.";
    const findings = check(text, profileWith("s-hollow-filler")).filter(
      (f) => f.ruleId === "s-hollow-filler"
    );
    expect(findings.length).toBeGreaterThanOrEqual(2);
    for (const f of findings) {
      expect(f.ruleId).toBe("s-hollow-filler");
      expect(f.message.startsWith("hollow filler:")).toBe(true);
    }
  });
});

// ============================================================
// AC2 — s-hollow-filler does NOT flag ordinary prose
// ============================================================
describe("AC2: s-hollow-filler produces 0 findings on plain prose", () => {
  test("no s-hollow-filler finding for ordinary clean prose", () => {
    const text = "The scan ran and the control passed.";
    const findings = check(text, profileWith("s-hollow-filler")).filter(
      (f) => f.ruleId === "s-hollow-filler"
    );
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// AC3 — s-hollow-intensifier flags "very" and "quite"
// ============================================================
describe("AC3: s-hollow-intensifier flags hollow intensifiers in fixture", () => {
  test('"very" and "quite" both matched; messages start with "hollow intensifier:"', () => {
    const text = "This is very robust and quite slow.";
    const findings = check(text, profileWith("s-hollow-intensifier")).filter(
      (f) => f.ruleId === "s-hollow-intensifier"
    );
    const matches = findings.map((f) => f.match?.toLowerCase() ?? "");
    expect(matches).toContain("very");
    expect(matches).toContain("quite");
    for (const f of findings) {
      expect(f.message.startsWith("hollow intensifier:")).toBe(true);
    }
  });
});

// ============================================================
// AC4 — s-expletive-opener flags "there are ... that" and "it is ... that"
// ============================================================
describe('AC4: s-expletive-opener flags "there are ... that" and "it is ... that"', () => {
  test('"There are teams that struggle." → ≥1 finding with message starting "Expletive opener:"', () => {
    const text = "There are teams that struggle.";
    const findings = check(text, profileWith("s-expletive-opener")).filter(
      (f) => f.ruleId === "s-expletive-opener"
    );
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message.startsWith("Expletive opener:")).toBe(true);
  });

  test('"It is the judgment that matters." → ≥1 finding with message starting "Expletive opener:"', () => {
    const text = "It is the judgment that matters.";
    const findings = check(text, profileWith("s-expletive-opener")).filter(
      (f) => f.ruleId === "s-expletive-opener"
    );
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings[0]!.message.startsWith("Expletive opener:")).toBe(true);
  });
});

// ============================================================
// AC5 — s-expletive-opener is sentence-bounded (period stops the match)
// ============================================================
describe("AC5: s-expletive-opener is sentence-bounded — period stops match", () => {
  test('"There was a fire. The dog ate that bone." → 0 s-expletive-opener findings', () => {
    // "there was" and "that" are in different sentences; [^.!?\n] in the regex stops at "."
    const text = "There was a fire. The dog ate that bone.";
    const findings = check(text, profileWith("s-expletive-opener")).filter(
      (f) => f.ruleId === "s-expletive-opener"
    );
    expect(findings.length).toBe(0);
  });
});

// ============================================================
// AC6 — registry: all 3 tell ids are active with correct detector names
// ============================================================
describe("AC6: registry entries for the 3 Pack-1 hollow tells", () => {
  test("s-hollow-filler is active, detector=wordlist", () => {
    const tell = getAllTells().find((t) => t.id === "s-hollow-filler");
    expect(tell).toBeDefined();
    expect(tell!.status).toBe("active");
    expect(resolveDetector("s-hollow-filler")).toBe("wordlist");
  });

  test("s-hollow-intensifier is active, detector=wordlist", () => {
    const tell = getAllTells().find((t) => t.id === "s-hollow-intensifier");
    expect(tell).toBeDefined();
    expect(tell!.status).toBe("active");
    expect(resolveDetector("s-hollow-intensifier")).toBe("wordlist");
  });

  test("s-expletive-opener is active, detector=regexList", () => {
    const tell = getAllTells().find((t) => t.id === "s-expletive-opener");
    expect(tell).toBeDefined();
    expect(tell!.status).toBe("active");
    expect(resolveDetector("s-expletive-opener")).toBe("regexList");
  });
});

// ============================================================
// AC7 — essay-en profile wiring: enabled/disabled as specified
// ============================================================
describe("AC7: essay-en profile wires the 3 Pack-1 tells correctly", () => {
  test("s-hollow-filler enabled=true in essay-en", () => {
    const profile = loadProfile("essay-en");
    const rule = profile.rules.find((r) => r.tellId === "s-hollow-filler");
    expect(rule).toBeDefined();
    expect(rule!.enabled).toBe(true);
  });

  test("s-expletive-opener enabled=true in essay-en", () => {
    const profile = loadProfile("essay-en");
    const rule = profile.rules.find((r) => r.tellId === "s-expletive-opener");
    expect(rule).toBeDefined();
    expect(rule!.enabled).toBe(true);
  });

  test("s-hollow-intensifier enabled=false in essay-en", () => {
    const profile = loadProfile("essay-en");
    const rule = profile.rules.find((r) => r.tellId === "s-hollow-intensifier");
    expect(rule).toBeDefined();
    expect(rule!.enabled).toBe(false);
  });
});
