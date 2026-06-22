#!/usr/bin/env bun
// Builds a Node-runnable bundle of the Tacheles CLI into dist/.
//
// The CLI loads runtime data (profiles + the tell registry) from disk at
// startup via paths relative to its own module location (__dirname). The
// bundler does NOT inline these JSON files, so we copy them next to the
// bundle, preserving the layout the code expects:
//
//   dist/cli.js           (bundled entry, target=node)
//   dist/registry.json    (loaded by src/tells/registry.ts via __dirname)
//   dist/profiles/*.json  (loaded by src/cli.ts via join(__dirname,"profiles"))
//
// After bundling, both __dirname lookups resolve to dist/, so the data must
// live there.
import { rmSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "profiles"), { recursive: true });

const result = await Bun.build({
  entrypoints: [join(root, "src", "cli.ts")],
  outdir: dist,
  target: "node",
  naming: "cli.js",
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// The bundle's `embedded.ts` imports JSON with `{ type: "file" }` (for the
// compiled binary). Under target=node that makes the bundler emit hashed asset
// copies into dist/. The Node bundle never reads them; it loads data from disk
// via __dirname, so drop them to keep the tarball clean. We re-supply the
// canonical, unhashed copies below.
for (const f of readdirSync(dist)) {
  if (/-[0-9a-z]{8}\.json$/.test(f)) rmSync(join(dist, f));
}

// Colocate runtime data next to the bundle, at the paths cli.js/registry.ts read.
copyFileSync(join(root, "src", "tells", "registry.json"), join(dist, "registry.json"));
const profilesDir = join(root, "src", "profiles");
for (const f of readdirSync(profilesDir)) {
  if (f.endsWith(".json")) copyFileSync(join(profilesDir, f), join(dist, "profiles", f));
}

console.log("built dist/cli.js + registry.json + profiles/");
