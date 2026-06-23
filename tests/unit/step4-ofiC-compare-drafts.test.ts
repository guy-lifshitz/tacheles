import { describe, test, expect, afterAll } from "bun:test";
import { resolve } from "path";
import { tmpdir } from "node:os";
import { writeFileSync, rmSync } from "node:fs";
import { kingLengthCut, countWords } from "../../src/detectors/kingLengthCut.js";
import type { Finding } from "../../src/types.js";

// ============================================================
// describe("kingLengthCut detector") — AC1–AC11
// ============================================================

describe("kingLengthCut detector", () => {
  // AC1: 100 orig, 80 rewrite (80 ≤ 90) → pass
  test("AC1: orig 100 words, rewrite 80 words → [] (sufficient cut)", () => {
    const orig = "word ".repeat(100).trim();
    const rw = "word ".repeat(80).trim();
    const findings: Finding[] = kingLengthCut(orig, rw);
    expect(findings).toEqual([]);
  });

  // AC2: boundary — exactly 90 words → pass (≤ 90% passes)
  test("AC2: rewrite exactly 90 words (boundary) → [] (≤ 90% passes)", () => {
    const orig = "word ".repeat(100).trim();
    const rw = "word ".repeat(90).trim();
    const findings: Finding[] = kingLengthCut(orig, rw);
    expect(findings).toEqual([]);
  });

  // AC3: 91 words → fail (91 > 90)
  test("AC3: rewrite 91 words → 1 finding (insufficient cut)", () => {
    const orig = "word ".repeat(100).trim();
    const rw = "word ".repeat(91).trim();
    const findings: Finding[] = kingLengthCut(orig, rw);
    expect(findings.length).toBe(1);
  });

  // AC4: no cut at all (100 → 100) → fail
  test("AC4: rewrite 100 words (no cut) → 1 finding", () => {
    const orig = "word ".repeat(100).trim();
    const rw = "word ".repeat(100).trim();
    const findings: Finding[] = kingLengthCut(orig, rw);
    expect(findings.length).toBe(1);
  });

  // AC5: draft grew (100 → 120) → fail
  test("AC5: rewrite 120 words (draft grew) → 1 finding", () => {
    const orig = "word ".repeat(100).trim();
    const rw = "word ".repeat(120).trim();
    const findings: Finding[] = kingLengthCut(orig, rw);
    expect(findings.length).toBe(1);
  });

  // AC6: inspect finding fields
  test("AC6: orig 100, rewrite 100 — finding has correct ruleId, severity, match, message", () => {
    const orig = "word ".repeat(100).trim();
    const rw = "word ".repeat(100).trim();
    const findings: Finding[] = kingLengthCut(orig, rw);
    expect(findings.length).toBe(1);
    const f = findings[0]!;
    expect(f.ruleId).toBe("k-length-cut");
    expect(f.severity).toBe("LOW");
    expect(f.match).toBe("100/100 words");
    expect(f.message).toContain("100");
  });

  // AC7: custom ratio 0.8 — 85 words fails, 80 words passes
  test("AC7a: ratio=0.8, rewrite 85 words → 1 finding (85 > 80)", () => {
    const orig = "word ".repeat(100).trim();
    const rw = "word ".repeat(85).trim();
    const findings: Finding[] = kingLengthCut(orig, rw, { ratio: 0.8 });
    expect(findings.length).toBe(1);
  });

  test("AC7b: ratio=0.8, rewrite 80 words → [] (80 ≤ 80)", () => {
    const orig = "word ".repeat(100).trim();
    const rw = "word ".repeat(80).trim();
    const findings: Finding[] = kingLengthCut(orig, rw, { ratio: 0.8 });
    expect(findings).toEqual([]);
  });

  // AC8: default ratio 0.9 — 85 words passes (85 ≤ 90)
  test("AC8: default ratio 0.9, rewrite 85 → [] (85 ≤ 90)", () => {
    const orig = "word ".repeat(100).trim();
    const rw = "word ".repeat(85).trim();
    const findings: Finding[] = kingLengthCut(orig, rw);
    expect(findings).toEqual([]);
  });

  // AC9: irregular whitespace — countWords counts logical words
  test("AC9: countWords('a  b\\n\\n c') === 3", () => {
    expect(countWords("a  b\n\n c")).toBe(3);
  });

  test("AC9: orig with irregular whitespace (3 words), rewrite 1 word → [] (1 ≤ 2.7)", () => {
    const findings: Finding[] = kingLengthCut("a  b\n\n c", "a");
    expect(findings).toEqual([]);
  });

  // AC10: frontmatter excluded from word count
  test("AC10: orig with frontmatter + 50 body words → countWords===50, rewrite 40 → [] (40 ≤ 45)", () => {
    const body50 = "word ".repeat(50).trim();
    const origWithFrontmatter = `---\nvoice-profile: x\n---\n${body50}`;
    expect(countWords(origWithFrontmatter)).toBe(50);

    const rw = "word ".repeat(40).trim();
    const findings: Finding[] = kingLengthCut(origWithFrontmatter, rw);
    expect(findings).toEqual([]);
  });

  // AC11: zero-word edge cases
  test("AC11a: both empty strings → [] (no NaN, no throw)", () => {
    const findings: Finding[] = kingLengthCut("", "");
    expect(findings).toEqual([]);
  });

  test("AC11b: orig empty, rewrite 'x' → 1 finding, message has no 'NaN'", () => {
    const findings: Finding[] = kingLengthCut("", "x");
    expect(findings.length).toBe(1);
    expect(findings[0]!.message).not.toContain("NaN");
  });
});

