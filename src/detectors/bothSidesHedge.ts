import type { Finding, Severity } from "../types.js";

// Balanced both-sides hedge detection via literal substring match
const HEDGE_PHRASES = [
  "both can be",
  "it depends",
  "truth on both",
  "depending on whether",
  "depends on whether",
];

export function bothSidesHedge(text: string, _params?: Record<string, unknown>, ruleId?: string, severity?: Severity): Finding[] {
  const findings: Finding[] = [];
  const lower = text.toLowerCase();

  for (const phrase of HEDGE_PHRASES) {
    let idx = 0;
    while ((idx = lower.indexOf(phrase, idx)) !== -1) {
      // Find line number
      const linesBefore = text.slice(0, idx).split("\n");
      const lineNum = linesBefore.length;
      const matchText = text.slice(idx, idx + phrase.length);
      findings.push({
        ruleId: ruleId ?? "rule-4-both-sides-hedge",
        severity: severity ?? "HIGH",
        line: lineNum,
        match: matchText.slice(0, 60),
        message: `Balanced-both-sides hedge: "${matchText}" at line ${lineNum}`,
      });
      idx += phrase.length;
    }
  }

  return findings;
}
