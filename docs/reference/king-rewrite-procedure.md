# The King Rewrite Procedure

*Stephen King's *On Writing* turned into an ordered, enforceable rewrite procedure, not a list of quotes.*

> **What this is.** The [voice anchor](../../src/anchor/voice-anchor.md) tells you *how to write*; the
> [tell registry](../../src/tells/registry.json) is the deterministic gate that flags what you wrote. This file is the
> bridge: a numbered sequence of passes you run on a draft, where each pass is a King craft rule rewritten as a step
> with a forcing function, and each step names the step-3 detector that catches the violation. King's complaint:
> citing *On Writing* is not implementing it. Quotes are not rules that force the writing. So every rule below is a
> step you execute and a `tacheles check` tell you must drive to zero (or justify keeping).
>
> Source: King, *On Writing: A Memoir of the Craft* (Scribner, 2000), craft pp. 78–166. Rule extraction +
> DETECTOR/REWRITE-STEP/ETHOS classification done in a separate pass.

## How to run it

King's own sequence: **write the first draft with the door closed, rest it, then revise with the door open, and the
revision is mostly subtraction.** "2nd draft = 1st draft − 10%." The passes below are that open-door revision, ordered
cheapest-and-most-mechanical first (the things a detector can prove) to most-semantic last (the things only your ear
catches). Run them top to bottom. After the last pass, run `tacheles check` with the right profile and read the piece
aloud. The 0-HIGH score is necessary, not sufficient. The real gate is whether it still sounds like a person.

Each pass: **the King rule** (what he said) → **the step** (what you do, with the forcing function) → **detector**
(the tellId that proves it, or `manual` where the call is semantic).

---

### Pass 0: Draft with the door closed *(ethos, not enforced)*
Write the whole thing fast, for one ideal reader, without stopping to fix. None of the passes below apply while
drafting; they are revision. King: the first draft is for you; every later draft is for the reader. *(No detector. This
is the only pass `tacheles check` ignores.)*

### Pass 1: Kill the adverbs
**King:** "The road to hell is paved with adverbs… The adverb is not your friend." **Step:** delete every `-ly` adverb.
If the sentence falls apart without it, the verb was wrong or you needed a concrete detail. Fix that instead, don't
re-add the adverb. "Significantly improved" → name the number. **Detector:** `k-adverbs`.

### Pass 2: Active voice, name the actor
**King:** passive voice "seems to have been created with the timid writer in mind." **Step:** find every `was/were/been`
+ past participle and rewrite so a named actor does the verb. "40GB was exfiltrated" → "attackers exfiltrated 40GB."
"Mistakes were made" is an evasion; "the vendor shipped default credentials" is a sentence. **Detector:** `k-passive`.

### Pass 3: Plain short words
**King:** "Use the first word that comes to your mind, if it is appropriate and colorful." **Step:** replace every
Latinate/fancy word with the common Anglo-Saxon one. utilize→use, facilitate→help, commence→start, leverage→use,
robust/innovative/transformative/cornerstone/landscape/journey → delete or name the real thing. Also drop the empty
copula puff ("is a powerful tool that…"). **Detectors:** `k-fancy-word`, `s-banned-vocab`, `s-banned-copula`.

### Pass 4: Cut the pet phrases and the dead similes
**King:** kill filler tags ("at this point in time," "the fact that," "at the end of the day"); fresh imagery over
clichéd. **Step:** delete every pet-phrase; replace any simile you've heard before ("like a madman," "pretty as a
summer day") with a specific image or none at all. **Detectors:** `k-pet-peeve`, `k-cliche-simile`.

### Pass 5: Second draft = first draft minus 10% (cut the restatement)
**King:** "2nd Draft = 1st Draft − 10%." **Step:** every paragraph has one sentence that restates what the paragraph
already said: find it and cut it. Also cut the throat-clearing openers ("it's worth noting that") and the significance
wraps at the ends of sections ("this underscores the importance of"). Count the words before and after; if you didn't
drop ~10%, you didn't cut hard enough. **Detectors:** `k-length-cut` *(planned: the two-draft word-count delta;
deferred)*, `s-significance-wrap`, `s-hedge-opener`, `s-meta-scaffolding`.

### Pass 6: Kill your darlings
**King:** "Kill your darlings, kill your darlings, even when it breaks your egocentric little scribbler's heart, kill
your darlings." **Step:** the manufactured aphoristic line that closes a paragraph (the wisdom mic-drop, the bolded
revelation) IS the darling. Delete it. End the paragraph on the last fact instead. A bolded standalone claim
("**wall clock ≈ tokens ≈ round trips**") is the same darling wearing bold; cut the bold and fold the claim into prose,
or drop it. **Detectors:** `r-closing-nugget`, `r-bold-aphorism`.

### Pass 7: Drop the rhythm tells (the "100% Opus" layer)
These are the tells that survive a clean surface pass and still scream machine. **Step:**
- **Reframe-opener**: "X, not Y" / "not out of malice, out of token pressure." State the positive claim directly; use
  the reframe once per piece at most. → `r-reframe-opener`
- **Significance-announcement**: "the shape is clear and a little surprising," "here's the thing," "the honest part
  is." Cut the announcement; just say the thing. → `r-significance-announce`
- **Italic-for-drama**: single-word stress, "the subprocess time *is* the wall clock." Delete the italics; if the
  sentence needs the stress, rewrite it. → `r-italic-drama`
