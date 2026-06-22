# Contributing to Tacheles

Thanks for helping cut the slop. This guide covers the one thing you most need to know before you start. **Most contributions are data, not code.**

## The two lanes

Tacheles separates *what* it flags from *how* it flags it.

- **Data lane (no build).** The tell-set lives in [`src/tells/registry.json`](src/tells/registry.json) and the profiles in [`src/profiles/`](src/profiles/). Adding a word-list or regex tell, tuning a threshold, or wiring a tell into a profile is **pure JSON**: no compilation, no new detector code. This is the lane for most new tells, new vocabulary, new languages, and per-author calibration.
- **Code lane (needs a build).** A *new kind of detector*, a new matching mechanism that the existing primitives can't express, is TypeScript in [`src/detectors/`](src/detectors/), wired into `src/check.ts`. You only need this when `wordlist`, `regexList`, `densityStat`, and the rhythm/King detectors genuinely can't catch the pattern as data.

When you open a PR, say which lane it's in. If you touched a `.ts` file, it's the code lane and needs tests.

## How tells work

Every tell is one object in the `tells` array of `registry.json`. The linter resolves a tell's `detector` (and `method`) from here; a profile only references the tell by `id` and picks its severity. The core is **regex + statistics only**. There is no model at runtime. A tell with `method: "llm-only"` is never run by `tacheles check`; those belong to the rewrite procedures, not the linter.

Key fields:

| Field | Meaning |
|---|---|
| `id` | Stable identifier, kebab-case, prefixed by family (`s-`, `r-`, `k-`, `ru-`, `he-`). Never reuse or rename. |
| `category` | `surface` / `rhythm` / `king` / `ru` / `he`. |
| `method` | `regex` or `stat` (run in the core). `llm-only` is parked for the rewrite layer. |
| `detector` | The implementation that runs it, e.g. `wordlist`, `regexList`, `densityStat`. |
| `status` | `active` (wired), `stub`, or `planned`. |
| `defaultSeverity` | `HIGH` / `MEDIUM` / `LOW`. A profile can override this. |
| `summary` / `bad` / `fix` | Human-readable explanation, an example that trips it, and the suggested cut. Keep these tight and example-driven. |
| `params` | Detector-specific configuration (the word list, the regexes, the thresholds). |

### Severity rule of thumb

**HIGH fails the gate (exit 1). MEDIUM and LOW are reported but never fail it.** Reserve HIGH for tells with very few false positives. A noisy or register-dependent tell should ship MEDIUM, and a profile can promote it to HIGH where it's earned. When in doubt, ship MEDIUM.

## Add a word-list tell (data lane)

Use the `wordlist` detector for a flat list of phrases. Add an object to the `tells` array:

```json
{
  "id": "s-my-filler",
  "title": "My filler phrases",
  "category": "surface",
  "method": "regex",
  "detector": "wordlist",
  "status": "active",
  "defaultSeverity": "MEDIUM",
  "summary": "What this flags and why it's slop.",
  "bad": "A sentence that trips it.",
  "fix": "What to write instead.",
  "source": "where the pattern is documented",
  "params": { "label": "my filler", "list": ["phrase one", "phrase two"] }
}
```

Word boundaries in `wordlist` are ASCII (`[A-Za-z0-9]`). For Cyrillic, Hebrew, or any non-Latin script, **use `regexList` instead** and bake the script-appropriate boundaries into the pattern. An ASCII boundary will over-match non-Latin substrings.

## Add a regex tell (data lane)

Use `regexList` for structural patterns and non-Latin scripts:

```json
{
  "id": "s-my-structure",
  "title": "My structural tell",
  "category": "surface",
  "method": "regex",
  "detector": "regexList",
  "status": "active",
  "defaultSeverity": "MEDIUM",
  "summary": "...",
  "bad": "...",
  "fix": "...",
  "source": "...",
  "params": { "patterns": [
    { "re": "\\bthere (is|are)\\b[^.!?\\n]{1,50}?\\bthat\\b", "flags": "gi", "message": "Expletive opener padding" }
  ] }
}
```

The `g` flag is auto-ensured; an invalid regex is skipped (not fatal). Constrain quantifiers (`{1,50}`, `[^.!?\n]`) so a pattern can't run across sentence or paragraph boundaries.

## Wire a tell into a profile

A tell does nothing until a profile enables it. Each profile in `src/profiles/` lists rules:

```json
{ "tellId": "s-my-filler", "enabled": true, "severity": "MEDIUM" }
```

Add the line to the profiles where it belongs, and keep sibling profiles consistent. If a formal/technical profile should treat the tell more loosely, set it `"LOW"` or `"enabled": false` there. A profile may also pass `params` to override the registry defaults (the engine merges registry `params` with the rule's `params`).

## Add a new detector (code lane)

Only when a pattern can't be expressed as data:

1. Add `src/detectors/myDetector.ts` taking `(text, params)` and returning findings.
2. Register it in the `DETECTORS` map in `src/check.ts`.
3. Add a registry tell with `"detector": "myDetector"` and the right `method`.
4. Add unit tests in `tests/unit/`: at least one positive (fires) and one negative (clean text stays clean).

Keep detectors deterministic and parameter-driven. Prefer a generic detector that reads its behavior from `params` over a hard-coded one, so future tells can reuse it as data.

## Languages

Tacheles ships EN + RU as full, gated languages, each with a rewrite procedure; HE is an experimental seed lexicon. To extend a language, add tells (regex with script-correct boundaries) and wire them into that language's profile. A new language ideally also brings a rewrite procedure in `docs/reference/` and a profile.

## Before you open a PR

```bash
bun test            # all tests green
bunx tsc --noEmit   # type-check clean
tacheles check <a-fixture.md>   # sanity-check the CLI still runs
```

- Data-lane PRs: confirm `registry.json` is valid JSON and the suite stays green (add a small regression test showing your tell fires on slop and stays silent on clean prose).
- Code-lane PRs: include the positive + negative unit tests described above.
- Keep `summary` / `bad` / `fix` concrete and short. A tell that can't show a one-line bad example and a one-line fix probably isn't a deterministic tell yet.

Tacheles detects *patterns*, not authorship. Contributions that push it toward guessing who wrote something, rather than pointing at a specific span and telling the writer what to cut, are out of scope.
