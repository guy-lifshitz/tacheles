import { readFileSync } from "fs";
import { resolve } from "path";
import {
  mean,
  populationCv,
  sentenceLengths,
  paragraphCounts,
} from "./detectors/paraUniformity.js";
import { stripFrontmatter, maskCode } from "./check.js";

export interface MeasureResult {
  file: string;
  words: number;
  sentences: number;
  paragraphs: number;
  sentenceLength: { mean: number; cv: number };
  paragraphLength: { cv: number };
  emDashPerThousand: number;
  suggestedProfile: {
    "s-em-dash-density": { perThousand: number };
    "r-uniform-polish": { sentCvFloor: number; paraCvFloor: number };
  };
}

/** Word count convention shared with emDashDensity: whitespace-split non-empty tokens. */
function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Compute deterministic stylometry numbers from a corpus of clean writing,
 * plus suggested profile params to calibrate a voice profile.
 * Reuses the linter's own segmentation and population-CV math so the numbers
 * match what the gates check.
 */
export function measure(text: string, file: string): MeasureResult {
  // Strip YAML frontmatter the same way check() does, then mask code blocks so
  // fenced content doesn't inflate stylometry numbers.
  const { body: rawBody } = stripFrontmatter(text);
  const body = maskCode(rawBody);

  const slen = sentenceLengths(body);
  const paraCounts = paragraphCounts(body);
  const words = countWords(body);

  const sentMean = mean(slen);
  const sentCv = populationCv(slen);
  const paraCv = populationCv(paraCounts);

  const emCount = (body.match(/—/g) || []).length;
  const emDashPerThousand = words > 0 ? (emCount / words) * 1000 : 0;

  return {
    file,
    words,
    sentences: slen.length,
    paragraphs: paraCounts.length,
    sentenceLength: { mean: round1(sentMean), cv: round2(sentCv) },
    paragraphLength: { cv: round2(paraCv) },
    emDashPerThousand: round1(emDashPerThousand),
    suggestedProfile: {
      "s-em-dash-density": {
        perThousand: Math.max(1, Math.ceil(emDashPerThousand)),
      },
      "r-uniform-polish": {
        sentCvFloor: round2(0.8 * sentCv),
        paraCvFloor: round2(0.8 * paraCv),
      },
    },
  };
}

/**
 * Read a corpus file and run measure() on it. When asJson is true, emit
 * machine-readable JSON to stdout; otherwise emit a human-readable block.
 * Either way, the one-line "measured:" summary goes to stderr. Returns the
 * process exit code.
 */
export function runMeasure(filePath: string, asJson = false): number {
  let text: string;
  try {
    text = readFileSync(resolve(filePath), "utf-8");
  } catch (e) {
    const readMsg = e instanceof Error ? e.message : String(e);
    process.stderr.write(`Error: cannot read file "${filePath}": ${readMsg}\n`);
    return 2;
  }

  if (text.trim().length === 0) {
    process.stderr.write(`Error: file "${filePath}" is empty\n`);
    return 2;
  }

  const result = measure(text, filePath);

  if (asJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    process.stdout.write(
      `${result.file}\n\n` +
      `  words           ${result.words}\n` +
      `  sentences       ${result.sentences}\n` +
      `  paragraphs      ${result.paragraphs}\n` +
      `  sentence mean   ${result.sentenceLength.mean.toFixed(1)} words\n` +
      `  sentence CV     ${result.sentenceLength.cv.toFixed(2)}\n` +
      `  paragraph CV    ${result.paragraphLength.cv.toFixed(2)}\n` +
      `  em-dash/1k      ${result.emDashPerThousand.toFixed(1)}\n\n` +
      `  suggested profile params:\n` +
      `    s-em-dash-density.perThousand  ${result.suggestedProfile["s-em-dash-density"].perThousand}\n` +
      `    r-uniform-polish.sentCvFloor   ${result.suggestedProfile["r-uniform-polish"].sentCvFloor.toFixed(2)}\n` +
      `    r-uniform-polish.paraCvFloor   ${result.suggestedProfile["r-uniform-polish"].paraCvFloor.toFixed(2)}\n`
    );
  }

  const summary =
    `measured: mean ${result.sentenceLength.mean.toFixed(1)} words, ` +
    `sentence CV ${result.sentenceLength.cv.toFixed(2)}, ` +
    `paragraph CV ${result.paragraphLength.cv.toFixed(2)}, ` +
    `em-dash ${result.emDashPerThousand.toFixed(1)}/1k. ` +
    `Suggested floors are a starting point; validate that your own corpus still passes, and loosen if not.\n`;
  process.stderr.write(summary);

  return 0;
}
