import type { Finding, Severity } from "../types.js";

// Detects tricolon structure: 3+ consecutive lines matching colon-header pattern
// with low line-length variance (<25%)
const COLON_HEADER_LINE_RE = /^\s*\*{0,2}([a-z_][a-z_0-9]*):\s+/;

function variance(nums: number[]): number {
  if (nums.length === 0) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const maxDev = Math.max(...nums.map((n) => Math.abs(n - mean)));
  return mean > 0 ? maxDev / mean : 0;
}

export function tricolon(text: string, _params?: Record<string, unknown>, ruleId?: string, severity?: Severity): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split("\n");

  let run: { line: number; len: number }[] = [];

  const flushRun = () => {
    if (run.length >= 3) {
      const firstEntry = run.at(0);
      if (firstEntry === undefined) return;
      const lens = run.map((r) => r.len);
      const v = variance(lens);
      if (v < 0.25) {
        findings.push({
          ruleId: ruleId ?? "rule-2-tricolon",
          severity: severity ?? "HIGH",
          line: firstEntry.line,
          match: `${run.length} consecutive colon-headers`,
          message: `Tricolon: ${run.length} consecutive colon-header lines with low variance (${(v * 100).toFixed(1)}%) starting at line ${firstEntry.line}`,
        });
      }
    }
    run = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines.at(i);
    if (line === undefined) continue;
    if (COLON_HEADER_LINE_RE.test(line) && !/https?:\/\//.test(line)) {
      run.push({ line: i + 1, len: line.trim().length });
    } else {
      if (run.length >= 3) {
        flushRun();
      } else {
        run = [];
      }
    }
  }
  // Check trailing run
  if (run.length >= 3) {
    flushRun();
  }

  return findings;
}
