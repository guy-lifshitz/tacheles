import type { Finding, Severity } from "../types.js";

export function sentenceTriad(
  text: string,
  params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const minRun = typeof params?.minRun === "number" ? params.minRun : 3;
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const findings: Finding[] = [];
  let runWord: string | null = null;
  let runLen = 0;

  function flushRun() {
    if (runLen >= minRun && runWord !== null) {
      const cap = runWord.charAt(0).toUpperCase() + runWord.slice(1);
      findings.push({
        ruleId: ruleId ?? "r-sentence-triad",
        severity: severity ?? "MEDIUM",
        line: undefined,
        match: `${cap} ×${runLen}`,
        message: `${runLen} consecutive sentences share opening word "${runWord}"`,
      });
    }
  }

  for (const sentence of sentences) {
    const m = /^[^A-Za-z]*([A-Za-z]+)/.exec(sentence);
    const word = m ? m[1]!.toLowerCase() : null;
    if (word !== null && word === runWord) {
      runLen++;
    } else {
      flushRun();
      runWord = word;
      runLen = word !== null ? 1 : 0;
    }
  }
  flushRun();

  return findings;
}
