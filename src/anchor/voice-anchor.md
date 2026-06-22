# Voice Anchor: Human-Sounding Security/CISO Writing

*Final rewrite brief. Ten writer profiles synthesized into one blended voice target.*

> **This is one example anchor**, built for a single register: human-sounding security / CISO writing. It is the template, not the only anchor. To build your own for a different voice or field (different writers, different register, same method), see [`docs/reference/voice-anchor-guide.md`](../../docs/reference/voice-anchor-guide.md).

> **This file is the single source of truth for the voice anchor.** It lives in `Authoring/src/anchor/`
> alongside the deterministic tell registry (`../tells/registry.json`). The anchor is the **rewrite / positive
> layer** (how to write); the registry is the **detect / gate layer** (what the linter flags). Any consuming
> rewrite skill should be a thin pointer to this file; edit it here, not there. The de-LLM checklist in Part B and
> the 7 rhythm tells map onto registry tell-ids; see
> **Tell registry binding** at the foot of this file.
>
> **The ordered, enforced version of these moves is `../../docs/reference/king-rewrite-procedure.md`**: King's *On
> Writing* as a numbered sequence of revision passes, each pass bound to the detector that proves it, with the §5
> economics before/after as the worked example. This anchor is the *what* (the blended target + the catalogue); the
> procedure is the *how* (run these passes, in this order, drive each tell to zero). Rewrite with the procedure open.
>
> **For Russian, the procedure is `../../docs/reference/ru-rewrite-procedure.md`**: Ильяхов «Пиши, сокращай» +
> Нора Галь «Слово живое и мёртвое» (infostyle / анти-канцелярит), **not King** (King is English-prose craft).
> Same shape (ordered passes, each bound to a RU detector (`ru-*`) plus the script-agnostic rhythm tells), but the
> RU `ru-*` tells are MEDIUM (precision-biased), so the gate is `r-uniform-polish` + the ear. Channel = `personal`
> (social register); in this setup Russian is treated as personal/social writing while brand channels stay English.

---

## SYNTHESIZED BLENDED VOICE: FINAL REWRITE TARGET

**The full blend:**
- **King** → discipline layer: cut adverbs, active voice, kill darlings, plain words, 10% cut
- **Miessler** → directness layer: short paragraphs, lead with the opinion, first person without performance
- **McKenzie + Venables + Schneier + Shortridge** → substance layer: practitioner authority, concrete mechanisms, peer register, earned irreverence
- **Lewis + Gawande + McPhee** → vividness layer: specific scene over abstraction, one human case carries the argument, make the technical feel real

---

### WRITE LIKE THIS

**Open with a claim or a scene. Never a framing statement.**
Two options: state your position in the first sentence ("Most security programs optimize for the audit, not for the breach") or drop the reader into a specific moment ("In 2021, a Texas water treatment plant operator noticed the mouse cursor moving on its own"). Both are better than "In today's rapidly evolving threat landscape." Miessler leads with position. Lewis and Gawande open with a scene. Pick one. Never the preamble.

**Let one specific case carry the systemic argument.**
Lewis: "In Bakersfield, California, a Mexican strawberry picker with an income of $14,000 and no English was lent every penny he needed to buy a house for $724,000." That sentence explains the entire mortgage crisis. You don't need the three-paragraph abstraction if you have the right specific. Find the equivalent in the security context (the one breach, the one misconfiguration, the one decision) and let it do the work.

**Explain complex systems in plain language by showing, not summarizing.**
Gawande opens *The Checklist Manifesto* with a Halloween stab wound, not a definition of cognitive failure. McPhee: "a thousand details add up to one impression." The impression comes from accumulating the right concrete details, not from stating the impression. Don't write "complex interdependencies create systemic risk." Write what the specific interdependency was and what it caused.

**Keep sentences short. Prefer active voice. Always.**
"Mistakes were made" is a political evasion. "The vendor shipped with default credentials" is a sentence. King: passive voice "seems to have been created with the timid writer in mind." Name the actor. Short verb. Done.

