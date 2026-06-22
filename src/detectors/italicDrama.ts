import type { Finding, Severity } from "../types.js";

// params is accepted for DetectorFn interface conformance; excludeTerms exclusion is
// structural (baked into the [a-z]+ capture group), not runtime-toggled.
export function italicDrama(
  text: string,
  params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const STAR_ITALIC_RE = /(?<![*\w])\*([a-z]+)\*(?![*\w])/g;
  const UNDER_ITALIC_RE = /(?<![_\w])_([a-z]+)_(?![_\w])/g;
  const findings: Finding[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    for (const re of [STAR_ITALIC_RE, UNDER_ITALIC_RE]) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        // Skip if this span is the first non-whitespace token on the line
        if (line.slice(0, m.index).trim() === "") continue;
        const word = m[1]!;
        findings.push({
          ruleId: ruleId ?? "r-italic-drama",
          severity: severity ?? "MEDIUM",
          line: i + 1,
          match: word,
          message: `Italic drama: "${word}"`,
        });
      }
    }
  }
  return findings;
}
