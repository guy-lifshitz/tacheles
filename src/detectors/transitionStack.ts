import type { Finding, Severity } from "../types.js";

// Detects transition word stacks: ≥2 of {furthermore, moreover, additionally, however, nevertheless}
// within a 500-word window
const TRANSITION_WORDS = ["furthermore", "moreover", "additionally", "however", "nevertheless"];
const TRANSITION_RE = new RegExp(`\\b(${TRANSITION_WORDS.join("|")})\\b`, "gi");

function wordsUpToIndex(text: string, endIdx: number): number {
  return text.slice(0, endIdx).split(/\s+/).filter((w) => w.length > 0).length;
}

export function transitionStack(text: string, _params?: Record<string, unknown>, ruleId?: string, severity?: Severity): Finding[] {
  const findings: Finding[] = [];

  // Find all transition word positions
  const allWords = text.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = allWords.length;

  // Collect all matches with their word position
  const matches: { word: string; wordPos: number; charPos: number }[] = [];
  TRANSITION_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TRANSITION_RE.exec(text)) !== null) {
    const wordPos = wordsUpToIndex(text, m.index);
    const [, word] = m;
    matches.push({ word: word ?? "", wordPos, charPos: m.index });
  }

  if (matches.length < 2) return findings;

  // Sliding 500-word window: find windows with >=2 transitions.
  // Iterate all windows; dedupe by advancing past the last match in a flagged cluster
  // so overlapping windows from the same cluster don't produce duplicate findings.
  let i = 0;
  while (i < matches.length) {
    const current = matches.at(i);
    if (current === undefined) break;
    const windowStart = current.wordPos;
    const windowEnd = windowStart + 500;

    const inWindow = matches.filter((mx) => mx.wordPos >= windowStart && mx.wordPos < windowEnd);
    if (inWindow.length >= 2) {
      findings.push({
        ruleId: ruleId ?? "rule-9-transition-stack",
        severity: severity ?? "MEDIUM",
        match: inWindow.map((mx) => mx.word).slice(0, 3).join(", ").slice(0, 60),
        message: `Transition stack: ${inWindow.length} transition words in 500-word window: ${inWindow.map((mx) => mx.word).join(", ")}`,
      });
      // Advance past all matches in this window to avoid re-flagging the same cluster
      const lastInWindow = inWindow.at(-1);
      if (lastInWindow !== undefined) {
        while (i < matches.length && (matches.at(i)?.wordPos ?? Infinity) <= lastInWindow.wordPos) {
          i++;
        }
      } else {
        i++;
      }
    } else {
      i++;
    }
  }

  return findings;
}
