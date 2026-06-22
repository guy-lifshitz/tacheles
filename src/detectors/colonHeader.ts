import type { Finding, Severity } from "../types.js";

// Detects inline colon-headers at line start: word: Description
// Pattern: optional bold markers + word + colon + space at line start
// Excludes URLs (http:// https://) and markdown images
const COLON_HEADER_RE = /^\s*\*{0,2}([a-z_][a-z_0-9]*):\s+/gm;

export function colonHeader(text: string, _params?: Record<string, unknown>, ruleId?: string, severity?: Severity): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines.at(i);
    if (line === undefined) continue;
    // Skip URLs
    if (/https?:\/\//.test(line)) continue;
    // Reset regex state
    COLON_HEADER_RE.lastIndex = 0;
    const match = COLON_HEADER_RE.exec(line);
    if (match) {
      const [full] = match;
      const trimmed = full?.trim() ?? "";
      findings.push({
        ruleId: ruleId ?? "rule-1-colon-header",
        severity: severity ?? "HIGH",
        line: i + 1,
        match: trimmed.slice(0, 60),
        message: `Inline colon-header at line ${i + 1}: "${trimmed}"`,
      });
    }
  }

  return findings;
}
