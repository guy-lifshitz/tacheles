import { describe, test, expect } from "bun:test";
import { check } from "../../src/check";
import type { Profile } from "../../src/types";

// Minimal test profile with all detectors enabled via registry tells.
const testProfile: Profile = {
  name: "test-profile",
  rules: [
    { tellId: "s-colon-header", enabled: true, severity: "HIGH" },
    { tellId: "s-list-tricolon", enabled: true, severity: "HIGH" },
    { tellId: "s-both-sides-hedge", enabled: true, severity: "HIGH" },
    { tellId: "r-uniform-polish", enabled: true, severity: "HIGH" },
    { tellId: "s-bold-list-header", enabled: true, severity: "MEDIUM" },
    { tellId: "s-boldface-inline", enabled: true, severity: "MEDIUM" },
    { tellId: "s-transition-stack", enabled: true, severity: "MEDIUM" },
    { tellId: "s-meta-scaffolding", enabled: true, severity: "HIGH" },
    { tellId: "s-ascii-only", enabled: true, severity: "HIGH" },
  ],
};

describe("Rule: colonHeader", () => {
  test("SHOULD flag inline colon-header at line start", () => {
    const text = "setup: this is a test";
    const findings = check(text, testProfile);
    const colonFindings = findings.filter((f) => f.ruleId === "s-colon-header");
    expect(colonFindings.length).toBeGreaterThan(0);
  });

  test("should NOT flag URL with colon", () => {
    const text = "http://example.com is a valid URL";
    const findings = check(text, testProfile);
    const colonFindings = findings.filter((f) => f.ruleId === "s-colon-header");
    expect(colonFindings.length).toBe(0);
  });
});

describe("Rule: tricolon", () => {
  test("SHOULD flag 3+ consecutive colon-header lines with low variance", () => {
    const text =
      "word: description one\nword: description two\nword: description three";
    const findings = check(text, testProfile);
    const tricolonFindings = findings.filter((f) => f.ruleId === "s-list-tricolon");
    expect(tricolonFindings.length).toBeGreaterThan(0);
  });

  test("should NOT flag only 2 colon-header lines", () => {
    const text = "word: description one\nword: description two";
    const findings = check(text, testProfile);
    const tricolonFindings = findings.filter((f) => f.ruleId === "s-list-tricolon");
    expect(tricolonFindings.length).toBe(0);
  });
});

describe("Rule: bothSidesHedge", () => {
  test("SHOULD flag 'both can be' phrase", () => {
    const text = "both can be true depending on context";
    const findings = check(text, testProfile);
    const hedgeFindings = findings.filter((f) => f.ruleId === "s-both-sides-hedge");
    expect(hedgeFindings.length).toBeGreaterThan(0);
  });

  test("should NOT flag one-sided stance", () => {
    const text = "one side is clearly right here";
    const findings = check(text, testProfile);
    const hedgeFindings = findings.filter((f) => f.ruleId === "s-both-sides-hedge");
    expect(hedgeFindings.length).toBe(0);
  });
});

describe("Rule: paraUniformity", () => {
  // Migrated from the old paragraph-maxDev heuristic to the sentence-CV battery.
  // The detector now requires ≥8 sentences (minSentences default) and gates on
  // sentence-length CV < sentCvFloor (0.55) and/or paragraph-length CV < paraCvFloor (0.2).
  // Single-paragraph "word ".repeat(N) blocks tokenize to ONE sentence → always [] under new gate.

  // Inline builder: sentence of `len` words, joined with ". ", trailing ".".
  const mkSent = (len: number) => Array(len).fill("word").join(" ");
  const mkPara = (lens: number[]) => lens.map(mkSent).join(". ") + ".";
  const mkDoc = (paras: number[][]) => paras.map(mkPara).join("\n\n");

  test("SHOULD flag genuinely uniform multi-sentence text (sentence-CV gate)", () => {
    // 10 sentences all 18 words → CV = 0 (well below 0.55), split across 2 paragraphs.
    const text = mkDoc([[18, 18, 18, 18, 18], [18, 18, 18, 18, 18]]);
    const findings = check(text, testProfile);
    const paraFindings = findings.filter((f) => f.ruleId === "r-uniform-polish");
    expect(paraFindings.length).toBeGreaterThan(0);
  });

  test("should NOT flag bursty sentence-length text (sentence-CV well above 0.55)", () => {
    // 9 sentences with lengths [3,21,7,1,34,12,5,28,9] → CV ≈ 0.825 > 0.55 → no flag.
    // Previously tested paragraph-maxDev; now tests sentence-CV discrimination.
    const text = mkPara([3, 21, 7, 1, 34, 12, 5, 28, 9]);
    const findings = check(text, testProfile);
    const paraFindings = findings.filter((f) => f.ruleId === "r-uniform-polish");
    expect(paraFindings.length).toBe(0);
  });
});

