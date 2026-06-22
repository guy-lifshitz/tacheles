import type { Finding, Severity } from "../types.js";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find all case-insensitive, non-overlapping occurrences of any term in `list`
 * within `text`, using alphanumeric-edge boundaries so partial-word matches
 * (e.g. "leveraged" for term "leverage") are excluded.
 */
export function wordlistMatch(
  text: string,
  list: string[]
): { index: number; line: number; match: string }[] {
  if (!list || list.length === 0) return [];
  const sorted = [...list].sort((a, b) => b.length - a.length);
  const pattern = sorted.map(escapeRegExp).join("|");
  const re = new RegExp(`(?<![A-Za-z0-9])(?:${pattern})(?![A-Za-z0-9])`, "gi");
  const results: { index: number; line: number; match: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const index = m.index;
    const line = text.slice(0, index).split("\n").length;
    results.push({ index, line, match: m[0] });
  }
  return results;
}

/**
 * Returns a DetectorFn that flags all occurrences of terms in `params.list`
 * using case-insensitive, alphanumeric-edge-boundary matching.
 * Terms are read from params at call time; the detector itself holds no list.
 */
export function makeWordlistDetector(
  defaultRuleId: string,
  defaultSeverity: Severity,
  messageLabel: string
): (text: string, params?: Record<string, unknown>, ruleId?: string, severity?: Severity) => Finding[] {
  return function (text, params, ruleId, severity) {
    const list = Array.isArray(params?.list) ? (params.list as string[]) : [];
    const exclude = Array.isArray(params?.exclude)
      ? (params.exclude as unknown[]).filter((x): x is string => typeof x === "string").map((s) => s.toLowerCase())
      : [];
    const label =
      typeof params?.label === "string" && params.label !== ""
        ? params.label
        : messageLabel;
    return wordlistMatch(text, list)
      .filter(({ match }) => !exclude.includes(match.toLowerCase()))
      .map(({ line, match }) => {
        const clipped = match.slice(0, 60);
        return {
          ruleId: ruleId ?? defaultRuleId,
          severity: severity ?? defaultSeverity,
          line,
          match: clipped,
          message: `${label}: "${clipped}"`,
        };
      });
  };
}
