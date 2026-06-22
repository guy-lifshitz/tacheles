import type { Finding, Severity } from "../types.js";

export function emDashDensity(
  text: string,
  params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  const minWords = typeof params?.minWords === "number" ? params.minWords : 30;
  const perThousand = typeof params?.perThousand === "number" ? params.perThousand : 4;
  const words = text.split(/\s+/).filter(Boolean).length;
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