- **Rhetorical triad**: three parallel clauses or three consecutive parallel sentences ("It reports… It marks… It
  writes…"). Use two or four, or break the parallelism. → `r-sentence-triad`
- **Em-dash overuse**: humans dash about once per ~400 words; the machine dashes every 50–80. Reserve for a genuine
  interruption; otherwise comma, period, or restructure. → `s-em-dash-density`

### Pass 8: Trust the reader
**King (and the fusion):** don't tell the reader the content mattered; let it matter. **Step:** cut every significance
wrap and every rhetorical question with a one-word answer ("The result? Resilience."). Answer in prose or don't pose
the question. **Detectors:** `s-significance-wrap`, `r-significance-announce`, `s-rhetorical-qa`.

### Pass 9: Paragraph as the unit; vary the rhythm; leave some flat
**King:** "The paragraph, not the sentence, is the basic unit of writing." **Step:** break paragraphs on the beat, not
on a template (topic → evidence → restatement, every time). Vary sentence length on purpose. A real draft has clunky and
throwaway lines; uniform polish, every sentence equally well-formed, is itself the tell. Deliberately leave one or two
sentences plain. **Detector:** `r-uniform-polish`.

### Final gate
`tacheles check --profile <channel-lang-persona>` → 0 prose-HIGH, then read aloud. If every paragraph still ends on a
rising note (conclusion, significance, implication), you missed Pass 6, so go back. The score passing is the floor; the
ear is the gate.

---

## The canonical worked example: the §5 economics paragraph

This is the bar. Same facts, same length class, every tell removed.

**BEFORE** (passes `tacheles check` at 0-HIGH, but reads 100% Opus):

> Cost is a measured, replayable number here, not a guess. Across 20 real builds on the `claude-subprocess` backend, the
> shape is clear and a little surprising: **wall clock ≈ tokens ≈ number of LLM round trips.** Every deterministic step
> is effectively free — green verification runs in about 2 seconds, a commit in about 0.7, a prompt build or doc write
> in a tenth of a second. The subprocess time spent waiting on models *is* the wall clock. That single fact is why
> cutting round trips — the no-loop philosophy of §3 — buys speed and cost at once. They are the same lever.

**AFTER** (the target feel):

> I pulled timings off 20 real builds on the subprocess backend. Almost all the wall-clock is model time. The
> deterministic steps barely register: rerunning the green tests takes about 2 seconds, the commit about 0.7, building a
> prompt or writing a doc rounds to nothing. So a build's runtime mostly tracks its token count, and the token count
> tracks how many times it called a model. That's why §3 spends so much effort not looping — a retry is just another
> round trip, and round trips are the only thing that costs.

**What each pass killed, line by line:**

| Killed | What it was | Pass / detector |
|---|---|---|
| "…a measured number here, **not a guess**" | reframe-opener | Pass 7 / `r-reframe-opener` |
| "the shape is clear and **a little surprising**" | significance-announcement | Pass 7 / `r-significance-announce` |
| "**wall clock ≈ tokens ≈ round trips**" | bold-aphorism | Pass 6 / `r-bold-aphorism` |
| "the subprocess time *is* the wall clock" | italic-for-drama | Pass 7 / `r-italic-drama` |
| "**That single fact is why** cutting round trips…" | significance-pointer | Pass 8 / `s-significance-wrap` |
| "**They are the same lever.**" | closing-nugget (the darling) | Pass 6 / `r-closing-nugget` |
| three em-dashes in one paragraph | em-dash overuse | Pass 7 / `s-em-dash-density` |
| stacked parallel clauses | softened triad | Pass 7 / `r-sentence-triad` |

**What was kept**, and why the after still works: the real numbers (2s / 0.7s / "rounds to nothing"), one em-dash not
three, first-person action up front ("I pulled timings"), and it ends on a fact ("the only thing that costs"), not a
lesson. King's whole point: subtraction. The after is shorter, plainer, and says the same thing. It just stopped
performing.

---

## Rule → step → detector map

| King rule (On Writing) | Procedure step | Detector(s) |
|---|---|---|
| Road to hell is paved with adverbs (D1) | Pass 1 | `k-adverbs` |
| Passive is for the timid (D4) | Pass 2 | `k-passive` |
| First/plain word; omit needless words (D5) | Pass 3 | `k-fancy-word`, `s-banned-vocab`, `s-banned-copula` |
| Pet phrases (D9) + fresh imagery (D6) | Pass 4 | `k-pet-peeve`, `k-cliche-simile` |
| 2nd draft = 1st − 10%; cut restatement (D12/R2/R3) | Pass 5 | `k-length-cut` *(planned)*, `s-significance-wrap`, `s-hedge-opener`, `s-meta-scaffolding` |
| Kill your darlings (R1) | Pass 6 | `r-closing-nugget`, `r-bold-aphorism` |
| (fusion: de-machine the rhythm) | Pass 7 | `r-reframe-opener`, `r-significance-announce`, `r-italic-drama`, `r-sentence-triad`, `s-em-dash-density` |
| Trust the reader | Pass 8 | `s-significance-wrap`, `r-significance-announce`, `s-rhetorical-qa` |
| Paragraph is the unit; vary rhythm (R15/R16) | Pass 9 | `r-uniform-polish` |

The semantic King moves that no regex can prove (*which* sentence is the darling, *whether* the cut keeps the meaning,
show-don't-tell) stay in the [voice anchor](../../src/anchor/voice-anchor.md) and the rewrite step. They are
`llm-only` and never enter the deterministic linter core. The detectors above find the candidates; the writer (or the
rewrite pass) makes the call.
