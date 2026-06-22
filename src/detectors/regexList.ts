import type { Finding, Severity } from "../types.js";

interface PatternEntry {
  re: string;
  flags?: string;
  message?: string;
}

export function regexList(
  text: string,
  params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const patterns: PatternEntry[] = Array.isArray(params?.patterns)
    ? (params.patterns as PatternEntry[])
    : [];

  if (patterns.length === 0) return [];

  const findings: Finding[] = [];

  for (const pattern of patterns) {
    if (typeof pattern.re !== "string") continue;

    // Ensure global flag is present for iteration; do not mutate caller input.
    // When no flags are specified, default to "gi" (case-insensitive + global).
    // When flags are explicitly provided, append "g" if absent.
    const hasExplicitFlags = typeof pattern.flags === "string" && pattern.flags !== "";
    const baseFlags = hasExplicitFlags ? pattern.flags! : "i";
    const flags = baseFlags.includes("g") ? baseFlags : baseFlags + "g";

    let re: RegExp;
    try {
      re = new RegExp(pattern.re, flags);
    } catch {
      // Invalid regex: skip this pattern
      continue;
    }

    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      // Guard zero-width matches to prevent infinite loop
      if (m.index === re.lastIndex) {
        re.lastIndex++;
        continue;
      }

      const index = m.index;
      const line = text.slice(0, index).split("\n").length;
      const clipped = m[0].slice(0, 60);
      const message =
        typeof pattern.message === "string"
          ? pattern.message
          : `regex: "${clipped}"`;

      findings.push({
        ruleId: ruleId ?? "s-regexlist",
        severity: severity ?? "MEDIUM",
        line,
        match: clipped,
        message,
      });
    }
  }

  return findings;
}
