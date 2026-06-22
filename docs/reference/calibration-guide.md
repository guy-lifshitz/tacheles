# Calibrating Tacheles to your own voice

The default `essay-en` profile is strict and generic. It has no idea who you are. Calibration tunes a profile so it flags writing that drifts from *your* voice, instead of flagging your voice itself. This is the method we used to build the calibrated profiles, and the method to build your own.

## The idea

A linter with one fixed threshold treats every writer the same. But a real human voice has a measurable signature: how long your sentences run, how much that length varies, how often you reach for an em-dash, which domain words you use without thinking. Calibration measures that signature from a body of your own clean writing, then sets the profile's thresholds to match it. After that, a finding means "this is flatter, or more padded, or more machine than you actually write," not "this broke a generic rule."

## Step 1: gather a clean corpus

Collect a few thousand words of your own writing that you are proud of and that sounds like you. Two rules:

- **Real, finished prose** (blog posts, essays, long emails, forum comments). Not notes, not bullet lists.
- **AI-free.** If a model touched it, it already carries the tells you are trying to detect, and it will poison the baseline. Old writing is fine, and often better.

Aim for at least ~2,000 words; more is better. Keep one corpus per language.

## Step 2: measure your signature

Compute, over the corpus:

- **Mean sentence length** (words per sentence).
- **Sentence-length CV** (coefficient of variation: standard deviation divided by mean). This is your burstiness. A high CV means you mix short and long sentences. A low CV means even, uniform sentences, which is the machine signature.
- **Paragraph-length CV**: the same measure at the paragraph level.
- **Em-dash density**: em-dashes per 1000 words. Many human writers sit near zero; models often run 10 to 30.
- **Domain vocabulary**: words on the banned list that you use legitimately and often (the terms of art in your field).

You do not need a separate tool. Run `tacheles measure <corpus>` and it computes all of these, using the same sentence and CV math the linter gates on, and prints a `suggestedProfile` block you can start from.

## Step 3: write the numbers into a profile

`tacheles measure` prints a `suggestedProfile` block with these values already filled in; copy them into a clone of `essay-en`, then tune. By hand, the settings are:

- `s-em-dash-density` `params.perThousand` = your measured rate, rounded down. If you barely use em-dashes, set it to `1`.
- `r-uniform-polish` `params.sentCvFloor` and `paraCvFloor` = a floor just below your measured CV. The tell then fires only when a draft is *flatter* than you naturally write. Put the floor at your own baseline, and anything more uniform than you gets flagged.
- `params.exclude` on the word and passive tells = your legitimate domain terms, so they stop being flagged.

## Step 4: validate against your own corpus

Run the clean corpus back through the new profile. It should pass at 0 HIGH. If it flags your own good writing, the threshold is too tight; loosen it until your baseline passes. A calibration that fails the writing it was built from is wrong. The corpus is the ground truth, not the rule.

## Step 5: trust the ear last

The score is the floor, not the ceiling. After a draft passes, read it aloud. Calibrated thresholds catch measurable drift. They cannot hear a sentence that is technically clean and still sounds like a machine. That call stays yours.

## What stays private

A calibrated profile encodes your corpus statistics: your CV floors, your em-dash rate, your domain words. Treat it as personal, because it is a fingerprint of how you write. The profiles shipped in this repo are generic on purpose, with no individual calibration, so the default works for anyone out of the box. Keep your calibrated profile in your own repo.
