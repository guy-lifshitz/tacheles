import type { Finding, Severity } from "../types.js";

export function kingAdverbs(
  text: string,
  params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const minLength = typeof params?.minLength === "number" ? params.minLength : 5;
  const exclude = Array.isArray(params?.exclude)
    ? (params.exclude as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const N = minLength - 2;
  const re = new RegExp(`\\b([A-Za-z]{${N},}ly)\\b`, "gi");
  const findings: Finding[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const word = m[1]!;
    if (exclude.includes(word.toLowerCase())) continue;
    const index = m.index;
    const line = text.slice(0, index).split("\n").length;
    const clipped = word.slice(0, 60);
    findings.push({
      ruleId: ruleId ?? "k-adverbs",
      severity: severity ?? "HIGH",
      line,
      match: clipped,
      message: `King: -ly adverb: "${clipped}"`,
    });
  }
  return findings;
}
