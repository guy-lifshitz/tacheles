import type { Finding, Severity } from "../types.js";

// Detects bold inline headers in bullet lists
// Pattern: bullet (- or *) followed by **word:** or **word:**
const BOLD_LIST_HEADER_RE = /^\s*[-*]\s+\*\*[a-z_][a-z_0-9]*:\*\*/gm;

export function boldListHeader(text: string, _params?: Record<string, unknown>, ruleId?: string, severity?: Severity): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines.at(i);
    if (line === undefined) continue;
    BOLD_LIST_HEADER_RE.lastIndex = 0;
    const match = BOLD_LIST_HEADER_RE.exec(line);
    if (match) {
      const [full] = match;
      const trimmed = full?.trim() ?? "";
      findings.push({
        ruleId: ruleId ?? "rule-7-bold-list-header",
        severity: severity ?? "MEDIUM",
        line: i + 1,
        match: trimmed.slice(0, 60),
        message: `Bold inline header in bullet list at line ${i + 1}: "${trimmed}"`,
      });
    }
  }

  return findings;
}
