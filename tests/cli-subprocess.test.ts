import { describe, test, expect, afterAll } from "bun:test";
import { resolve, join } from "path";
import { tmpdir } from "node:os";
import { writeFileSync, rmSync } from "node:fs";

const TACHELES_BIN = resolve(import.meta.dir, "../bin/tacheles");
const FIXTURES = resolve(import.meta.dir, "fixtures");
const NEGATIVE = resolve(FIXTURES, "negative-slop.md");
const POSITIVE = resolve(FIXTURES, "positive-clean.md");

async function spawn(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bun", TACHELES_BIN, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { exitCode, stdout, stderr };
}

// H2: CLI exit code contract (spec section 3)

describe("CLI exit-code contract", () => {
  test("negative seed: exit 1, pass=false, highCount>=3", async () => {
    const { exitCode, stdout } = await spawn(["check", NEGATIVE, "--json"]);
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout);
    expect(json.pass).toBe(false);
    expect(json.highCount).toBeGreaterThanOrEqual(3);
  });

  test("positive seed: exit 0, pass=true, highCount===0", async () => {
    const { exitCode, stdout } = await spawn(["check", POSITIVE, "--json"]);
    expect(exitCode).toBe(0);
    const json = JSON.parse(stdout);
    expect(json.pass).toBe(true);
    expect(json.highCount).toBe(0);
  });

  test("default output is human-readable (not JSON), exit code unchanged", async () => {
    const { exitCode, stdout, stderr } = await spawn(["check", NEGATIVE]);
    expect(exitCode).toBe(1);
    expect(() => JSON.parse(stdout)).toThrow();
    expect(stdout).toContain("profile:");
    expect(stderr).toContain("FAIL");
  });

  test("nonexistent file: exit 2, stderr contains 'cannot read file'", async () => {
    const { exitCode, stderr } = await spawn(["check", "/nonexistent/path/to/file.md"]);
    expect(exitCode).toBe(2);
    expect(stderr).toContain("cannot read file");
  });

  test("bad profile path: exit 2, stderr contains 'cannot load profile'", async () => {
    const { exitCode, stderr } = await spawn(["check", POSITIVE, "--profile", "/bad/path/profile.json"]);
    expect(exitCode).toBe(2);
    expect(stderr).toContain("cannot load profile");
  });

  test("no args / wrong subcommand: exit 2, stderr contains 'Usage:'", async () => {
    const { exitCode, stderr } = await spawn([]);
    expect(exitCode).toBe(2);
    expect(stderr).toContain("Usage:");
  });
});

describe("measure subcommand", () => {
  const corpusPath = join(tmpdir(), `tacheles-measure-${process.pid}.txt`);
  const corpus =
    "The cat sat on the mat. It was warm — very warm. Birds sang loudly all morning long today. He stopped — abruptly. We walked the long winding path home before dark fell quietly. Rain came. Everyone went inside and waited for the heavy storm to finally pass over.";

  writeFileSync(corpusPath, corpus);

  afterAll(() => {
    rmSync(corpusPath, { force: true });
  });

  test("exit 0 and well-formed JSON shape on a temp corpus", async () => {
    const { exitCode, stdout, stderr } = await spawn(["measure", corpusPath, "--json"]);
    expect(exitCode).toBe(0);
    const json = JSON.parse(stdout);
    expect(json.file).toBe(corpusPath);
    expect(json.words).toBe(49);
    expect(json.sentences).toBe(7);
    expect(typeof json.sentenceLength.mean).toBe("number");
    expect(typeof json.sentenceLength.cv).toBe("number");
    expect(typeof json.paragraphLength.cv).toBe("number");
    expect(typeof json.emDashPerThousand).toBe("number");
    expect(json.suggestedProfile["s-em-dash-density"].perThousand).toBe(41);
    expect(typeof json.suggestedProfile["r-uniform-polish"].sentCvFloor).toBe("number");
    expect(typeof json.suggestedProfile["r-uniform-polish"].paraCvFloor).toBe("number");
    // human summary goes to stderr
    expect(stderr).toContain("measured:");
    expect(stderr).toContain("starting point");
  });

  test("missing file: exit 2, stderr contains 'cannot read file'", async () => {
    const { exitCode, stderr } = await spawn(["measure", "/nonexistent/corpus.txt"]);
    expect(exitCode).toBe(2);
    expect(stderr).toContain("cannot read file");
  });

  test("default output is human-readable (not JSON) when --json is omitted", async () => {
    // Without --json the measure subcommand must emit a human-readable block to
    // stdout, not a JSON object. JSON.parse must throw, and the output must
    // contain a distinctive readable label.
    const { exitCode, stdout } = await spawn(["measure", corpusPath]);
    expect(exitCode).toBe(0);
    expect(() => JSON.parse(stdout)).toThrow();
    expect(stdout).toContain("em-dash/1k");
  });
});
