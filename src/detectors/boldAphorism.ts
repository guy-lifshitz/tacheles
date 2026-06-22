import type { Finding, Severity } from "../types.js";

const BOLD_LINE_RE = /^\*\*(.+?)\*\*[.!?]?$/;

export function boldAphorism(
  text: string,
  params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const minWords = typeof params?.minWords === "number" ? params.minWords : 3;
  const findings: Finding[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    const m = BOLD_LINE_RE.exec(trimmed);
    if (!m) continue;
    const inner = m[1]!.trim();
    if (inner.endsWith(":")) continue;
    if (inner.split(/\s+/).length < minWords) continue;
    const clipped = inner.slice(0, 60);
    findings.push({
      ruleId: ruleId ?? "r-bold-aphorism",
      severity: severity ?? "HIGH",
      line: i + 1,
      match: clipped,
      message: `Bold aphorism: "${clipped}"`,
    });
  }
  return findings;
}
