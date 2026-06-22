import type { Finding, Severity } from "../types.js";
import { wordlistMatch } from "./wordlist.js";

export function densityStat(
  text: string,
  params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const signal = typeof params?.signal === "string" ? params.signal : undefined;
  const perThousand = typeof params?.perThousand === "number" ? params.perThousand : 4;
  const minWords = typeof params?.minWords === "number" ? params.minWords : 30;

  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < minWords) return [];

  let count: number;
  if (signal === "emdash") {
    count = (text.match(/—/g) || []).length;
  } else if (signal === "filler") {
    const list = Array.isArray(params?.list) ? (params.list as string[]) : [];
    count = wordlistMatch(text, list).length;
  } else if (signal === "nominalization") {
    count = (text.match(/\b[a-z]{2,}(?:tion|ment|ance|ence)s?\b/gi) || []).length;
  } else {
    // unknown or absent signal
    return [];
  }

  const density = (count / words) * 1000;
  if (density <= perThousand) return [];

  return [
    {
      ruleId: ruleId ?? "s-density",
      severity: severity ?? "MEDIUM",
      line: undefined,
      match: `${count} / ${words} words`,
      message: `${signal} density ${density.toFixed(1)}/1000 words exceeds threshold of ${perThousand}/1000`,
    },
  ];
}
