import type { Finding, Severity } from "../types.js";

export function kingPassive(
  text: string,
  params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const exclude = Array.isArray(params?.exclude)
    ? (params.exclude as unknown[]).filter((x): x is string => typeof x === "string").map((s) => s.toLowerCase())
    : [];
  const re = /\b(is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?(\w{3,}(?:ed|en))\b/gi;
  const findings: Finding[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const span = m[0];
    const index = m.index;
    const line = text.slice(0, index).split("\n").length;
    const clipped = span.slice(0, 60);
    if (exclude.includes(clipped.toLowerCase())) continue;
    findings.push({
      ruleId: ruleId ?? "k-passive",
      severity: severity ?? "HIGH",
      line,
      match: clipped,
      message: `King: passive voice: "${clipped}"`,
    });
  }
  return findings;
}
