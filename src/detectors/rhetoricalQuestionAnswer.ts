import type { Finding, Severity } from "../types.js";

export function rhetoricalQuestionAnswer(
  text: string,
  _params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const findings: Finding[] = [];
  // Regex constructed per-call: avoids shared lastIndex state on the g-flag regex.
  const re =
    /(^|[.!?]\s+)([A-Z][^.?!\n]{0,40}\?)\s+([A-Z][\w'-]*(?:\s+[\w'-]+){0,2}[.!])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const prefix = m[1] ?? "";
    const spanStart = m.index + prefix.length;
    const spanText = (m[2] ?? "") + " " + (m[3] ?? "");
    const line = text.slice(0, spanStart).split("\n").length;
    const clipped = spanText.slice(0, 60);
    findings.push({
      ruleId: ruleId ?? "s-rhetorical-qa",
      severity: severity ?? "MEDIUM",
      line,
      match: clipped,
      message: `Rhetorical Q+A: "${clipped}"`,
    });
  }
  return findings;
}
