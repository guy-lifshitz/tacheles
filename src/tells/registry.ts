import { readFileSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { Tell } from "../types.js";
import { EMBEDDED_REGISTRY_PATH } from "../embedded.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface RegistryFile {
  version: number;
  tells: Tell[];
}

let _registry: RegistryFile | null = null;
let _tellMap: Map<string, Tell> | null = null;

function loadRegistry(): RegistryFile {
  // Primary: read from disk next to this module (dev, Node dist/, npm install).
  // Fallback: the embedded copy, for the compiled standalone binary where the
  // on-disk path resolves into Bun's virtual FS and the file isn't there.
  const registryPath = resolve(join(__dirname, "registry.json"));
  let content: string;
  try {
    content = readFileSync(registryPath, "utf-8");
  } catch {
    content = readFileSync(EMBEDDED_REGISTRY_PATH, "utf-8");
  }
  const data = JSON.parse(content) as RegistryFile;

  // Validate the raw JSON before type narrowing is applied.
  // Invariants enforced here:
  //   1. No duplicate tell ids.
  //   2. A tell with a "planned:"-prefixed detector MUST have status "planned", and vice-versa.
  //      This mirrors the Tell discriminated union in types.ts and catches authoring mistakes
  //      (e.g. forgetting to update status after wiring a detector, or vice-versa).
  const seen = new Set<string>();
  for (const tell of data.tells) {
    if (seen.has(tell.id)) {
      throw new Error(`registry.json: duplicate tell id "${tell.id}"`);
    }
    seen.add(tell.id);

    const detectorIsPlanned = tell.detector.startsWith("planned:");
    const statusIsPlanned = tell.status === "planned";
    if (detectorIsPlanned !== statusIsPlanned) {
      throw new Error(
        `registry.json: tell "${tell.id}" has detector="${tell.detector}" but status="${tell.status}": a "planned:" detector prefix and status "planned" must be set together`
      );
    }
  }

  return data;
}

function getRegistry(): RegistryFile {
  if (!_registry) {
    _registry = loadRegistry();
  }
  return _registry;
}

function getTellMap(): Map<string, Tell> {
  if (!_tellMap) {
    const registry = getRegistry();
    _tellMap = new Map(registry.tells.map((t) => [t.id, t]));
  }
  return _tellMap;
}

/** Look up a tell by its stable id. Throws on an unknown id. */
export function getTell(id: string): Tell {
  const tell = getTellMap().get(id);
  if (!tell) {
    throw new Error(`registry: unknown tell id "${id}"`);
  }
  return tell;
}

/**
 * Resolve the detector function name for a tell id.
 *
 * Returns `null` when the tell is not yet runnable (`status` is `"planned"` or `"stub"`);
 * callers should emit a warning and skip the rule.
 *
 * Throws when `method` is `"llm-only"`: these tells must never reach the deterministic
 * linter core. LLM inference belongs exclusively in the separate rewrite subcommand.
 */
export function resolveDetector(id: string): string | null {
  const tell = getTell(id);
  if (tell.method === "llm-only") {
    throw new Error(
      `registry: tell "${id}" is method:"llm-only" and must not reach the linter core`
    );
  }
  if (tell.status !== "active") {
    return null;
  }
  return tell.detector;
}

/** Return default params for a tell (may be undefined). */
export function getTellParams(id: string): Record<string, unknown> | undefined {
  return getTell(id).params;
}

/** Return all tells in the registry. */
export function getAllTells(): Tell[] {
  return getRegistry().tells;
}
