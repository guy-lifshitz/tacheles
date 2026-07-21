import type { Finding, Severity } from "../types.js";
import { countWords } from "../words.js";

export function emDashDensity(
  text: string,
  params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const minWords = Number.isFinite(params?.minWords) ? (params?.minWords as number) : 30;
  const perThousand = Number.isFinite(params?.perThousand) ? (params?.perThousand as number) : 4;
  const words = countWords(text);
  if (words < minWords) return [];
  const emCount = (text.match(/—/g) || []).length;
  const density = (emCount / words) * 1000;
  if (density <= perThousand) return [];
  return [
    {
      ruleId: ruleId ?? "s-em-dash-density",
      severity: severity ?? "MEDIUM",
      line: undefined,
      match: `${emCount} em-dashes / ${words} words`,
      message: `Em-dash density ${density.toFixed(1)}/1000 words exceeds threshold of ${perThousand}/1000`,
    },
  ];
}
