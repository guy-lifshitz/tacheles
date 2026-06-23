import { readFileSync, writeFileSync, rmSync } from "fs";
import { resolve } from "path";
import { tmpdir } from "os";
import { describe, test, expect, afterAll } from "bun:test";
import { check } from "../../src/check";
import type { Profile } from "../../src/types";

// essay-en is the generic, author-neutral public default profile.
function loadEssayEn(): Profile {
  const path = resolve(import.meta.dir, "../../src/profiles/essay-en.json");
  return JSON.parse(readFileSync(path, "utf-8")) as Profile;
}

const TACHELES_BIN = resolve(import.meta.dir, "../../bin/tacheles");

async function spawn(args: string[]): Promise<{ exitCode: number; stdout: string }> {
  const proc = Bun.spawn(["bun", TACHELES_BIN, ...args], { stdout: "pipe", stderr: "pipe" });
  const stdout = await new Response(proc.stdout).text();
  await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { exitCode, stdout };
}

describe("essay-en default profile", () => {
  test("(a) resolves as the CLI default with no --profile flag", async () => {
    const tmp = resolve(tmpdir(), "tacheles-essay-default-probe.md");
    // Plain, clean prose so the run produces output we can inspect for the resolved profile name.
    writeFileSync(tmp, "we shipped the new index last week and the query path got faster.\n");
    try {
      const { stdout } = await spawn(["check", tmp, "--json"]);
      const json: any = JSON.parse(stdout);
      expect(json.profile).toBe("essay-en");
    } finally {
      rmSync(tmp, { force: true });
    }
  });

  test("(b) synthetic slop yields >=1 HIGH", () => {
    const profile = loadEssayEn();
    // colon-header + both-sides hedge + "not X, it's Y" reframe — all HIGH tells under essay-en.
    const slop = [
      "setup: here is the situation we found ourselves in.",
      "",
      "both can be true depending on how you frame the tradeoff. it's not a speed problem, it's a clarity problem.",
    ].join("\n");
    const high = check(slop, profile).filter((f) => f.severity === "HIGH");
    expect(high.length).toBeGreaterThanOrEqual(1);
  });

  test("(c) clean prose yields 0 HIGH", () => {
    const profile = loadEssayEn();
    const clean = "we swapped the index last week and the slow query got fast. nobody noticed the deploy, which is the way i like it.";
    const high = check(clean, profile).filter((f) => f.severity === "HIGH");
    expect(high.length).toBe(0);
  });
});