// ============================================================
// describe("compare-drafts CLI") — AC12–AC17
// ============================================================

const VOICE_BIN = resolve(import.meta.dir, "../../bin/tacheles");
const NEGATIVE = resolve(import.meta.dir, "../fixtures/negative-slop.md");

async function spawn(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bun", VOICE_BIN, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { exitCode, stdout, stderr };
}

// Temp file paths for fixtures
const TMP = tmpdir();
const origPath100 = resolve(TMP, "ofiC-orig-100.md");
const rwPath80 = resolve(TMP, "ofiC-rw-80.md");
const rwPath100 = resolve(TMP, "ofiC-rw-100.md");

// Write temp fixtures before tests run
writeFileSync(origPath100, "word ".repeat(100).trim());
writeFileSync(rwPath80, "word ".repeat(80).trim());
writeFileSync(rwPath100, "word ".repeat(100).trim());

afterAll(() => {
  try { rmSync(origPath100); } catch (_) {}
  try { rmSync(rwPath80); } catch (_) {}
  try { rmSync(rwPath100); } catch (_) {}
});

describe("compare-drafts CLI", () => {
  // AC12: 100 orig, 80 rewrite → exit 0, JSON pass:true
  test("AC12: orig 100w rewrite 80w → exit 0, pass:true, correct JSON fields", async () => {
    const { exitCode, stdout } = await spawn(["compare-drafts", origPath100, rwPath80, "--json"]);
    expect(exitCode).toBe(0);
    const json: any = JSON.parse(stdout);
    expect(json.pass).toBe(true);
    expect(json.findings).toEqual([]);
    expect(json.originalWords).toBe(100);
    expect(json.rewriteWords).toBe(80);
    expect(json.command).toBe("compare-drafts");
  });

  // AC13: orig 100, rewrite 100 → exit 1, pass:false, 1 finding
  test("AC13: orig 100w rewrite 100w → exit 1, pass:false, findings.length===1", async () => {
    const { exitCode, stdout } = await spawn(["compare-drafts", origPath100, rwPath100, "--json"]);
    expect(exitCode).toBe(1);
    const json: any = JSON.parse(stdout);
    expect(json.pass).toBe(false);
    expect(json.findings.length).toBe(1);
  });

  // AC14: orig 100, rewrite 80, --ratio 0.5 → exit 1 (80 > 50)
  test("AC14: orig 100w rewrite 80w --ratio 0.5 → exit 1, pass:false (flag honored)", async () => {
    const { exitCode, stdout } = await spawn(["compare-drafts", origPath100, rwPath80, "--ratio", "0.5", "--json"]);
    expect(exitCode).toBe(1);
    const json: any = JSON.parse(stdout);
    expect(json.pass).toBe(false);
  });

  // AC15: only one path arg → exit 2
  test("AC15: only one path arg → exit 2 (usage / both files required)", async () => {
    const { exitCode, stderr } = await spawn(["compare-drafts", origPath100]);
    expect(exitCode).toBe(2);
    // Either "Usage:" or "both" or similar usage message in stderr
    expect(stderr.length).toBeGreaterThan(0);
  });

  // AC16: nonexistent first path → exit 2, stderr "cannot read file"
  test("AC16: nonexistent first path → exit 2, stderr contains 'cannot read file'", async () => {
    const { exitCode, stderr } = await spawn(["compare-drafts", "/nonexistent/ofiC-orig.md", rwPath80]);
    expect(exitCode).toBe(2);
    expect(stderr).toContain("cannot read file");
  });

  // AC17 regression: check on negative fixture still works after dispatch refactor
  test("AC17: voice check <negative-fixture> → exit 1, pass:false (dispatch not broken)", async () => {
    const { exitCode, stdout } = await spawn(["check", NEGATIVE, "--json"]);
    expect(exitCode).toBe(1);
    const json: any = JSON.parse(stdout);
    expect(json.pass).toBe(false);
  });
});
