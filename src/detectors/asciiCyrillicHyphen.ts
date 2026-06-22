import type { Finding, Severity } from "../types.js";

// Detects hyphenated compound word-word constructions that read as formal / LLM-generated.
const LEADING_IDENTIFIER = /[\p{L}\p{N}@/.`-]/u;
const TRAILING_IDENTIFIER = /[\p{L}\p{N}@/`-]/u;
const PATTERN_ASCII_CYR = /[A-Za-z]{3,}-[а-яёА-ЯЁ]{4,}/gu;
const PATTERN_ASCII_ASCII = /[A-Za-z]{3,}-[A-Za-z]{3,}/gu;
const HAS_LOWERCASE = /[a-z]/;

// Trailing `.` is ambiguous: could be sentence end OR domain separator.
// Check char after the `.` — if letter/digit → domain (identifier), skip.
function trailingInIdentifierContext(text: string, endIdx: number): boolean {
  if (endIdx >= text.length) return false;
  const c = text.at(endIdx);
  if (c === undefined) return false;
  if (TRAILING_IDENTIFIER.test(c)) return true;
  if (c === "." && endIdx + 1 < text.length) {
    const c2 = text.at(endIdx + 1);
    if (c2 !== undefined && /[\p{L}\p{N}]/u.test(c2)) return true;
  }
  return false;
}

export function asciiCyrillicHyphen(
  text: string,
  _params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();

  for (const pattern of [PATTERN_ASCII_CYR, PATTERN_ASCII_ASCII]) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const matched = m[0];
      const idx = m.index;
      const endIdx = idx + matched.length;

      const leadingChar = idx > 0 ? (text.at(idx - 1) ?? "") : "";
      if (leadingChar && LEADING_IDENTIFIER.test(leadingChar)) {
        if (m.index === pattern.lastIndex) pattern.lastIndex++;
        continue;
      }
      if (trailingInIdentifierContext(text, endIdx)) {
        if (m.index === pattern.lastIndex) pattern.lastIndex++;
        continue;
      }

      const asciiPart = matched.split("-").at(0) ?? "";
      if (!HAS_LOWERCASE.test(asciiPart)) {
        if (m.index === pattern.lastIndex) pattern.lastIndex++;
        continue;
      }

      const key = `${idx}:${matched}`;
      if (seen.has(key)) {
        if (m.index === pattern.lastIndex) pattern.lastIndex++;
        continue;
      }
      seen.add(key);

      const line = text.slice(0, idx).split("\n").length;
      findings.push({
        ruleId: ruleId ?? "rule-11-ascii-cyrillic-hyphen",
        severity: severity ?? "HIGH",
        line,
        match: matched.slice(0, 60),
        message: `Hyphenated compound at line ${line}: "${matched}" - reads as formal/LLM, restructure`,
      });
      if (m.index === pattern.lastIndex) pattern.lastIndex++;
    }
  }
  return findings;
}
