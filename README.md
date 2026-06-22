# Tacheles

**Make AI-assisted writing sound like you wrote it, not a model.** Tacheles flags the exact AI tells in your text and shows you how to cut them.

The slop is two things. **Bloat:** an LLM writes one token at a time, each the most probable next word, built to sound fluent and average, not short. So it pads, more words than the idea needs. **Style:** it writes in a register that reads as a machine, the em-dashes, the "it's not X, it's Y", the same fifty words. Tacheles flags both, at the exact line, with the reason, and it runs on your machine: no AI, no API key, nothing uploaded, the same result every time.

It does not rewrite for you. It shows you what to cut.

> **Tacheles** (תכל׳ס, *tachles*): the bottom line, the point.
> From Yiddish. The German *Tacheles reden* means to talk straight, no fluff.

## Why use it

What it gives you that the alternatives do not:

- **A cut list, not a score.** AI detectors send your text to a server and hand back "87% AI". You cannot act on a number. Tacheles names the exact span, on the exact line, with the reason, the way a code linter does. You fix it and move on.
- **The fix, not just the flag.** Every check maps to a rule from a working editor: Stephen King for English, Ильяхов and Нора Галь for Russian. The flag says what is wrong; the rule says how to fix it.
- **Multilingual.** Ships with two full language packs (English and Russian) and one experimental (Hebrew); German and Spanish are in the next release. Adding a pack is data, not code, so it supports any language, not just English.
- **Tuned to you.** Calibrate it to your own writing and it flags drift from *your* voice, not from a generic rule.
- **Private, free, repeatable.** No model, no API key, nothing leaves your machine. Same text, same findings, every time.

Most open-source options are one of two things: a black-box "% AI" score, or an English word-list. This is the cut list: multilingual, and tuned to you.

## Install

```bash
npx tacheles check draft.md      # run once, no install
npm install -g tacheles          # or install it
```

