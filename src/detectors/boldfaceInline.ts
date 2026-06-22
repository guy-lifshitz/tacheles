import type { Finding, Severity } from "../types.js";

// Detects mid-text bold (not markdown headers, not code fences)
// Pattern: **word** that is not preceded by # (headers) or at line start with #
const BOLD_INLINE_RE = /\*\*[a-z][^*]+\*\*/g;

export function boldfaceInline(text: string, _params?: Record<string, unknown>, ruleId?: string, severity?: Severity): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split("\n");

  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines.at(i);
    if (line === undefined) continue;
    // Track fenced code block state
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    // Skip markdown headers (lines starting with #)
    if (/^\s*#+/.test(line)) continue;
    // Skip bullet-list bold headers (rule-7 covers those; avoid double-flag)
    if (/^\s*[-*]\s+\*\*/.test(line)) continue;

    BOLD_INLINE_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = BOLD_INLINE_RE.exec(line)) !== null) {
      const [full] = match;
      const matched = full ?? "";
      findings.push({
        ruleId: ruleId ?? "rule-8-boldface-inline",
        severity: severity ?? "MEDIUM",
        line: i + 1,
        match: matched.slice(0, 60),
        message: `Boldface inline at line ${i + 1}: "${matched.slice(0, 60)}"`,
      });
    }
  }

  return findings;
}
