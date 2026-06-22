# Tell registry + profile schema

This directory holds the **single source of truth** for the tell-set: [`registry.json`](./registry.json).
Profiles in [`../profiles/`](../profiles/) reference tells by stable `id`; the linter resolves each tell's
`detector` + `method` from the registry. The anchor in [`../anchor/voice-anchor.md`](../anchor/voice-anchor.md) is
the rewrite/positive layer and cites the same ids so detect and rewrite never drift.

The linter core is **regex + statistics only: no model, no network at runtime.** A tell with `method: "llm-only"`
is never run by `tacheles check`; those calls are parked in `notes.semanticCompanions` and belong to the rewrite
procedures, not the core.

For the practical "how do I add one" walkthrough, see [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md). This file is
the formal shape.

## `registry.json` schema

```jsonc
{
  "version": 1,
  "methods": { "regex": "...", "stat": "...", "llm-only": "..." },   // documentation
  "status":  { "active": "...", "stub": "...", "planned": "..." },   // documentation
  "tells": [
    {
      "id": "s-colon-header",            // stable kebab id: profiles + anchor reference this; never rename
      "title": "Inline colon-header",
      "category": "surface" | "rhythm" | "king" | "ru" | "he",
      "method": "regex" | "stat" | "llm-only",
      "detector": "colonHeader",         // detector fn name, or "planned:<name>" if not yet built
      "status": "active" | "stub" | "planned",
      "defaultSeverity": "HIGH" | "MEDIUM" | "LOW",   // a profile can override this
      "summary": "...", "bad": "...", "fix": "...", "source": "...",
      "params": { }                      // optional detector params (thresholds, word lists, regexes)
    }
  ],
  "notes": { "semanticCompanions": {...}, "deferredKingFictionRules": {...}, "deferred": "..." }
}
```

**Counts today: 44 tells**: surface 22, rhythm 7, King 6, Russian 5, Hebrew 4. By status: 43 active, 1 planned
(`k-length-cut`, a two-draft delta metric). By method: 39 regex, 5 stat, 0 llm-only in the active set (the
irreducibly-semantic calls live in `notes` and are handled by the rewrite layer, never the core).

### Detectors

Each tell names a `detector`. Two kinds:

- **Generic, data-driven**: the detector's whole behaviour comes from `params`, so a new tell is **pure JSON, no
  code**: `wordlist` (a phrase list, ASCII word boundaries; for non-Latin scripts use `regexList` with
  script-correct boundaries baked into the pattern) and `regexList` (an array of `{re, flags?, message?}`).
- **Dedicated**: a named detector for a specific structural or statistical pattern (e.g. `colonHeader`,
  `emDashDensity`, `paraUniformity` for sentence/paragraph burstiness, the rhythm detectors, and the King concision
  detectors). Adding a *new kind* of detector is the code lane; see CONTRIBUTING.

A `params.exclude` list on the wordlist / passive / adverb detectors lets a profile suppress domain terms it
shouldn't flag; the engine merges registry `params` with any the profile rule supplies.

## Profile schema

```jsonc
{
  "name": "essay-en",
  "channel": "essay",                     // essay | substack | linkedin | consulting | technical | personal | ...
  "lang": "en",                           // en | ru | he
  "persona": "neutral",                   // neutral | formal | technical | ...
  "description": "...",
  "registry": "../tells/registry.json",
  "rules": [
    { "tellId": "s-colon-header", "enabled": true, "severity": "HIGH" }
    // one entry per tell the profile cares about; severity overrides the registry default; enabled toggles it
  ],
  "procedure": []                         // optional ordered rewrite steps (see the rewrite procedures in docs/reference/)
}
```

Profile-id convention: `{channel}-{lang}-{persona}`. Resolution order at runtime:
`--profile <id>` flag → frontmatter `voice-profile:` → default (`essay-en`).

**`essay-en` is the public default**: a strict, generic English longform profile with **no per-author
calibration** (registry-default em-dash density, generic `r-uniform-polish` burstiness floors, no `k-passive`
exclude-list), so `tacheles check` works out of the box on anyone's prose. To calibrate to a specific voice, copy
it and tune `params` / `exclude` per rule. `essay-ru` is the Russian counterpart. Other shipped example profiles are
persona-neutral by register (`consulting-en-formal`, `technical-en`); formal/technical profiles legitimately turn
off the formatting and rhythm tells that those registers use on purpose.

## Acceptance bar

The engine is validated against fixtures in [`../../tests/fixtures/`](../../tests/fixtures/): a slop-dense
"negative" specimen must produce multiple HIGH findings (it carries colon-headers, both-sides hedging, "it's not X,
it's Y" reframes, an aphoristic closer, and uniform paragraph rhythm), and a clean human-sounding "positive"
specimen must pass at 0 HIGH. See the acceptance test for the exact thresholds.