describe("Rule: boldListHeader", () => {
  test("SHOULD flag bold inline header in bullet list", () => {
    const text = "- **setup:** description here";
    const findings = check(text, testProfile);
    const boldListFindings = findings.filter((f) => f.ruleId === "s-bold-list-header");
    expect(boldListFindings.length).toBeGreaterThan(0);
  });

  test("should NOT flag plain bullet text", () => {
    const text = "- plain bullet text without bold";
    const findings = check(text, testProfile);
    const boldListFindings = findings.filter((f) => f.ruleId === "s-bold-list-header");
    expect(boldListFindings.length).toBe(0);
  });
});

describe("Rule: boldfaceInline", () => {
  test("SHOULD flag bold text mid-paragraph", () => {
    const text = "text **word** more text here";
    const findings = check(text, testProfile);
    const boldfaceFindings = findings.filter((f) => f.ruleId === "s-boldface-inline");
    expect(boldfaceFindings.length).toBeGreaterThan(0);
  });

  test("should NOT flag bold in markdown headers", () => {
    const text = "## **Header Title** with bold";
    const findings = check(text, testProfile);
    const boldfaceFindings = findings.filter((f) => f.ruleId === "s-boldface-inline");
    expect(boldfaceFindings.length).toBe(0);
  });
});

describe("Rule: transitionStack", () => {
  test("SHOULD flag 2+ transition words in short window", () => {
    const text =
      "furthermore there is a point. moreover we should note this. additionally here is more.";
    const findings = check(text, testProfile);
    const transitionFindings = findings.filter((f) => f.ruleId === "s-transition-stack");
    expect(transitionFindings.length).toBeGreaterThan(0);
  });

  test("should NOT flag single transition word", () => {
    const text =
      "furthermore there is a valid point to consider here without other transitions in sight.";
    const findings = check(text, testProfile);
    const transitionFindings = findings.filter((f) => f.ruleId === "s-transition-stack");
    expect(transitionFindings.length).toBe(0);
  });
});

describe("Rule: metaScaffolding", () => {
  test("SHOULD flag Russian summary label 'коротко:'", () => {
    const text = "коротко: вот суть дела, всё что нужно.";
    const findings = check(text, testProfile);
    const metaFindings = findings.filter((f) => f.ruleId === "s-meta-scaffolding");
    expect(metaFindings.length).toBeGreaterThan(0);
    const metaFirst = metaFindings.at(0);
    if (metaFirst === undefined) return;
    expect(metaFirst.match).toContain("коротко");
  });

  test("SHOULD flag 'TL;DR:' label", () => {
    const text = "TL;DR: this is the summary of the whole thing.";
    const findings = check(text, testProfile);
    const metaFindings = findings.filter((f) => f.ruleId === "s-meta-scaffolding");
    expect(metaFindings.length).toBeGreaterThan(0);
  });

  test("SHOULD flag 'in short:' English summary", () => {
    const text = "in short: here is what you need to know about it.";
    const findings = check(text, testProfile);
    const metaFindings = findings.filter((f) => f.ruleId === "s-meta-scaffolding");
    expect(metaFindings.length).toBeGreaterThan(0);
  });

  test("SHOULD flag 'важно отметить' meta-pointer", () => {
    const text = "далее важно отметить что результаты убедительны.";
    const findings = check(text, testProfile);
    const metaFindings = findings.filter((f) => f.ruleId === "s-meta-scaffolding");
    expect(metaFindings.length).toBeGreaterThan(0);
  });

  test("SHOULD flag 'let me break this down' announcement", () => {
    const text = "ok, let me break this down into manageable pieces for you.";
    const findings = check(text, testProfile);
    const metaFindings = findings.filter((f) => f.ruleId === "s-meta-scaffolding");
    expect(metaFindings.length).toBeGreaterThan(0);
  });

  test("should NOT flag plain content without scaffolding", () => {
    const text = "вот факт один. вот факт два. и ещё один факт для полноты.";
    const findings = check(text, testProfile);
    const metaFindings = findings.filter((f) => f.ruleId === "s-meta-scaffolding");
    expect(metaFindings.length).toBe(0);
  });

  test("should NOT flag 'коротко' inside a sentence (not as label)", () => {
    const text = "он говорил коротко и по делу, без лишней воды.";
    const findings = check(text, testProfile);
    const metaFindings = findings.filter((f) => f.ruleId === "s-meta-scaffolding");
    expect(metaFindings.length).toBe(0);
  });
});