**Cut adverbs. Every one.**
King: "The road to hell is paved with adverbs." "Significantly improved" → name the number. "Rapidly evolving" → say what changed and when. If the sentence needs the adverb, the verb is wrong.

**Kill your darlings, especially the zingers.**
King: "Kill your darlings, kill your darlings, even when it breaks your egocentric little scribbler's heart, kill your darlings." The manufactured aphoristic paragraph-closer IS the darling. "The real question isn't what AI can do — it's what we will do with it." Kill it. End the section on a fact or a scene instead.

**Second draft = first draft minus 10%.**
Every paragraph has a restatement sentence. Find it, cut it. Every hedge at the start of a claim ("it's worth noting that," "it could be argued"): cut it. Every significance wrap at the end of a section ("this underscores the importance of"): cut it.

**Use first person as a precision instrument, not a performance.**
"I think" marks speculation. "This is wrong" marks certainty. "I'm not convinced" marks resistance. Miessler: "I'm very worried about equality when all the best idea and data sources are behind paywalls." That's not performed vulnerability. It's a specific view with specific stakes. Use it like that.

**Vary sentence length deliberately, not rhythmically.**
Short declaratives after dense passages. Never three 18-word sentences in a row. One-sentence paragraphs are allowed. So is a paragraph that ends mid-thought without summarizing itself.

**Grant the counterargument, then move past it.**
Venables: "Everyone, no doubt, has an opinion on how many versions of the CISO role we have gone through." Give ground in one clause. Then take the argument. Don't pretend disagreement doesn't exist. Don't dissolve it into "it depends" either.

**Plain short words over fancy long ones.**
"Use" not "utilize." "Help" not "facilitate." "Start" not "commence." Lewis on complexity: "Figure out what you're trying to say and don't overtax the reader with how you say it." Graham: "It's easy to make a statement correct by making it vague." The Latinate abstraction is the escape hatch. Don't use it.

### WHAT THIS VOICE NEVER DOES
- Opens with scope-gestures ("From the boardroom to the SOC...")
- Ends sections with significance-assertions ("This underscores the critical importance of...")
- Uses "It's not X — it's Y" antithesis in every other paragraph
- Stacks tricolons reflexively ("efficient, reliable, and effective")
- Hedges and abandons the claim ("while some may argue")
- Writes from nowhere, with no specific incident, no dollar amount, no named failure
- Manufactures a punchline at the end of every paragraph instead of killing it
- Uses adverbs where a stronger verb or concrete detail would do
- Uses passive voice to avoid naming who did what
- Writes "leverage," "utilize," "robust," "innovative," "transformative," "cornerstone," "landscape," "journey"

---

## PART A: TEN WRITER PROFILES

### DISCIPLINE: Stephen King
**Source:** *On Writing: A Memoir of the Craft* (Scribner, 2000)

> "The road to hell is paved with adverbs."

> "The adverb is not your friend. Adverbs, like the passive voice, seem to have been created with the timid writer in mind."

> "Kill your darlings, kill your darlings, even when it breaks your egocentric little scribbler's heart, kill your darlings."

**King's rules as rewrite instructions:**

| Rule | What it means |
|---|---|
| Road to hell is paved with adverbs | Delete every adverb. If the sentence needs it, the verb is wrong. |
| Passive is for the timid | Name who did what. "Attackers exfiltrated 40GB" not "40GB was exfiltrated." |
| Kill your darlings | Every aphoristic paragraph-closing zinger = a darling. Delete it. End on a fact. |
| 2nd draft = 1st minus 10% | Find the restatement sentence in every paragraph. Cut it. |
| Plain short words | "Use" not "utilize." Name the specific thing, not the category. |

---

