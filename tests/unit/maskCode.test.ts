import { describe, test, expect } from "bun:test";
import { check, maskCode } from "../../src/check";
import type { Profile } from "../../src/types";

// maskCode is the central code-exclusion pass: a prose linter must not flag code.
// It must preserve every newline (and character offset) so detector line math holds.

describe("maskCode", () => {
  test("blanks fenced code blocks but keeps line count", () => {
    const text = "before\n```\ndelve robust tapestry\n```\nafter";
    const masked = maskCode(text);
    expect(masked.split("\n").length).toBe(text.split("\n").length);
    expect(masked).not.toContain("delve");
    expect(masked.split("\n")[0]).toBe("before");
    expect(masked.split("\n")[4]).toBe("after");
  });

  test("blanks inline code spans, leaves surrounding prose", () => {
    const masked = maskCode("run `tacheles compare-drafts` now");
    expect(masked).not.toContain("compare-drafts");
    expect(masked).toContain("run ");
    expect(masked).toContain(" now");
    expect(masked.length).toBe("run `tacheles compare-drafts` now".length);
  });

  test("~~~ fences and indented fences are handled", () => {
    const masked = maskCode("p\n   ~~~~\nrobust\n   ~~~~\nq");
    expect(masked).not.toContain("robust");
  });

  test("prose outside code is untouched", () => {
    const text = "delve into this robust tapestry of ideas";
    expect(maskCode(text)).toBe(text);
  });
});

describe("check() excludes code from findings", () => {
  const vocabProfile: Profile = {
    name: "test-vocab",
    rules: [{ tellId: "s-banned-vocab", enabled: true, severity: "HIGH" }],
  };

  test("banned vocab inside a fenced block is NOT flagged", () => {
    const text = "Clean prose here.\n\n```\ndelve robust tapestry\n```\n";
    const findings = check(text, vocabProfile);
    expect(findings.filter((f) => f.ruleId === "s-banned-vocab").length).toBe(0);
  });

  test("banned vocab in prose IS still flagged, on the right line", () => {
    const text = "line one\n\nwe must delve deeper here.";
    const findings = check(text, vocabProfile).filter((f) => f.ruleId === "s-banned-vocab");
    expect(findings.length).toBe(1);
    expect(findings[0]!.line).toBe(3);
  });

  test("banned vocab in an inline code span is NOT flagged", () => {
    const text = "The `delve` rule flags AI vocabulary.";
    const findings = check(text, vocabProfile);
    expect(findings.filter((f) => f.ruleId === "s-banned-vocab").length).toBe(0);
  });
});
