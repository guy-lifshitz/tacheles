import type { Finding, Severity } from "../types.js";
import { maskCode } from "../check.js";

export function countWords(text: string): number {
  let body = text;
  if (text.startsWith("---")) {
    const CLOSER_RE = /\n---(?:\n|$)/;
    const closeMatch = CLOSER_RE.exec(text.slice(3));
    if (closeMatch) {
      body = text.slice(3 + closeMatch.index + closeMatch[0].length);
    }
  }
  return maskCode(body).split(/\s+/).filter(Boolean).length;
}

export function kingLengthCut(
  original: string,
  rewrite: string,
  params?: { ratio?: number },
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const ratio =
    typeof params?.ratio === "number" && params.ratio > 0 ? params.ratio : 0.9;
  const originalWords = countWords(original);
  const rewriteWords = countWords(rewrite);
  const threshold = originalWords * ratio;

  if (rewriteWords <= threshold) return [];

  const pct =
    originalWords === 0
      ? "∞"
      : String(Math.round((rewriteWords / originalWords) * 100));
  const ratioPct = Math.round(ratio * 100);

  return [
    {
      ruleId: ruleId ?? "k-length-cut",
      severity: severity ?? "LOW",
      match: `${rewriteWords}/${originalWords} words`,
      message: `2nd draft is ${rewriteWords} words, ${pct}% of the 1st draft's ${originalWords} (King R2 wants <= ${ratioPct}%)`,
    },
  ];
}
