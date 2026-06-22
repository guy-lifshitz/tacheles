# Building your own voice anchor

Sounding like you has two halves. One is the numbers: how long your sentences run, how much that varies, how often you reach for an em-dash. That half lives in the [calibration guide](calibration-guide.md), and it sets the thresholds a profile gates on. The other half is the voice itself: whose moves you are reaching for, what a good sentence looks like to you, which habits you refuse. That half is the **voice anchor**, and this is how you build one.

The shipped anchor, [`src/anchor/voice-anchor.md`](../../src/anchor/voice-anchor.md), is a worked example for one register: human-sounding security and CISO writing, synthesized from ten named writers. It is not the only possible anchor. It is the template. Yours will name different writers and aim at a different register, but it is built the same way.

## What an anchor is

A profile tells the linter what to flag. An anchor tells the writer (or the rewrite layer) what to aim for. The linter is the gate; the anchor is the target. They share vocabulary so they never drift: every move in the anchor maps to a tell the linter can check, and every tell the linter flags has a positive move in the anchor that fixes it.

An anchor has three parts:

- **A blended voice** (the writers you steal from, grouped into layers).
- **A "write like this" / "never does" pair** (the moves, stated as instructions).
- **A binding table** (each move mapped to a registry tell-id, so `check` enforces it).

Part one is the customization. Parts two and three are mostly a chassis you can reuse.

## Step 1: choose your influences

Pick five to ten writers whose prose does something you want yours to do. Spread them across a few layers so the blend is not one-note. The example anchor uses four:

- **Discipline**: concision, grammar, cutting. (The example uses Stephen King.)
- **Directness**: stance, paragraph shape, first person. (Daniel Miessler.)
- **Substance**: authority in your actual domain, concrete mechanisms, peer register. (McKenzie, Venables, Schneier, Shortridge.)
- **Vividness**: the specific scene that carries the argument. (Lewis, Gawande, McPhee.)

Choose for your field, not the example's. A finance writer, a novelist, and a backend engineer want different substance and vividness layers. The discipline and directness layers transfer well; the substance layer almost never does.

## Step 2: pull real quotes

For each writer, copy two or three short quotes that show the exact move you are stealing. Real quotes, not paraphrase. The quotes are to the voice what a clean corpus is to the numbers: the ground truth you are matching. A paraphrase loses the thing you picked the writer for.

Under each quote, write one line naming the move ("lead with position, then reasoning"; "one specific person and one number make the systemic argument"). That line is what you will turn into an instruction.

## Step 3: synthesize the target

Collapse the per-writer notes into two lists.

- **Write like this.** The positive moves, each as a concrete instruction with an example, not an adjective. "Open with a claim or a scene, never a framing statement" beats "be engaging."
- **What this voice never does.** The habits you refuse, stated as patterns. This list is where your taste gets specific.

Keep both lists short enough to read before a rewrite. The example anchor's two lists are the right length and shape to copy.

## Step 4: keep the de-LLM checklist

The example anchor's Part B (the catalogue of AI tells: preamble openers, balanced antithesis, mic-drop closings, adverbs, passive evasion, reflexive tricolon, significance wraps, em-dash overuse, and the rest) is **register-independent**. A model leaves the same tells whether it is writing about security or sourdough. Reuse Part B almost verbatim. Your customization is Part A (the writer blend) plus which of these tells matter most for your register, which you express in the profile.

## Step 5: bind it to the linter

This is what keeps the anchor honest. Map each move to a registry tell-id, the way the example anchor's "Tell registry binding" table does, then set a profile that turns those tells on at the severity you want. Now the loop closes: the anchor teaches the move, you rewrite toward it, and `tacheles check` enforces the same set deterministically. Pair the profile with the quantitative thresholds from the [calibration guide](calibration-guide.md) and the anchor covers both halves of your voice.

## Using it

Rewrite with the anchor and the rewrite procedure for your language open ([King for English](king-rewrite-procedure.md), [Ильяхов and Нора Галь for Russian](ru-rewrite-procedure.md)). The anchor is the *what*; the procedure is the *how*. Then gate with `tacheles check`. The score is the floor; your ear is the gate.

## Doing it with help

Building an anchor by hand is a session of reading and synthesis. An LLM can do most of it interactively: name the writers you admire, and it can pull representative quotes, group them into layers, draft the two lists, and propose the binding table for you to edit. The packaged rewrite skill that drives this is on the roadmap; until then, any capable model with this guide open can walk you through it.

## What stays yours

An anchor is a statement of taste: the writers you chose, the moves you named, the habits you refuse. It is less of a fingerprint than a calibrated profile (it leaks no corpus statistics), so it is safer to share. But it is still the most personal artifact in the system. The anchor shipped here is generic by design, aimed at one public register. Your own will be better because it is yours.
