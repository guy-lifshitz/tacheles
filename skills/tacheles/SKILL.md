---
name: tacheles
description: Rewrite a draft so it reads like a human wrote it, and (if you have calibrated a profile) like you, then gate it with the tacheles linter. USE WHEN de-AI a draft, strip AI tells/slop, make this sound human or sound like me, voice rewrite, polish a post/article/essay before publishing, reads like ChatGPT or Claude.
---

# Tacheles rewrite skill

Tacheles has two layers. The `tacheles` linter finds the slop deterministically (offline, regex and statistics, no model). This skill is the rewrite layer that fixes what the linter flags, then re-gates. The judgment of which sentence to cut and which word is yours stays with the writer or a strong model. The linter never rewrites; it only enforces.

There is no register this is "for." The examples below happen to use one (security writing), but that is just the example the project shipped. Calibrate it to any field, any voice.

## Workflow

1. **Detect.** Run `tacheles check <file> [--profile <id>]`. It lists every tell with a line number and a reason, and sets the exit code (0 clean, 1 on a HIGH finding).
2. **Rewrite with the tradition for the language.** Open the procedure and run its passes in order. Each pass maps to a tell, so you fix the exact thing the linter flagged.
   - **English:** Stephen King's *On Writing* as ordered revision passes. See `docs/reference/king-rewrite-procedure.md`.
   - **Russian:** Ильяхов «Пиши, сокращай» plus Нора Галь, a different craft (not King). See `docs/reference/ru-rewrite-procedure.md`.
   Preserve the substance: facts, structure, numbers, argument. Change how it sounds, not what it says. Delegate the actual rewrite to a strong model; do not let the orchestrator hand-write prose if a capable model is available.
3. **Re-check, then trust the ear.** Run `check` again until it returns 0 HIGH, then read the piece aloud. If every paragraph still lands a crafted punchline, it reads like a model: flatten half of them. The score is the floor; the ear is the gate.

## Make it sound like you (optional)

Generic-human is the default profile (`essay-en` / `essay-ru`). To sound like a specific person, calibrate a profile along two axes:

- **The numbers.** Measure a corpus of your own clean writing (sentence length and its variation, paragraph variation, em-dash rate, domain terms you use legitimately) and write those into a profile (`perThousand`, `sentCvFloor`, `paraCvFloor`, `params.exclude`). See `docs/reference/calibration-guide.md`.
- **The voice.** Build a voice anchor: the writers you blend, the moves you reach for, the habits you refuse. The shipped `src/anchor/voice-anchor.md` is one worked example for a single register; it is the template, not a constraint. See `docs/reference/voice-anchor-guide.md`.

## Building an anchor (this is where the skill earns its keep)

Synthesizing an anchor is judgment, not a regex, so it is exactly the kind of work this skill does and the linter cannot. When asked to build one:

1. Interview the writer: who do you admire, and in what register do you want to sound like yourself?
2. For each named writer, pull two or three short real sample quotes that show the exact move worth stealing.
3. Group the writers into layers (discipline, directness, substance, vividness) and synthesize one blended target.
4. Draft the two lists: "write like this" (concrete moves with examples) and "what this voice never does."
5. Propose the registry tell-id bindings so `tacheles check` can enforce what the anchor teaches.

Output a `voice-anchor.md` the writer edits, following `docs/reference/voice-anchor-guide.md`. Keep the de-LLM checklist from the example anchor almost verbatim: it is register-independent. Only the writer blend is personal.

## Tells to kill (short list; the full set lives in the registry and the anchor)

Balanced antithesis ("it's not X, it's Y", once per piece at most), manufactured mic-drop closers, reflexive tricolon, abstract significance wraps, em-dash overuse, rhetorical-question-then-one-word-answer, motivational-poster positivity, -ly adverbs the verb already carries, passive voice that hides the actor, abstract-preamble openers.

## Notes

- Tacheles detects patterns, not authorship. Treat per-model fingerprinting as a sharp heuristic, not proof.
- There is no auto-fix. This skill (an LLM) does the rewrite; `tacheles check` is the deterministic gate.