describe("Rule: asciiCyrillicHyphen", () => {
  test("SHOULD flag 'slack-аккаунт' compound", () => {
    const text = "slack-аккаунт деактивирован 18 марта.";
    const findings = check(text, testProfile);
    const hyphenFindings = findings.filter((f) => f.ruleId === "s-ascii-only");
    expect(hyphenFindings.length).toBeGreaterThan(0);
    const hyphenFirst = hyphenFindings.at(0);
    if (hyphenFirst === undefined) return;
    expect(hyphenFirst.match).toBe("slack-аккаунт");
  });

  test("SHOULD flag 'zapier-интеграция'", () => {
    const text = "у нас там стоит zapier-интеграция давно.";
    const findings = check(text, testProfile);
    const hyphenFindings = findings.filter((f) => f.ruleId === "s-ascii-only");
    expect(hyphenFindings.length).toBeGreaterThan(0);
  });

  test("SHOULD flag 'GitLab-воркфлоу' (mixed case ASCII)", () => {
    const text = "настроил GitLab-воркфлоу для деплоя.";
    const findings = check(text, testProfile);
    const hyphenFindings = findings.filter((f) => f.ruleId === "s-ascii-only");
    expect(hyphenFindings.length).toBeGreaterThan(0);
  });

  test("SHOULD flag ascii-ascii hyphenated compound 'admin-scope'", () => {
    const text = "admin-scope огромный, не нравится.";
    const findings = check(text, testProfile);
    const hyphenFindings = findings.filter((f) => f.ruleId === "s-ascii-only");
    expect(hyphenFindings.length).toBeGreaterThan(0);
  });

  test("SHOULD flag 'scope-update'", () => {
    const text = "marketplace прислал scope-update.";
    const findings = check(text, testProfile);
    const hyphenFindings = findings.filter((f) => f.ruleId === "s-ascii-only");
    expect(hyphenFindings.length).toBeGreaterThan(0);
  });

  test("should NOT flag 're-approve' (2-char prefix)", () => {
    const text = "он сделал re-approve на прошлой неделе.";
    const findings = check(text, testProfile);
    const hyphenFindings = findings.filter((f) => f.ruleId === "s-ascii-only");
    expect(hyphenFindings.length).toBe(0);
  });

  test("should NOT flag 'co-founder' (2-char prefix)", () => {
    const text = "мы встретили co-founder проекта.";
    const findings = check(text, testProfile);
    const hyphenFindings = findings.filter((f) => f.ruleId === "s-ascii-only");
    expect(hyphenFindings.length).toBe(0);
  });

  test("should NOT flag short Cyrillic suffix 'scope-ы'", () => {
    const text = "проверил scope-ы, всё норм.";
    const findings = check(text, testProfile);
    const hyphenFindings = findings.filter((f) => f.ruleId === "s-ascii-only");
    expect(hyphenFindings.length).toBe(0);
  });

  test("should NOT flag pure Cyrillic compound 'аппка-сирота'", () => {
    const text = "это аппка-сирота, владельца нет.";
    const findings = check(text, testProfile);
    const hyphenFindings = findings.filter((f) => f.ruleId === "s-ascii-only");
    expect(hyphenFindings.length).toBe(0);
  });
});