Or clone the repo and run it with [Bun](https://bun.sh): `bun run bin/tacheles check draft.md`.

## Use

```bash
tacheles check draft.md
```

```
$ tacheles check draft.md
  s-banned-vocab     HIGH    delve, robust, tapestry
  r-reframe-opener   HIGH    "It's not about X, it's about Y"
  s-meta-scaffolding HIGH    "It's important to note"
  s-em-dash-density  MEDIUM  14 em-dashes / 1000 words
FAIL (3 HIGH findings)
```

Exit code is `0` when clean and `1` when there is a HIGH finding, so you can gate it in CI or a commit hook. HIGH fails; MEDIUM and LOW are reported but do not fail.

There is also `tacheles compare-drafts <old> <new>`, which checks that a rewrite cut at least 10% (King's rule).

## How it works

Three pieces:

- **Tells** (the detectors) are the individual checks. Each one is a named pattern, a regex or a statistic, that flags one kind of slop. `s-banned-vocab` flags AI words like "delve"; `r-uniform-polish` flags suspiciously even sentence rhythm. There are 44, grouped by type (surface, rhythm, concision) and by language (each language adds its own pack). All of them are data in [`src/tells/registry.json`](src/tells/registry.json): an id, how it matches, its message, and a default severity. No tell is hard-coded in the engine.
- **Severity** is HIGH, MEDIUM, or LOW per finding. HIGH fails the run (exit 1); MEDIUM and LOW are reported but never fail. That is the strictness knob.
- **Profiles** decide which tells run, and at what severity, for a kind of writing. A profile is a JSON file: a list of tell ids with `enabled` and `severity`, plus optional per-tell `params` (thresholds, word-lists, exclusions).

A run reads the file (ignoring code blocks and frontmatter), executes each tell the profile enables, and prints the findings with line numbers and severities. Same input, same output, every time.

## What it catches

The checks come in three types:

| Type | Examples |
|---|---|
| **Surface** | em-dashes, AI vocab (delve, robust, tapestry), bold lists, "it's important to note", chatbot scaffolding ("let's dive in", "whether you're a...") |
| **Rhythm** | "it's not X, it's Y" openers, bold one-liner aphorisms, every paragraph ending on a punchline, suspiciously even sentence length |
| **Concision** | adverbs, passive voice, fancy words, clichés (Stephen King's rules) |

Two targets: bad words, and bloat (padding that adds length, not meaning). Each language ships its own pack of these (see [Languages](#languages)), and some tells are model-specific (see [Model packs](#model-packs)).

## Model packs

It has separate checks for how different models write, so it catches the slop whatever you drafted with.

- **Claude** leans on rhythm: "it's not X, it's Y" openers, bold one-liner aphorisms, em-dashes.
- **GPT** leans on vocabulary and scaffolding: "delve" / "robust", "let's dive in", "whether you're a...", and almost no em-dashes.

The same idea from each trips different checks:

```
$ tacheles check claude-draft.md
  r-reframe-opener   HIGH    It's not about the framework you choose, it's...
  r-bold-aphorism    HIGH    Good architecture isn't built. It's earned.
  s-em-dash-density  MEDIUM  14.5 em-dashes / 1000 words
FAIL (2 HIGH findings)

$ tacheles check gpt-draft.md
  s-banned-vocab     HIGH    tapestry, robust, landscape
  s-meta-scaffolding HIGH    It's important to note
  s-whether-opener   MEDIUM  Whether you're a seasoned engineer or...
FAIL (2 HIGH findings)
```

This is a heuristic, not proof.

## Profiles

Four ship:

- `essay-en`: generic English, strict. The default.
- `essay-ru`: generic Russian (the Ильяхов / Нора Галь checks).
- `consulting-en-formal`: formal documents; the rhythm and formatting checks are relaxed.
- `technical-en`: technical writing; looser still.

Choose one with `--profile <id-or-path>`, or pin it per file with `voice-profile: <id>` in the frontmatter. With nothing set it uses `essay-en`. Order: the `--profile` flag wins, then the file's `voice-profile:`, then the default.

## Use it with an LLM

You write with a model, the model leaves slop, Tacheles catches it:

1. The model drafts.
2. `tacheles check draft.md` lists what is wrong and where.
3. The model rewrites to fix it. Give it the findings; for how to fix each one, point it at the rewrite guide for the language (`docs/reference/king-rewrite-procedure.md` for English, `ru-rewrite-procedure.md` for Russian).
4. Re-check until clean.

The skill in [`skills/tacheles/`](skills/tacheles/SKILL.md) runs this whole loop for you. It is a plain `SKILL.md`, so it works in Claude Code, Claude.ai, the Agent SDK, or any model you hand it to.

## Make it sound like you

Out of the box it flags generic AI slop. You can tune it to your own voice, two ways:

- **Your numbers.** Run `tacheles measure <your-corpus>` on a body of your own clean writing. It reports your em-dash rate and sentence/paragraph rhythm and prints a `suggestedProfile` block to drop into a copy of `essay-en`. See [`docs/reference/calibration-guide.md`](docs/reference/calibration-guide.md).
- **Your style.** Build a "voice anchor": the writers you want to sound like and the habits you refuse. See [`docs/reference/voice-anchor-guide.md`](docs/reference/voice-anchor-guide.md). The skill builds one with you.

A tuned profile is a fingerprint of how you write, so keep yours private. The profiles in this repo are generic on purpose.

## Extend it

The tells and profiles are JSON, not code, so you change what it does without touching the engine.

- **Add a check.** Put a word-list or regex tell in [`src/tells/registry.json`](src/tells/registry.json): an id, the pattern, a message, a severity. No rebuild.
- **Make a profile.** Copy one of the four, then turn tells on or off and set their severities for your kind of writing.
- **Add a house style or a language.** Same mechanism: tells as data, plus a rewrite tradition per language.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Languages

Multilingual by design. Each language is its own pack: a set of tells plus a rewrite tradition.

- **English** and **Russian** ship today, both full. The traditions differ: Stephen King for English; for Russian, Ильяхов and Нора Галь (канцелярит, штампы, вода), a different craft, not a translation of King.
- **German** and **Spanish** are in the next release.
- **Hebrew** is an experimental seed (one pack).

Adding a language is data, not code: a pack of tells plus its tradition. Add your own, or contribute one back. It supports any language.

## Roadmap

- `/tacheles` command and a hook that stops an agent from finishing on slop
- MCP server (Cursor, Windsurf, any host)
- CI / pre-commit / GitHub Action
- more languages and more profiles

## License

MIT.
