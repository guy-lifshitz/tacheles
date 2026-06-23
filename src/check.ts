import { readFileSync } from "fs";
import type { Finding, Profile, Severity } from "./types.js";
import { colonHeader } from "./detectors/colonHeader.js";
import { tricolon } from "./detectors/tricolon.js";
import { bothSidesHedge } from "./detectors/bothSidesHedge.js";
import { paraUniformity } from "./detectors/paraUniformity.js";
import { boldListHeader } from "./detectors/boldListHeader.js";
import { boldfaceInline } from "./detectors/boldfaceInline.js";
import { transitionStack } from "./detectors/transitionStack.js";
import { metaScaffolding } from "./detectors/metaScaffolding.js";
import { asciiCyrillicHyphen } from "./detectors/asciiCyrillicHyphen.js";
import { antithesis, aphoristicClose } from "./detectors/disabled.js";
import { bannedVocab } from "./detectors/bannedVocab.js";
import { bannedCopula } from "./detectors/bannedCopula.js";
import { hedgeOpener } from "./detectors/hedgeOpener.js";
import { significanceWrap } from "./detectors/significanceWrap.js";
import { rhetoricalQuestionAnswer } from "./detectors/rhetoricalQuestionAnswer.js";
import { kingFancyWord } from "./detectors/kingFancyWord.js";
import { kingClicheSimile } from "./detectors/kingClicheSimile.js";
import { kingPetPeeve } from "./detectors/kingPetPeeve.js";
import { kingAdverbs } from "./detectors/kingAdverbs.js";
import { kingPassive } from "./detectors/kingPassive.js";
import { significanceAnnounce } from "./detectors/significanceAnnounce.js";
import { boldAphorism } from "./detectors/boldAphorism.js";
import { italicDrama } from "./detectors/italicDrama.js";
import { emDashDensity } from "./detectors/emDashDensity.js";
import { sentenceTriad } from "./detectors/sentenceTriad.js";
import { makeWordlistDetector } from "./detectors/wordlist.js";
import { densityStat } from "./detectors/densityStat.js";
import { regexList } from "./detectors/regexList.js";
import { resolveDetector, getTellParams } from "./tells/registry.js";

const wordlist = makeWordlistDetector("s-wordlist", "HIGH", "wordlist");

type DetectorFn = (text: string, params?: Record<string, unknown>, ruleId?: string, severity?: Severity) => Finding[];

// String-keyed: a key typo vs the registry's detector name only surfaces at runtime via
// the warn-and-skip guard (line ~110). If the detector set grows, add a test that
// cross-checks Object.keys(DETECTORS) against all active-status registry entries.
const DETECTORS: Record<string, DetectorFn> = {
  colonHeader,
  tricolon,
  antithesis,
  bothSidesHedge,
  aphoristicClose,
  paraUniformity,
  boldListHeader,
  boldfaceInline,
  transitionStack,
  metaScaffolding,
  asciiCyrillicHyphen,
  bannedVocab,
  bannedCopula,
  hedgeOpener,
  significanceWrap,
  rhetoricalQuestionAnswer,
  kingFancyWord,
  kingClicheSimile,
  kingPetPeeve,
  kingAdverbs,
  kingPassive,
  significanceAnnounce,
  boldAphorism,
  italicDrama,
  emDashDensity,
  sentenceTriad,
  wordlist,
  densityStat,
  regexList,
};

/**
 * Strip YAML frontmatter (--- ... ---) from markdown text before linting.
 * Returns { body, lineOffset } where lineOffset is the number of newlines in the
 * frontmatter block (including the opening ---, metadata, and closing --- line).
 * Detectors report findings with line numbers relative to the body; check() then
 * adds lineOffset to report findings with line numbers relative to the original file.
 *
 * Fallback behaviour: if the file starts with --- but has no proper closer,
 * the full text is returned with lineOffset=0 and a stderr warning is emitted.
 * Requires the closer to be a standalone --- line (not ---foo).
 */
