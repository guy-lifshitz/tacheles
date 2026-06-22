import type { Finding, Severity } from "../types.js";

/**
 * Distributional-proxy detectors for rhythm tells r-reframe-opener and r-closing-nugget.
 *
 * These detectors flag structural patterns that correlate with over-used voice tells.
 * Whether a specific instance is a genuine stylistic problem is a semantic judgment that
 * belongs in the LLM rewrite subcommand, not here.
 */

// ── r-reframe-opener (antithesis) ────────────────────────────────────────────
// Flags define-then-negate constructions: "not X but Y", "it's not X, it's Y", etc.
// One reframe per piece can be strong voice; the pattern becomes a tell when it repeats.

const REFRAME_PATTERNS = [
  /\bnot\s+\w[\w\s,]{0,40}\bbut\b/gi,                         // not X but Y
  /\bit'?s\s+not\b[^.!?]*\bit'?s\b/gi,                        // it's not ... it's
  /\bthis\s+isn'?t\b[^.!?]*\bthis\s+is\b/gi,                  // this isn't ... this is
  /^(Not|It'?s not|This isn'?t|The right question is not)\b/g, // capitalised openers at line start
];

export function antithesis(
  text: string,
  _params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines.at(i);
    if (line === undefined) continue;
    for (const re of REFRAME_PATTERNS) {
      re.lastIndex = 0;
      const match = re.exec(line);
      if (match) {
        const [full] = match;
        const matched = full ?? "";
        findings.push({
          ruleId: ruleId ?? "r-reframe-opener",
          severity: severity ?? "HIGH",
          line: i + 1,
          match: matched.slice(0, 60),
          message: `Reframe opener at line ${i + 1}: "${matched.slice(0, 60)}"`,
        });
        break; // one finding per line, first pattern wins
      }
    }
  }

  return findings;
}

// ── r-closing-nugget (aphoristicClose) ──────────────────────────────────────
// Flags the pattern where ≥N paragraphs each end with a short (≤maxNuggetWords words)
// declarative sentence that does not open with a connective. The statistical pattern is
// tractable; deciding whether a specific closing line is earned prose or a crafted darling
// is semantic and belongs in the rewrite layer.

const DEFAULT_MIN_PARAGRAPHS = 3;
const DEFAULT_MAX_NUGGET_WORDS = 9;

// Lines that start with a connective word are not counted as nuggets.
const CONNECTIVE_RE = /^(and|but|or|so|yet|because|although|however|therefore|thus|hence|since|while|when|if|as|that|this|these|those|it|they|he|she|we|i)\b/i;

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function lastSentence(para: string): string {
  // Split on sentence-ending punctuation; return last non-empty chunk.
  const sentences = para.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const last = sentences.at(-1);
  return last !== undefined ? last.trim() : para.trim();
}

export function aphoristicClose(
  text: string,
  params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const minParagraphs = typeof params?.minParagraphs === "number" ? params.minParagraphs : DEFAULT_MIN_PARAGRAPHS;
  const maxNuggetWords = typeof params?.maxNuggetWords === "number" ? params.maxNuggetWords : DEFAULT_MAX_NUGGET_WORDS;

  // Split into paragraphs (blank-line separated)
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  if (paragraphs.length < minParagraphs) return [];

  // Collect paragraphs whose last sentence qualifies as a nugget
  const nuggetParas: Array<{ paraIndex: number; nugget: string }> = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs.at(i);
    if (para === undefined) continue;
    const last = lastSentence(para);
    const wc = wordCount(last);
    if (wc <= maxNuggetWords && wc >= 2 && !CONNECTIVE_RE.test(last)) {
      nuggetParas.push({ paraIndex: i, nugget: last });
    }
  }

  if (nuggetParas.length < minParagraphs) return [];

  // Pattern detected: emit one finding pointing to first occurrence.
  // nuggetParas is non-empty here (guarded by the length check above).
  const firstNugget = nuggetParas.at(0)!.nugget;
  return [
    {
      ruleId: ruleId ?? "r-closing-nugget",
      severity: severity ?? "MEDIUM",
      message: `Per-paragraph closing nugget pattern: ${nuggetParas.length} paragraphs end with a short aphoristic line (≤${maxNuggetWords} words). First: "${firstNugget}"`,
      match: firstNugget.slice(0, 60),
    },
  ];
}
