import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { check } from "./check.js";
import { runMeasure } from "./measure.js";
import type { Profile } from "./types.js";
import { kingLengthCut, countWords } from "./detectors/kingLengthCut.js";
import { EMBEDDED_PROFILE_PATHS } from "./embedded.js";
import type { Finding, Severity } from "./types.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Default profile id when no --profile flag or frontmatter voice-profile is given.
// Generic, author-neutral EN longform profile: works out-of-box on any prose.
const DEFAULT_PROFILE_ID = "essay-en";

function loadProfileById(id: string): Profile {
  // Primary: read from disk next to this module (dev, Node dist/, npm install).
  // Fallback: the embedded copy, for the compiled standalone binary (see
  // src/embedded.ts). Only built-in ids have an embedded copy.
  const profilePath = join(__dirname, "profiles", `${id}.json`);
  let content: string;
  try {
    content = readFileSync(profilePath, "utf-8");
  } catch (e) {
    const embedded = EMBEDDED_PROFILE_PATHS[id];
    if (!embedded) throw e;
    content = readFileSync(embedded, "utf-8");
  }
  return JSON.parse(content) as Profile;
}

function loadProfileFromPath(customPath: string): Profile {
  const content = readFileSync(resolve(customPath), "utf-8");
  return JSON.parse(content) as Profile;
}

/** Extract `voice-profile:` value from YAML frontmatter if present. */
function extractFrontmatterProfile(text: string): string | undefined {
  if (!text.startsWith("---")) return undefined;
  const CLOSER_RE = /\n---(?:\n|$)/;
  const closeMatch = CLOSER_RE.exec(text.slice(3));
  if (!closeMatch) return undefined;
  const frontmatter = text.slice(3, 3 + closeMatch.index);
  const match = /^voice-profile:\s*(.+)$/m.exec(frontmatter);
  if (!match) return undefined;
  const [, value] = match;
  return value?.trim();
}

const SEVERITY_ORDER: Severity[] = ["HIGH", "MEDIUM", "LOW", "ERROR"];

/** Count findings per severity, preserving HIGH→MEDIUM→LOW→ERROR order. */
function severityCounts(findings: Finding[]): { sev: Severity; n: number }[] {
  return SEVERITY_ORDER
    .map((sev) => ({ sev, n: findings.filter((f) => f.severity === sev).length }))
    .filter(({ n }) => n > 0);
}

/** One-line summary for stderr, e.g. "FAIL — 3 HIGH, 2 MEDIUM" or "PASS — clean". */
function summaryLine(findings: Finding[], pass: boolean): string {
  const breakdown = severityCounts(findings).map(({ sev, n }) => `${n} ${sev}`).join(", ");
  if (pass) return breakdown ? `PASS — ${breakdown} (0 HIGH)` : "PASS — clean";
  return `FAIL — ${breakdown}`;
}

/**
 * Human-readable findings table: one line per finding, sorted by severity then
 * line, aligned columns. This is the default; `--json` switches to machine output.
 */
function formatPretty(file: string, profileName: string, findings: Finding[]): string {
  const header = `${file}  (profile: ${profileName})`;
  if (findings.length === 0) return `${header}\n\n  no findings\n`;
  const rank = (s: Severity) => SEVERITY_ORDER.indexOf(s);
  const sorted = [...findings].sort(
    (a, b) => rank(a.severity) - rank(b.severity) || (a.line ?? Infinity) - (b.line ?? Infinity),
  );
  const idWidth = Math.min(20, Math.max(...findings.map((f) => f.ruleId.length)));
  const rows = sorted.map((f) => {
    const sev = f.severity.padEnd(6);
    const loc = (f.line !== undefined ? `line ${f.line}` : "—").padStart(9);
    const id = f.ruleId.padEnd(idWidth);
    const detail = (f.match ?? f.message).replace(/\s+/g, " ").slice(0, 70);
    return `  ${sev} ${loc}  ${id}  ${detail}`;
  });
  return `${header}\n\n${rows.join("\n")}\n`;
}

function usage(): never {
  process.stderr.write(
    "Usage: tacheles check <file> [--profile <id-or-path>]\n" +
    "       tacheles compare-drafts <orig> <rewrite> [--ratio <0..1>]\n" +
    "       tacheles measure <corpus-file>\n" +
    "\n" +
    "  check:\n" +
    "    --profile <id>   Load a profile by id (default: essay-en)\n" +
    "    --profile <path> Load a profile from a JSON file path\n" +
    "    --json           Emit machine-readable JSON (default: human-readable)\n" +
    "\n" +
    "  measure:\n" +
    "    <corpus-file>    Path to a corpus of your own clean writing;\n" +
    "                     prints stylometry numbers and suggested profile params\n" +
    "\n" +
    "  compare-drafts:\n" +
    "    <orig>           Path to the original (1st) draft\n" +
    "    <rewrite>        Path to the rewrite (2nd) draft\n" +
    "    --ratio <n>      Cut ratio threshold (default 0.9 = King R2 90% rule)\n" +
    "    --json           Emit machine-readable JSON (default: human-readable)\n" +
    "\n" +
    "Profile resolution order: --profile flag > frontmatter voice-profile: > default\n"
  );
  process.exit(2);
}

