import type { Finding, Severity } from "../types.js";

// ---------------------------------------------------------------------------
// Rhythm-stat battery for "r-uniform-polish" (rhythm tell #7).
// Detects uniformity (LLM tell) via sentence-length CV, paragraph-length CV,
// and optional 2nd-order-diff dispersion.
// A_n (Kim-Jo burstiness) is COMPUTED but NEVER used as a gate: diagnostic only.
// ---------------------------------------------------------------------------

export function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function populationSd(nums: number[]): number {
  if (nums.length === 0) return 0;
  const mu = mean(nums);
  const variance = mean(nums.map((x) => (x - mu) ** 2));
  return Math.sqrt(variance);
}

export function populationCv(nums: number[]): number {
  const mu = mean(nums);
  if (mu === 0) return 0;
  return populationSd(nums) / mu;
}

/**
 * Sentence tokenization matching the spec and fingerprint.ts reference:
 * split on punctuation runs, keep segments with ≥1 word.
 */
export function sentenceLengths(text: string): number[] {
  return text
    .split(/[.!?…]+[\s"»)]*/u)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter((w) => w.length > 0).length >= 1)
    .map((s) => s.split(/\s+/).filter((w) => w.length > 0).length);
}

/**
 * Paragraph word counts: split on blank lines, keep non-empty paragraphs.
 */
export function paragraphCounts(text: string): number[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim().split(/\s+/).filter((w) => w.length > 0).length)
    .filter((n) => n > 0);
}

/**
 * 2nd-order differences of sentence lengths.
 * d2[i] = slen[i+2] − 2*slen[i+1] + slen[i]
 */
function secondDiffStd(slen: number[]): number {
  if (slen.length < 3) return 0;
  const d2: number[] = [];
  for (let i = 0; i <= slen.length - 3; i++) {
    const a = slen[i], b = slen[i + 1], c = slen[i + 2];
    if (a === undefined || b === undefined || c === undefined) continue;
    d2.push(c - 2 * b + a);
  }
  return populationSd(d2);
}

/**
 * Kim-Jo A_n diagnostic statistic (NEVER used as a gate; reported in message only).
 * A_n = (sqrt(n+1)*r - sqrt(n-1)) / ((sqrt(n+1)-2)*r + sqrt(n-1))
 * where r = populationSd/mean(slen), n = slen.length.
 * Returns NaN if denominator is ~0.
 */
function computeAn(slen: number[]): number {
  const n = slen.length;
  if (n < 2) return NaN;
  const mu = mean(slen);
  if (mu === 0) return NaN;
  const r = populationSd(slen) / mu;
  const denom = (Math.sqrt(n + 1) - 2) * r + Math.sqrt(n - 1);
  if (Math.abs(denom) < 1e-12) return NaN;
  return (Math.sqrt(n + 1) * r - Math.sqrt(n - 1)) / denom;
}

export function paraUniformity(
  text: string,
  params?: Record<string, unknown>,
  ruleId?: string,
  severity?: Severity
): Finding[] {
  // --- Read params with internal defaults ---
  const minSentences =
    typeof params?.minSentences === "number" ? params.minSentences : 8;
  const sentCvFloor =
    typeof params?.sentCvFloor === "number" ? params.sentCvFloor : 0.55;
  const paraCvFloor =
    typeof params?.paraCvFloor === "number" ? params.paraCvFloor : 0.2;
  const secondDiffFloor =
    typeof params?.secondDiffFloor === "number"
      ? params.secondDiffFloor
      : undefined;

  // --- Compute metrics ---
  const slen = sentenceLengths(text);

  // Short-input gate: MUST come before any flagging
  if (slen.length < minSentences) return [];

  const sentCv = populationCv(slen);
  const paraCounts = paragraphCounts(text);
  const paraCV = populationCv(paraCounts);
  const sd2 = secondDiffStd(slen);

  // A_n: DIAGNOSTIC ONLY, never compared to a threshold
  const An = computeAn(slen);

  // --- Evaluate active gates ---
  const breaches: string[] = [];

  // Sentence-CV gate (ALWAYS active)
  if (sentCv < sentCvFloor) {
    breaches.push(
      `sentence-length CV ${sentCv.toFixed(2)} < ${sentCvFloor.toFixed(2)} (flat/over-polished)`
    );
  }

  // Paragraph-CV gate (requires ≥3 paragraphs)
  if (paraCounts.length >= 3 && paraCV < paraCvFloor) {
    breaches.push(`paraCV ${paraCV.toFixed(2)} < ${paraCvFloor.toFixed(2)}`);
  }

  // 2nd-order-diff gate (OPTIONAL: only when secondDiffFloor is set)
  if (secondDiffFloor !== undefined && sd2 < secondDiffFloor) {
    breaches.push(
      `2nd-order-diff std ${sd2.toFixed(2)} < ${secondDiffFloor.toFixed(2)}`
    );
  }

  if (breaches.length === 0) return [];

  // Build message: "Uniform rhythm: <breach1>. <breach2>. [A_n=X n=Y]"
  const anStr = isNaN(An) ? "NaN" : An.toFixed(2);
  const breachText = breaches.join(". ");
  const message = `Uniform rhythm: ${breachText}. [A_n=${anStr} n=${slen.length}]`;

  const matchParts: string[] = [
    `sentCV=${sentCv.toFixed(2)}`,
    `paraCV=${paraCV.toFixed(2)}`,
    `n=${slen.length}`,
  ];

  return [
    {
      ruleId: ruleId ?? "r-uniform-polish",
      severity: severity ?? "HIGH",
      line: undefined,
      match: matchParts.join(", "),
      message,
    },
  ];
}
