import { describe, test, expect } from "bun:test";
import { measure } from "../../src/measure.js";

// Deterministic stylometry fixtures. Word counts and CV are computed via the
// linter's own segmentation/population-CV helpers, so these assertions also
// guard that measure stays aligned with the gates.

describe("measure() stylometry", () => {
  // Single-paragraph corpus with two em-dashes and known sentence structure.
  // Sentences (word counts): 6, 4, 5, 2, 9, 2, 11 -> 7 sentences, 49 words.
  const corpus =
    "The cat sat on the mat. It was warm — very warm. Birds sang loudly all morning long today. He stopped — abruptly. We walked the long winding path home before dark fell quietly. Rain came. Everyone went inside and waited for the heavy storm to finally pass over.";

  const r = measure(corpus, "fixture.txt");

  test("counts words, sentences, paragraphs", () => {
    expect(r.words).toBe(49);
    expect(r.sentences).toBe(7);
    expect(r.paragraphs).toBe(1);
  });

  test("sentence mean and CV", () => {
    expect(r.sentenceLength.mean).toBe(7);
    expect(r.sentenceLength.cv).toBe(0.51);
  });

  test("em-dash per thousand words", () => {
    // 2 em-dashes / 49 words * 1000 = 40.8
    expect(r.emDashPerThousand).toBe(40.8);
  });

  test("suggestedProfile is deterministic and derived from measured numbers", () => {
    // perThousand = Math.max(1, Math.ceil(40.816...)) = 41
    expect(r.suggestedProfile["s-em-dash-density"].perThousand).toBe(41);
    // sentCvFloor = round2(0.8 * 0.512...) = 0.41
    expect(r.suggestedProfile["r-uniform-polish"].sentCvFloor).toBe(0.41);
    // single paragraph -> paraCV 0 -> floor 0
    expect(r.suggestedProfile["r-uniform-polish"].paraCvFloor).toBe(0);
  });

  test("file path is echoed back", () => {
    expect(r.file).toBe("fixture.txt");
  });

  test("multi-paragraph corpus computes a nonzero paragraph CV", () => {
    const multi = [
      "The cat sat on the mat.",
      "It was a warm and sunny afternoon by the river.",
      "Birds sang.",
      "We walked along the path for a long while without saying anything at all.",
      "He stopped.",
      "She smiled at the thought of going home before dark.",
      "The dog barked twice and then ran off into the field chasing a rabbit.",
      "Rain came.",
      "Everyone went inside and waited for the storm to pass quietly.",
    ].join("\n\n");
    const m = measure(multi, "multi.txt");
    expect(m.paragraphs).toBe(9);
    expect(m.paragraphLength.cv).toBe(0.6);
    expect(m.suggestedProfile["r-uniform-polish"].paraCvFloor).toBe(0.48);
    // no em-dashes in this corpus
    expect(m.emDashPerThousand).toBe(0);
    expect(m.suggestedProfile["s-em-dash-density"].perThousand).toBe(1);
  });

  test("ignores YAML frontmatter like the linter", () => {
    const withFm = `---\nvoice-profile: essay-en\ntitle: x\n---\n${corpus}`;
    const m = measure(withFm, "fm.txt");
    expect(m.words).toBe(r.words);
    expect(m.sentences).toBe(r.sentences);
    expect(m.emDashPerThousand).toBe(r.emDashPerThousand);
  });
});
