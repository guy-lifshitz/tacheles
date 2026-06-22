import type { Finding, Severity } from "../types.js";

// Detects meta-scaffolding: announcing structure instead of writing content.
// A. Summary labels ("коротко:", "TL;DR:", "in short:")
// B. Pointing at obvious ("как видно", "it's worth noting")
// C. Announcing ("сейчас объясню", "let me break this down")
const SCAFFOLDING_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /^\s*(?:коротко|вкратце|кратко|итого|резюме)\s*[:—\-]/gim, label: "summary-label" },
  { pattern: /^\s*в\s+двух\s+словах\s*[:—\-]/gim, label: "summary-label" },
  { pattern: /^\s*если\s+кратко\s*[,.:]/gim, label: "summary-label" },
  { pattern: /^\s*TL\s*;?\s*DR\s*[:—\-]/gim, label: "summary-label" },
  { pattern: /^\s*(?:in\s+short|in\s+summary|to\s+summarize|briefly|in\s+a\s+nutshell)\s*[:—\-]/gim, label: "summary-label" },
  { pattern: /(?<![\p{L}\p{N}])(?:как\s+видно|как\s+(?:уже\s+)?(?:было\s+)?(?:отмечено|сказано|упомянуто)\s+(?:выше|ранее))(?![\p{L}\p{N}])/giu, label: "meta-pointer" },
  { pattern: /(?<![\p{L}\p{N}])(?:стоит|следует|важно|надо)\s+(?:заметить|отметить|понимать|подчеркнуть)(?![\p{L}\p{N}])/giu, label: "meta-pointer" },
  { pattern: /\b(?:as\s+(?:noted|mentioned|discussed)\s+(?:above|earlier)|it['’]?s\s+worth\s+noting|important\s+to\s+note)\b/gi, label: "meta-pointer" },
  { pattern: /(?<![\p{L}\p{N}])(?:сейчас\s+объясню|позволь(?:те)?\s+(?:мне\s+)?(?:разложить|объяснить|рассказать)|давайте?\s+(?:разберём(?:ся)?|посмотрим|рассмотрим)|разберём\s+по\s+полкам)(?![\p{L}\p{N}])/giu, label: "announcement" },
  { pattern: /\b(?:let\s+me\s+(?:explain|break\s+this\s+down|walk\s+you\s+through)|let['’]?s\s+(?:look\s+at|break\s+down|dive\s+into))\b/gi, label: "announcement" },
];

export function metaScaffolding(
  text: string,
  _params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const findings: Finding[] = [];
  for (const { pattern, label } of SCAFFOLDING_PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const line = text.slice(0, m.index).split("\n").length;
      findings.push({
        ruleId: ruleId ?? "rule-10-meta-scaffolding",
        severity: severity ?? "HIGH",
        line,
        match: m[0].trim().slice(0, 60),
        message: `Meta-scaffolding (${label}) at line ${line}: "${m[0].trim()}"`,
      });
      if (m.index === pattern.lastIndex) pattern.lastIndex++;
    }
  }
  return findings;
}