### DIRECTNESS: Daniel Miessler
**Site:** [newsletter.danielmiessler.com](https://newsletter.danielmiessler.com/)

> "Nobody (supposedly) knows what an agent is, but I think the hype is exaggerated. Anyone building agents knows what one is, even if they can't define it. I feel like the people most concerned about the lack of a perfect definition are on the sidelines watching."

> "Part of me hates this...but part of me loves it because it could be our best hope for actual effectiveness."

> "I'm very worried about equality when all the best idea and data sources are behind paywalls."

**Steal:** Lead with position then reasoning. Short paragraphs (1-3 sentences). First person marks speculation vs. certainty; it doesn't perform either.

---

### SPECIFICS: Patrick McKenzie (patio11)
**Site:** [bitsaboutmoney.com](https://www.bitsaboutmoney.com/)

> "In Bakersfield, California, a Mexican strawberry picker with an income of $14,000 and no English was lent every penny he needed to buy a house for $724,000." *(Michael Lewis, same move)*

> "Fraudsters are liars and will cheerfully mouth any words they believe will absolve them of their crimes."

> "if you fish in a pond known to have 50% blue fish, and pull out nine fish, you will appear to be a savant-like catcher of blue fish"

**Steal:** Name the actual mechanism, not the category. Simple analogies that expose logical errors. Sardonic tone earned by surrounding precision.

---

### AUTHORITY: Phil Venables
**Site:** [philvenables.com](https://www.philvenables.com/)

> "CISO 1.0 dealt with what they have. CISO 2.0 shapes what they have."

> "These CISO 2.0 long term players have experienced push back, have had challenging budget conversations, and have dealt with disappointment. But, they don't leave for the next job at the first hurdle."

> "Everyone, no doubt, has an opinion on how many versions of the CISO role we have gone through since its inception."

**Steal:** Acknowledge the reader's view before taking your own. Compress complex distinctions into short parallel structures. Peer register: not downward, not upward.

---

### PLAIN ASSERTION: Bruce Schneier
**Site:** [schneier.com/blog](https://www.schneier.com/blog/)

> "On 14 April, the Trump administration quietly acknowledged the widespread use of AI to automate government processes."

> "The disclosures carry minimal information, and lack the context necessary to understand their purpose and approach."

> "If you think technology can solve your security problems, then you don't understand the problems and you don't understand the technology."

**Steal:** Open with a concrete fact. Authority comes from precision, not rhetorical emphasis. State the conclusion after the reasoning; don't decorate it.

---

### STRUCTURE: Paul Graham
**Site:** [paulgraham.com](https://www.paulgraham.com/articles.html)

> "But it's not enough merely to be correct. It's easy to make a statement correct by making it vague."

> "Useful writing tells people something true and important that they didn't already know, and tells them as unequivocally as possible."

> "Useful writing is bold, but true."

**Steal:** Each paragraph has one point. Short sentences for conclusions, longer for setup. Convincing because you got the right answers, not because you argued well.

---

### IRREVERENCE: Kelly Shortridge
**Site:** [kellyshortridge.com/blog](https://kellyshortridge.com/blog/posts/)

> "Security is a product, but we treat it like a sacred, immutable grail to preserve, unblemished by the sublunary needs of users."

> "I'm usually astonished at how little security teams work on cultivating organizational buy-in, since that's a core part of my job as a product manager."

**Steal:** Open with the provocation, not the qualification. Absurdist metaphor (sacred grail) makes abstract organizational critique tangible. Self-astonishment is more honest than manufactured certainty.

---

### VIVIDNESS: Michael Lewis
**Books:** *The Big Short*, *Moneyball*, *Flash Boys*

> "In Bakersfield, California, a Mexican strawberry picker with an income of $14,000 and no English was lent every penny he needed to buy a house for $724,000."

> "The CDO was, in effect, a credit laundering service for the residents of Lower Middle Class America. For Wall Street it was a machine that turned lead into gold."

> "What are the odds that people will make smart decisions about money if they don't need to make smart decisions — if they can get rich making dumb decisions?"

**Steal:** One specific person, one specific number, one specific decision, and the systemic argument is made. The concrete particular IS the explanation, not an illustration of it. Lewis: "Figure out what you're trying to say and don't overtax the reader with how you say it."

---

### PLAIN EXPLANATION: Atul Gawande
**Books:** *Complications*, *The Checklist Manifesto* (Metropolitan Books)

> "Practice is funny that way. For days and days, you make out only the fragments of what to do. And then one day you've got the thing whole."

> "No matter what measures are taken, doctors will sometimes falter, and it isn't reasonable to ask that we achieve perfection. What is reasonable is to ask that we never cease to aim for it."

*The Checklist Manifesto* opens with a Halloween stab wound story, not a definition of the problem. The argument emerges from the case.

**Steal:** Open with the scene, not the thesis. Explain the complex system through what happened to a specific person. The human case carries the argument; the abstract principle follows it, briefly.

---

### STRUCTURE + DETAIL: John McPhee
**Books:** *Annals of the Former World*, *Coming into the Country* (Farrar, Straus and Giroux)

> "Readers are not supposed to notice the structure. It is meant to be about as visible as someone's bones."

> "A thousand details add up to one impression."

> "Hunt through your mind for a good beginning. Then write it. Write a lead... You find your lead, you build your structure, you are now free to write."

**Steal:** Structure is felt, not seen. Never signpost it with "In this piece I will argue..." The impression (the overall point) arrives from accumulated specific detail, not from stating the point. The lead is everything: find the concrete entry point before writing.

---

## PART B: DE-LLM CHECKLIST

*For each: what LLMs do, what humans do instead.*

---

### 1. ABSTRACT PREAMBLE OPENERS
**LLM pattern:** "In today's rapidly evolving threat landscape, organizations face unprecedented challenges..." The throat-clearing setup before the actual argument.

**Human fix:** Open with the claim (Miessler, Schneier) or open with the scene (Lewis, Gawande). Never the preamble.

---

### 2. ABSTRACTION INSTEAD OF SCENE
**LLM pattern:** "Complex interdependencies create systemic risk across the enterprise." The impression stated instead of earned.

**Human fix:** Find the one specific thing (the specific misconfiguration, the specific breach, the specific number) and let it carry the argument. McPhee: "a thousand details add up to one impression."

---

### 3. BALANCED ANTITHESIS SATURATION ("It's not X — it's Y")
**LLM pattern:** Binary oppositions in every other paragraph. Sound rhetoric deployed until it's a tic.

**Human fix:** Use it once per piece, at the moment that earns it. Otherwise state the positive claim directly.

*Source: [Why ChatGPT writes like that – Colin Gorrie](https://www.deadlanguagesociety.com/p/rhetorical-analysis-ai)*

---

### 4. MANUFACTURED MIC-DROP CLOSINGS (King's darlings)
**LLM pattern:** Every section ends with a constructed wisdom-nugget: "Because in the end, the real question isn't what AI can do — it's what we will do with it."

**Human fix:** Kill it. End the section on a specific detail, a concrete fact, or a flat statement. This is King's "kill your darlings" applied directly to the LLM's most persistent habit.

*Source: [I Asked the Machine to Tell on Itself – Vollmer](https://matthewvollmer.substack.com/p/i-asked-the-machine-to-tell-on-itself)*

---

### 5. ADVERBS (King's "road to hell")
**LLM pattern:** "Significantly improved," "rapidly evolving," "fundamentally misunderstood." Every adverb hedges or inflates.

**Human fix:** Delete it. If the sentence needs it, the verb is wrong or you need a concrete detail instead. "Significantly improved" → name the number.

*Source: King, On Writing*

---

### 6. PASSIVE VOICE AS EVASION
**LLM pattern:** "Mistakes were made." "The data was exfiltrated." Nobody did anything; things just happened.

**Human fix:** Name the actor. "Attackers exfiltrated 40GB." "The vendor shipped with default credentials." King: passive voice "seems to have been created with the timid writer in mind."

*Source: King, On Writing*

---

### 7. RELENTLESS TRICOLON ("efficient, reliable, and effective")
**LLM pattern:** Items default to three. Lists have three bullets. Descriptions have three adjectives in matched rhythm.

**Human fix:** Use two or four. Or one. Make it intentional, not reflexive.

*Source: [Why ChatGPT writes like that – Colin Gorrie](https://www.deadlanguagesociety.com/p/rhetorical-analysis-ai)*

---

### 8. FORMULAIC PARAGRAPH ARCHITECTURE + TREADMILL EFFECT
**LLM pattern:** Topic sentence → evidence → restatement. Every paragraph. 500 words, 100 of new information, 400 of restatement.

**Human fix:** Vary paragraph length. One-sentence paragraphs allowed. Apply King's 10% cut: find the restatement sentence in every paragraph and delete it.

*Source: [Signs of AI Writing – vrid.ai](https://vrid.ai/blog/signs-of-ai-writing)*

---

### 9. ABSTRACT SIGNIFICANCE WRAPS
**LLM pattern:** "This underscores the critical importance of proactive resilience strategies." Zero new information; just a declaration that the content mattered.

**Human fix:** Cut it. Let the content carry its significance. If you need a close, use a specific detail or a short flat statement.

*Also cut:* "stands as," "is a testament to," "reflects broader," "setting the stage for"

---

### 10. EM-DASH OVERUSE
**LLM pattern:** Em dashes every 50-80 words vs. humans' ~500 words.

**Human fix:** Reserve for genuine interruptions. One per 400 words. Use a comma, period, or restructure.

*Source: [The Em-Dash Myth – Duey AI](https://www.duey.ai/post/em-dash-ai-writing)*

---

### 11. RHETORICAL QUESTION + ONE-WORD ANSWER ("The result? Resilience.")
**LLM pattern:** Performs drama without delivering it.

**Human fix:** Answer in prose, or don't frame it as a question. A statement is more direct.

---

### 12. MOTIVATIONAL POSTER POSITIVITY
**LLM pattern:** No friction, no skepticism, no concession that things fail.

**Human fix:** Name something that doesn't work. Earned criticism is more credible than unearned encouragement.

---

### 13. AI VOCABULARY (KILL ON SIGHT)
delve, showcase, underscores, noteworthy, pivotal, realm, tapestry, beacon, multifaceted, meticulous, intricate, commendable, paramount, commence, elevate, leverage (verb), utilize, facilitate, streamline, foster, harness, landscape, journey, cornerstone, robust, comprehensive, innovative, transformative.

**Transition words to cut as paragraph openers:** Additionally, Furthermore, Moreover, Consequently, Thus.

**Replace Latinate with Anglo-Saxon:** utilize → use, commence → start, facilitate → help, endeavor → try.

---

### 14. MISSING PERSONAL STAKES
**LLM pattern:** Writing from nowhere. No incident, no dollar amount, no named failure. Ghost citations: "Studies show..."

**Human fix:** Put one specific thing in. One dollar amount. One company name (even anonymized). One time the author was wrong. Lewis does this constantly: the $724,000 house, the $14,000 income.

---

## FIVE QUICK SELF-TESTS

**Rhythm test:** Read aloud. If every paragraph ends on a rising note (conclusion, significance, implication), rewrite the last sentence of at least half as a flat statement or specific detail.

**Vocabulary test:** Ctrl+F for: underscores, pivotal, leverage, robust, landscape, journey, cornerstone, furthermore, additionally, innovative, transformative. Cut or replace each one.

**Adverb test:** Ctrl+F for "-ly." Delete or replace each adverb with a stronger verb or a concrete detail.

**Passive voice test:** Ctrl+F for "was," "were," "has been," "have been." Rewrite any that hide the actor.

**Specificity test:** Does the piece contain at least one dollar amount, one company name, one named mechanism, or one concrete failure? If not, add one.

---

---

## EXISTING ARTIFACTS WORTH REUSING

*Assessed for genuine utility vs. SEO-detector-bypass junk. Three are worth using.*

---

**★★★ brandonwise/humanizer** · [github.com/brandonwise/humanizer](https://github.com/brandonwise/humanizer)
A serious CLI tool (90+ stars, 136 tests, zero dependencies, MIT). Scans text for 29 AI patterns across five categories (significance inflation, AI vocabulary list of 500+ terms, em-dash density, copula avoidance, generic conclusions) plus statistical analysis (burstiness, vocabulary diversity). Composite score 0-100. Based on Wikipedia's AI writing signs and Copyleaks stylometric research. Gives per-pattern actionable suggestions and auto-fix. **Use it:** run the draft through this before the human-voice rewrite to get a scored map of where the LLM patterns cluster.

**★★★ Wikipedia: Signs of AI Writing + WikiProject AI Cleanup** · [en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
The most comprehensive community-maintained catalogue of AI writing tells, continuously updated by editors reviewing thousands of real AI-generated articles. Organized by content issues, language patterns, style/formatting, markup, and citations. The source that several other tools (including brandonwise/humanizer and blader/humanizer) are built on. **Use it:** the primary reference for Part B of this brief; already incorporated above.

**★★ blader/humanizer** · [github.com/blader/humanizer](https://github.com/blader/humanizer)
A Claude Code `/humanizer` skill (LLM-driven, not a linter). Detects 33 patterns including manufactured punchlines, aphorism formulas, fake-candid openings, and chatbot closers, then rewrites with two passes. More practical than brandonwise for in-editor use. **Caveat:** prioritizes conversational tone; can flatten technical precision. Use selectively on prose sections, not entire technical documents.

**★★ Vale linter + write-good rules** · [vale.sh](https://vale.sh) | [github.com/vale-cli/write-good](https://github.com/vale-cli/write-good)
Vale is a configurable prose linter that enforces custom style rules via YAML; you can encode any of Part B's anti-LLM rules as Vale checks and run them as a CI gate. The write-good plugin already flags passive voice, adverbs, weasel words, and hedge phrases. **Use it:** encode the vocabulary kill-list (leverage, utilize, robust, etc.) and the passive-voice rule as Vale styles; wire into pre-commit or editor.

**★★ proselint** · [github.com/amperser/proselint](https://github.com/amperser/proselint)
A Python prose linter aggregating guidance from Orwell, Strunk, and others. Catches clichés, hedging, jargon, redundancy, and corporate speak. Actively maintained (v0.16.0, Nov 2025). Doesn't specifically target LLM patterns, but catches many of the same symptoms (weasel words, bureaucratese, mixed metaphors). **Use it:** complement to Vale; catches traditional bad-prose issues that predate LLMs but that LLMs amplify.

**✗ lynote-ai/humanize-text, OrbitWebTools/Humanize-AI, AI-Text-Humanizer-App**: Skip. These are AI-detector-bypass tools aimed at students evading Turnitin, not writing improvement tools. Low signal, high SEO noise.

**★ IrtezaAsadRizvi/article-writing-skills** · [github.com/IrtezaAsadRizvi/article-writing-skills](https://github.com/IrtezaAsadRizvi/article-writing-skills)
A SKILL.md prompt library for emulating specific author thinking styles (currently only Karpathy). The concept is sound: structured author-style prompts as system-prompt files. Only 2 commits, 11 stars; too early-stage to reuse directly, but the SKILL.md format is worth adopting for encoding the voice anchor in this brief as a deployable Claude Code skill.

---

*Sources:*
- Stephen King, *On Writing: A Memoir of the Craft* (Scribner, 2000)
- Michael Lewis, *The Big Short* (W. W. Norton, 2010) | [Goodreads quotes](https://www.goodreads.com/work/quotes/6654434)
- Atul Gawande, *Complications* (Picador, 2002) | *The Checklist Manifesto* (Metropolitan Books, 2009)
- John McPhee, *Draft No. 4* (Farrar, Straus and Giroux, 2017) | [McPhee on structure](https://medium.com/swlh/7-quotes-from-john-mcphee-on-the-writing-process-bd77374093ec)
- [Unsupervised Learning – Daniel Miessler](https://newsletter.danielmiessler.com/)
- [Bits about Money – Patrick McKenzie](https://www.bitsaboutmoney.com/)
- [Phil Venables – CISO Version 2.0](https://www.philvenables.com/post/ciso-version-2-0)
- [Schneier on Security](https://www.schneier.com/blog/)
- [How to Write Usefully – Paul Graham](https://paulgraham.com/useful.html)
- [Kelly Shortridge – Security as a Product](https://kellyshortridge.com/blog/posts/security-as-a-product/)
- [Why ChatGPT writes like that – Colin Gorrie](https://www.deadlanguagesociety.com/p/rhetorical-analysis-ai)
- [I Asked the Machine to Tell on Itself – Vollmer](https://matthewvollmer.substack.com/p/i-asked-the-machine-to-tell-on-itself)
- [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
- [Signs of AI Writing – vrid.ai](https://vrid.ai/blog/signs-of-ai-writing)
- [The Em-Dash Myth – Duey AI](https://www.duey.ai/post/em-dash-ai-writing)
- [Stephen King on adverbs – The Marginalian](https://www.themarginalian.org/2013/03/13/stephen-king-on-adverbs/)
- [Michael Lewis's 9 Rules – Next Big Idea Club](https://nextbigideaclub.com/magazine/michael-lewiss-9-rules-storytelling/20462/)

---

## Tell registry binding

The rewrite moves above are the positive layer. The deterministic gate is `../tells/registry.json`. They share
vocabulary so they never drift: each de-LLM checklist item and each rhythm tell maps to a registry tell-id. After a
rewrite, `tacheles check` (with the right profile) enforces the same set this anchor teaches.

**Part B de-LLM checklist -> tell-id:**

| Part B item | Tell-id |
|---|---|
| 1. Abstract preamble openers | `s-meta-scaffolding`, `s-hedge-opener` |
| 2. Abstraction instead of scene | `14-missing-personal-stakes` (rewrite-layer, semantic) |
| 3. Balanced antithesis ("not X, it's Y") | `r-reframe-opener` |
| 4. Manufactured mic-drop closings | `r-closing-nugget` (+ semantic darling call, rewrite layer) |
| 5. Adverbs | `k-adverbs` |
| 6. Passive voice as evasion | `k-passive` |
| 7. Relentless tricolon | `s-list-tricolon`, `r-sentence-triad` |
| 8. Formulaic paragraph architecture / treadmill | `r-uniform-polish`, `k-length-cut` |
| 9. Abstract significance wraps | `s-significance-wrap`, `r-significance-announce` |
| 10. Em-dash overuse | `s-em-dash-density`, `s-ascii-only` |
| 11. Rhetorical question + one-word answer | `s-rhetorical-qa` |
| 12. Motivational-poster positivity | rewrite-layer (semantic) |
| 13. AI vocabulary | `s-banned-vocab`, `s-banned-copula`, `k-fancy-word` |
| 14. Missing personal stakes | rewrite-layer (semantic) |

**The 7 rhythm tells (the deeper "100% Opus" signal) -> tell-id:** reframe-opener `r-reframe-opener` ·
significance-announce `r-significance-announce` · bold-aphorism `r-bold-aphorism` · italic-for-drama `r-italic-drama` ·
rhetorical triad `r-sentence-triad` · per-paragraph closing-nugget `r-closing-nugget` · uniform polish `r-uniform-polish`.

**King discipline -> tell-id:** adverbs `k-adverbs` · passive `k-passive` · plain short words `k-fancy-word` ·
fresh imagery `k-cliche-simile` · cut filler `k-pet-peeve` · 10% cut `k-length-cut`. The semantic King moves
(kill-your-darlings, which-sentence-to-cut, show-don't-tell) stay in this anchor's rewrite procedure; they are
`llm-only` and never enter the linter core.

