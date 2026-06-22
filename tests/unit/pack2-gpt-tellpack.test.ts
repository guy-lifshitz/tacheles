import { readFileSync } from "fs";
import { describe, test, expect } from "bun:test";
import { check } from "../../src/check";
import { getAllTells, resolveDetector } from "../../src/tells/registry";
import type { Profile } from "../../src/types";

// D1CF5FDF collect-safety: load profiles from disk inside the test body, never
// as a top-level static import.
function loadProfile(name: string): Profile {
  const url = new URL(`../../src/profiles/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf-8")) as Profile;
}

function profileWith(tellId: string): Profile {
  return {
    name: "test-profile",
    rules: [{ tellId, enabled: true, severity: "MEDIUM" }],
  };
}

const GPT_TELLS = [
  "s-gpt-vocab",
  "s-gpt-filler",
  "s-whether-opener",
  "s-gpt-scaffolding",
  "s-gpt-future-close",
];

// Clean-room note: this suite asserts zero-false-positives on representative
// clean prose held INLINE rather than reading an external corpus — keeps the
// core free of external-repo path dependencies. The "approved human prose
// flags none" guarantee is validated separately.

// ============================================================
// AC1 — each GPT tell fires on its own slop fixture
// ============================================================
describe("AC1: each Pack-2 GPT tell flags its slop fixture", () => {
  test("s-gpt-vocab flags cutting-edge/game-changing/supercharge", () => {
    const text = "Our cutting-edge, game-changing platform will supercharge your team.";
    const f = check(text, profileWith("s-gpt-vocab")).filter((x) => x.ruleId === "s-gpt-vocab");
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  test("s-gpt-filler flags 'moving forward' / 'in terms of'", () => {
    const text = "Moving forward, in terms of value, the bottom line is we ship.";
    const f = check(text, profileWith("s-gpt-filler")).filter((x) => x.ruleId === "s-gpt-filler");
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  test("s-whether-opener flags 'Whether you're X or Y'", () => {
    const text = "Whether you're a scrappy startup or a large enterprise, this matters.";
    const f = check(text, profileWith("s-whether-opener")).filter(
      (x) => x.ruleId === "s-whether-opener"
    );
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  test("s-gpt-scaffolding flags landscape opener and 'let's dive'", () => {
    const text = "In today's digital landscape, security is hard. Let's dive into the details.";
    const f = check(text, profileWith("s-gpt-scaffolding")).filter(
      (x) => x.ruleId === "s-gpt-scaffolding"
    );
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  test("s-gpt-future-close flags 'only time will tell' / future-of", () => {
    const text = "As we look ahead, the future of work is bright. Only time will tell.";
    const f = check(text, profileWith("s-gpt-future-close")).filter(
      (x) => x.ruleId === "s-gpt-future-close"
    );
    expect(f.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// AC2 — combined slop trips ALL FIVE tells at once
// ============================================================
describe("AC2: a full GPT-slop paragraph fires all 5 tells", () => {
  test("every Pack-2 tellId appears at least once", () => {
    const slop =
      "Whether you're a startup or an enterprise, in today's digital landscape this is a " +
      "game-changing, cutting-edge platform. Let's dive in. Moving forward, in terms of impact, " +
      "the bottom line is it will supercharge your team. As we look ahead, the future of work is bright.";
    const allProfile: Profile = {
      name: "all-gpt",
      rules: GPT_TELLS.map((tellId) => ({ tellId, enabled: true, severity: "MEDIUM" as const })),
    };
    const fired = new Set(
      check(slop, allProfile)
        .map((f) => f.ruleId)
        .filter((id) => GPT_TELLS.includes(id))
    );
    for (const id of GPT_TELLS) {
      expect(fired.has(id)).toBe(true);
    }
  });
});

// ============================================================
// AC3 — zero false positives on clean, concrete prose
// ============================================================
describe("AC3: Pack-2 tells produce 0 findings on clean prose", () => {
  test("plain practitioner prose trips none of the 5 GPT tells", () => {
    const clean =
      "The scan ran across the fleet and the control passed. I graded the evidence by hand. " +
      "A SOC 2 report outranks a policy PDF because an outside auditor signed it. You sign too.";
    const allProfile: Profile = {
      name: "all-gpt",
      rules: GPT_TELLS.map((tellId) => ({ tellId, enabled: true, severity: "MEDIUM" as const })),
    };
    const fired = check(clean, allProfile).filter((f) => GPT_TELLS.includes(f.ruleId));
    expect(fired.length).toBe(0);
  });
});

// ============================================================
// AC4 — registry: all 5 tells active with the correct detectors
// ============================================================
describe("AC4: registry entries for the 5 Pack-2 GPT tells", () => {
  const wordlistTells = ["s-gpt-vocab", "s-gpt-filler"];
  const regexTells = ["s-whether-opener", "s-gpt-scaffolding", "s-gpt-future-close"];

  for (const id of wordlistTells) {
    test(`${id} is active, detector=wordlist`, () => {
      const tell = getAllTells().find((t) => t.id === id);
      expect(tell).toBeDefined();
      expect(tell!.status).toBe("active");
      expect(resolveDetector(id)).toBe("wordlist");
    });
  }

  for (const id of regexTells) {
    test(`${id} is active, detector=regexList`, () => {
      const tell = getAllTells().find((t) => t.id === id);
      expect(tell).toBeDefined();
      expect(tell!.status).toBe("active");
      expect(resolveDetector(id)).toBe("regexList");
    });
  }
});

// ============================================================
// AC5 — profile wiring: substack/linkedin enable all 5; formal split
// ============================================================
describe("AC5: profile wiring for the Pack-2 tells", () => {
  for (const profileName of ["essay-en"]) {
    test(`${profileName} enables all 5 GPT tells`, () => {
      const profile = loadProfile(profileName);
      for (const id of GPT_TELLS) {
        const rule = profile.rules.find((r) => r.tellId === id);
        expect(rule).toBeDefined();
        expect(rule!.enabled).toBe(true);
      }
    });
  }

  for (const profileName of ["technical-en", "consulting-en-formal"]) {
    test(`${profileName} disables vocab/filler/scaffolding, keeps whether/future`, () => {
      const profile = loadProfile(profileName);
      for (const id of ["s-gpt-vocab", "s-gpt-filler", "s-gpt-scaffolding"]) {
        const rule = profile.rules.find((r) => r.tellId === id);
        expect(rule).toBeDefined();
        expect(rule!.enabled).toBe(false);
      }
      for (const id of ["s-whether-opener", "s-gpt-future-close"]) {
        const rule = profile.rules.find((r) => r.tellId === id);
        expect(rule).toBeDefined();
        expect(rule!.enabled).toBe(true);
      }
    });
  }
});