export function stripFrontmatter(text: string): { body: string; lineOffset: number } {
  if (!text.startsWith("---")) return { body: text, lineOffset: 0 };
  // Require closer to be \n---\n or \n--- at EOF (not \n---foo)
  const CLOSER_RE = /\n---(?:\n|$)/;
  const closeMatch = CLOSER_RE.exec(text.slice(3));
  if (!closeMatch) {
    // Unclosed frontmatter: warn and lint full text
    process.stderr.write("warn: frontmatter opened but never closed; linting full text\n");
    return { body: text, lineOffset: 0 };
  }
  // endIdx is the byte index in original text where the closing \n---\n pattern begins
  const endIdx = 3 + closeMatch.index;
  const frontmatterBlock = text.slice(0, endIdx + closeMatch[0].length);
  const lineOffset = frontmatterBlock.split("\n").length - 1;
  return { body: text.slice(endIdx + closeMatch[0].length), lineOffset };
}

/**
 * Replace code regions with spaces so the prose linter never flags code.
 *
 * Masks fenced code blocks (``` or ~~~, optionally indented up to 3 spaces, per
 * CommonMark) and inline code spans (`...`). Every masked character becomes a
 * space and every newline is preserved, so character offsets and line counts are
 * unchanged: a detector's `text.slice(0, index).split("\n").length` line math
 * stays exact and findings keep reporting the right line.
 *
 * Without this, fence handling was per-detector and inconsistent — boldfaceInline
 * skipped fences, but bannedVocab/asciiCyrillicHyphen/king* linted straight
 * through them, so a README's own code examples tripped the linter.
 */
export function maskCode(text: string): string {
  const blank = (s: string) => s.replace(/[^\n]/g, " ");
  let openFence: string | undefined; // the opening fence run, e.g. "```" or "~~~~"
  return text
    .split("\n")
    .map((line) => {
      const run = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
      if (openFence === undefined) {
        if (run) {
          openFence = run; // mask the opening fence line itself
          return blank(line);
        }
        // Outside any fence: mask inline code spans only.
        return line.replace(/`+[^`\n]*`+/g, (m) => " ".repeat(m.length));
      }
      // Inside a fence: mask everything; close on a same-char, same-or-longer run.
      if (run && run[0] === openFence[0] && run.length >= openFence.length) {
        openFence = undefined;
      }
      return blank(line);
    })
    .join("\n");
}

/** Return the set of detector names currently wired into the DETECTORS map. */
export function getRegisteredDetectorNames(): string[] {
  return Object.keys(DETECTORS);
}

/**
 * Run all enabled rules (where rule.enabled === true) from the profile against the given text.
 * Each rule references a tell by stable id; the registry resolves the detector.
 * Returns an array of findings.
 */
export function check(text: string, profile: Profile, detectors: Record<string, DetectorFn> = DETECTORS): Finding[] {
  const findings: Finding[] = [];
  const { body, lineOffset } = stripFrontmatter(text);
  const lintableText = maskCode(body);

  for (const rule of profile.rules) {
    if (!rule.enabled) continue;

    // resolveDetector throws on unknown tell id or method:"llm-only"; both must propagate.
    // It returns null for planned/stub tells (not yet runnable); those are warn+skip below.
    const detectorName = resolveDetector(rule.tellId);

    if (detectorName === null) {
      // planned or stub detector: forward-compat skip with warn
      process.stderr.write(`warn: tell "${rule.tellId}" is not yet implemented; skipped\n`);
      continue;
    }

    const detector = detectors[detectorName];
    if (!detector) {
      // Forward-compat: tell active in registry but detector fn not yet wired into this build
      process.stderr.write(`warn: tell "${rule.tellId}" references unknown detector "${detectorName}"; skipped\n`);
      continue;
    }

    // Merge registry params with any profile-level params (profile overrides registry)
    const registryParams = getTellParams(rule.tellId);
    const mergedParams = (registryParams || rule.params)
      ? { ...registryParams, ...rule.params }
      : undefined;

    let ruleFindings: Finding[];
    try {
      ruleFindings = detector(lintableText, mergedParams, rule.tellId, rule.severity);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `error: detector for tell "${rule.tellId}" threw: ${errMsg}\n`
      );
      findings.push({ ruleId: rule.tellId, severity: "ERROR", message: `detector crashed: ${detectorName}: ${errMsg}` });
      continue;
    }
    for (const finding of ruleFindings) {
      if (finding.line !== undefined) {
        finding.line = finding.line + lineOffset;
      }
    }
    findings.push(...ruleFindings);
  }

  return findings;
}

/**
 * Read a file and run check() on its contents.
 * Throws on read error (caller handles exit 2).
 */
export function checkFile(filePath: string, profile: Profile): Finding[] {
  const text = readFileSync(filePath, "utf-8");
  return check(text, profile);
}