const args = process.argv.slice(2);

if (args[0] === "check") {
  const rawFilePath = args[1];
  if (rawFilePath === undefined) usage();
  const filePath = rawFilePath;
  let profileArg: string | undefined;
  let asJson = false;

  for (let i = 2; i < args.length; i++) {
    const next = args[i + 1];
    if (args[i] === "--profile" && next) {
      profileArg = next;
      i++;
    } else if (args[i] === "--json") {
      asJson = true;
    }
  }

  let text: string;
  try {
    text = readFileSync(resolve(filePath), "utf-8");
  } catch (e) {
    const readMsg = e instanceof Error ? e.message : String(e);
    process.stderr.write(`Error: cannot read file "${filePath}": ${readMsg}\n`);
    process.exit(2);
  }

  let profile: Profile;
  try {
    if (profileArg) {
      // Treat as a file path when it exists on disk; otherwise interpret as a profile id.
      if (existsSync(profileArg)) {
        profile = loadProfileFromPath(profileArg);
      } else {
        profile = loadProfileById(profileArg);
      }
    } else {
      const frontmatterProfile = extractFrontmatterProfile(text);
      if (frontmatterProfile) {
        profile = loadProfileById(frontmatterProfile);
      } else {
        profile = loadProfileById(DEFAULT_PROFILE_ID);
      }
    }
  } catch (e) {
    const profileMsg = e instanceof Error ? e.message : String(e);
    // Add a hint when the arg looks like a bare id that failed to resolve.
    const hint = profileArg && !profileArg.includes("/") && !profileArg.endsWith(".json")
      ? " (tip: bare ids load from profiles/; pass a file path for a custom profile)"
      : "";
    process.stderr.write(`Error: cannot load profile "${profileArg ?? DEFAULT_PROFILE_ID}": ${profileMsg}${hint}\n`);
    process.exit(2);
  }

  const findings = check(text, profile);
  const highCount = findings.filter((f) => f.severity === "HIGH").length;
  const pass = highCount === 0;

  if (asJson) {
    const output = { file: filePath, profile: profile.name, findings, highCount, pass };
    process.stdout.write(JSON.stringify(output) + "\n");
  } else {
    process.stdout.write(formatPretty(filePath, profile.name, findings));
  }
  process.stderr.write(summaryLine(findings, pass) + "\n");

  process.exit(pass ? 0 : 1);
} else if (args[0] === "measure") {
  const rawFilePath = args[1];
  if (rawFilePath === undefined) usage();
  let asJsonMeasure = false;
  for (let i = 2; i < args.length; i++) {
    if (args[i] === "--json") asJsonMeasure = true;
  }
  process.exit(runMeasure(rawFilePath, asJsonMeasure));
} else if (args[0] === "compare-drafts") {
  const origPath = args[1];
  const rewritePath = args[2];

  if (origPath === undefined || rewritePath === undefined) {
    usage();
  }

  let ratioParam: { ratio: number } | undefined;
  let asJson = false;
  for (let i = 3; i < args.length; i++) {
    const next = args[i + 1];
    if (args[i] === "--ratio" && next !== undefined) {
      const n = Number(next);
      if (isFinite(n) && n > 0) {
        ratioParam = { ratio: n };
      }
      i++;
    } else if (args[i] === "--json") {
      asJson = true;
    }
  }

  let origText: string;
  try {
    origText = readFileSync(resolve(origPath), "utf-8");
  } catch (e) {
    const readMsg = e instanceof Error ? e.message : String(e);
    process.stderr.write(`Error: cannot read file "${origPath}": ${readMsg}\n`);
    process.exit(2);
  }

  let rewriteText: string;
  try {
    rewriteText = readFileSync(resolve(rewritePath), "utf-8");
  } catch (e) {
    const readMsg = e instanceof Error ? e.message : String(e);
    process.stderr.write(`Error: cannot read file "${rewritePath}": ${readMsg}\n`);
    process.exit(2);
  }

  const findings = kingLengthCut(origText, rewriteText, ratioParam);
  const originalWords = countWords(origText);
  const rewriteWords = countWords(rewriteText);
  const ratio = ratioParam?.ratio ?? 0.9;
  const pass = findings.length === 0;

  if (asJson) {
    const output = {
      command: "compare-drafts",
      original: origPath,
      rewrite: rewritePath,
      originalWords,
      rewriteWords,
      ratio,
      findings,
      pass,
    };
    process.stdout.write(JSON.stringify(output) + "\n");
  } else {
    const cutPct = originalWords > 0 ? Math.round((1 - rewriteWords / originalWords) * 100) : 0;
    const needPct = Math.round((1 - ratio) * 100);
    process.stdout.write(
      `compare-drafts\n\n` +
        `  original  ${origPath}  (${originalWords} words)\n` +
        `  rewrite   ${rewritePath}  (${rewriteWords} words)\n` +
        `  cut ${cutPct}%  (need ≥ ${needPct}%)\n`,
    );
  }
  process.stderr.write(pass ? "PASS (cut sufficient)\n" : "FAIL (cut insufficient)\n");

  process.exit(pass ? 0 : 1);
} else {
  usage();
}
