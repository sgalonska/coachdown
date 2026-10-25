# Writing guide

> Full specification: https://github.com/sgalonska/coachdown/blob/main/SPEC.md · This guide covers Coachdown **0.2**.

How to take notes with Coachdown during a live coaching session — without looking away from the person in front of you.

## The one rule

**Write what you hear. Mark only what would otherwise be unclear.**

An unmarked line is the coachee's (in most sections). Questions are yours. That covers the large majority of what you write. Everything else is an exception you mark with one or two characters.

## Before the session

Add a new session block **above** the previous one:

```markdown
---

## 2026-03-24 · Session 5
time: 14:00–15:00

### Since last time

### Review

### Discussion

### Experiments
```

Invite the coachee to fill in **Since last time** or **Agenda** before you meet. These sections belong to the coachee: their lines — including their questions — need no marker.

Copy last session's open experiments into **Review**, so you remember to ask about them.

## During the session

| When … | write … |
| --- | --- |
| the coachee tells you something | nothing special: `- the new shop opened` |
| the exact words matter | quotation marks: `- "I didn't find the right moment"` |
| you ask a question | the question: `- What stops you?` |
| you say something — an observation, a hypothesis, advice | your tag: `- J: you use "must" a lot` |
| the coachee asks *you* something | their tag: `- M: What would you do?` |
| the coachee realises something | `!!` after the line, once you notice it: `- I treat him like the owner!!` (a leading `!` works too) |
| something is decided | `=`: `- = the shift leads plan April` |
| the coachee wants to try something | a checkbox: `- [ ] talk to her father on Monday` |
| you promise something | a checkbox with your tag: `- [ ] J: send the sheet` |
| an answer or reaction follows | indent it under what it answers |

Do not try to be complete. Short notes with the right markers are worth more than long notes without them.

## After the session

Take two minutes while it is fresh:

- Add a marker where a line is ambiguous.
- Add `#themes` to the topics that keep coming back.
- Optionally write an `Observations` or `Summary` section with your own reflection — these sections are yours by default.
- Every few sessions, update the **Progress** section at the top: what has shifted for the coachee?

## Reviewing experiments

In the next session, go through **Review** together:

```markdown
### Review
- [x] Let the shift leads plan the April schedule on their own
  - learned: the mistake bothered her less than she expected
- [ ] Agree with her father on one area that is his
  - not done – "I didn't find the right moment"
```

Ask what was learned, not only whether it was done. An experiment that was not done often teaches the most.

## Material

Pasted documents, frameworks, journal entries and AI summaries are not conversation. Put them in a blockquote, and label generated text with `[AI]`:

```markdown
> **Mara's notes before the session**
> I opened the new shop. Everything went fine, but I was there from 4 am to 9 pm.

### [AI] Summary
> [AI] Mara wants to hand over scheduling and keep supplier contracts.
```

## Common pitfalls

- **Writing your own advice without a tag.** If you nest advice under the coachee's line without `J:`, it will be read as the coachee's. In your notes it looks obvious; for anyone else it is not.
- **Putting quotation marks around paraphrases.** Quote only exact words. Use first person without quotes if you write in the coachee's voice.
- **Marking every line.** If you find yourself writing your tag on every line of a section, put it in the heading instead: `### J: Circle of influence`.
- **Forgetting the header note.** Someone else — the coachee, a colleague, a tool — will open the log one day. The note at the top tells them how to read it.
