# Coachdown Specification

> This is the full specification. Canonical version: https://github.com/sgalonska/coachdown/blob/main/SPEC.md

**Version 0.2 — Draft** · [Changelog](CHANGELOG.md)

The key words MUST, MUST NOT, SHOULD and MAY are to be interpreted as described in RFC 2119.
Sections marked *(informative)* explain; everything else is normative.

## Contents

1. [Principles](#1-principles)
2. [Document structure](#2-document-structure)
3. [Header note and front matter](#3-header-note-and-front-matter)
4. [Engagement sections](#4-engagement-sections)
5. [Sessions](#5-sessions)
6. [Session sections](#6-session-sections)
7. [Markers](#7-markers)
8. [Material](#8-material)
9. [Processing](#9-processing)
10. [Privacy](#10-privacy)
11. [Editors and conversion](#11-editors-and-conversion-informative) *(informative)*
12. [Versioning](#12-versioning)
13. [Open questions](#13-open-questions)

---

## 1. Principles

1. **Write first, structure later.** A coach takes notes during a live conversation. Coachdown MUST NOT require anything that slows this down.
2. **Every Markdown file is valid Coachdown.** Markers only increase certainty; unmarked content is interpreted by a parser or agent.
3. **Mark the exception.** Defaults — per document and per section — are chosen so that the most frequent case needs no marker.
4. **Human-readable as-is.** A Coachdown document MUST read as ordinary notes in any Markdown tool and in common document editors.
5. **Two authors, one log.** Coach and coachee may both write into the same document. The format MUST support this.

## 2. Document structure

A Coachdown document is the rolling log of **one coaching engagement**. It consists of, in this order:

1. a **header note** and optional **front matter** (§3),
2. optional **engagement sections** (§4),
3. zero or more **sessions** (§5).

The recommended file extension is `.coach.md`. A document MAY also live in an editor that is not Markdown-based (for example Google Docs) as long as it can be exported to Markdown (§11).

## 3. Header note and front matter

### 3.1 Header note

Every Coachdown document SHOULD start with a short, human-readable note that says which format it uses and where the specification can be found, so that anyone opening the document — a coachee, a new coach, a tool — understands the markers:

```markdown
> This log uses **Coachdown 0.2** — markers and rules: https://github.com/sgalonska/coachdown/blob/main/SPEC.md
```

The note stands directly after the front matter, or at the very top if there is no front matter. Parsers MUST ignore it.

### 3.2 Front matter

Front matter is a YAML block at the start of the document. It is OPTIONAL but RECOMMENDED.

```yaml
---
coachdown: 0.2
spec: https://github.com/sgalonska/coachdown/blob/main/SPEC.md
participants:
  J: { role: coach, name: Jonas }
  M: { role: coachee, name: Mara, aliases: [Mara S.] }
  F: { role: other, name: her father }
default_speaker: coachee
order: newest-first
language: en
---
```

| Key | Required | Meaning |
| --- | --- | --- |
| `coachdown` | SHOULD | Version of this specification the document follows |
| `spec` | SHOULD | Link to the specification |
| `participants` | SHOULD | Speaker tags → participants (§3.3) |
| `default_speaker` | MAY | Who said an unmarked line outside of sections with their own default. `coachee` (default), `coach`, or a tag |
| `order` | MAY | `newest-first` (default) or `oldest-first` |
| `language` | MAY | Main language, BCP 47 (`en`, `de`). Documents MAY mix languages |

In editors where a YAML block is impractical, the same keys MAY be written as a list under an engagement section named `About this log` (§4).

### 3.3 Participants and speaker tags

- A **tag** is one or more letters (`J`, `M`, `MK`). It is what you type during the session.
- A participant is declared either short (`J: coach`) or long (`J: { role: coach, name: Jonas, aliases: [...] }`).
- **Roles:** `coach`, `coachee`, `sponsor` (the person or company paying), `observer`, `other`.
- An engagement MAY have several coachees (team or pair coaching), each with its own tag.
- The participant's `name` and every entry in `aliases` MUST be recognised as an alternative to the tag: `Jonas: …` equals `J: …`.
- If `participants` is missing, `Coach:` and `Coachee:` (and their translations, e.g. `Klient:`) MUST still be recognised.

## 4. Engagement sections

Headings before the first session whose text does not start with a date (§5.1) are engagement sections. They describe the engagement as a whole and are kept up to date over time.

The following names are RECOMMENDED. Parsers SHOULD recognise them and their aliases; any other name is allowed.

| Section | Aliases (examples) | Content |
| --- | --- | --- |
| `About this log` | Purpose, Wozu dieses Dokument? | What the document is for, who may read it, front-matter keys if no YAML |
| `Goals` | Ziele, Coaching Goals | Goals of the coachee for this engagement |
| `Context` | Company, Vision, Strategy, Top Priorities, Pains | Background: organisation, vision, priorities, pain points, values |
| `Agreements` | Expectations, Erwartungen | Rhythm, confidentiality, mutual expectations |
| `Backlog` | Topic Backlog, Themenspeicher, Thematischer Backlog | Topics to cover in future sessions, as a task list (§7.5) |
| `Progress` | Development, Entwicklung | The coachee's growth story, see below |
| `Resources` | Links, Reading List, Books | Material recommended during the engagement |
| `Glossary` | Glossar | Terms and abbreviations of the coachee's world |
| `Contact` | Emergency Contact | How to reach each other between sessions |

**Progress** is the human-written counterpart to automated growth analysis. It SHOULD be organised in dated entries or in phases (for example *Before / Midway / Today*) and describe shifts in insight, behaviour and perspective — not completed tasks.

```markdown
## Progress

### Before (2026-02)
- worked every shift herself, checked every tray

### Today (2026-05)
- the shift leads plan the schedule; she reviews it once a month
```

## 5. Sessions

### 5.1 Session heading

A session starts with a heading — of **any level** — whose text starts with a date. The following date formats MUST be recognised:

| Format | Example |
| --- | --- |
| ISO | `2026-03-10` |
| Month name first | `Mar 10, 2026`, `March 10, 2026` |
| Day first, month name | `10 Mar 2026`, `10. März 2026` |
| Day first, numeric (D.M.Y) | `10.03.2026`, `10.03.26` |

Numeric formats with slashes (`03/10/2026`) are ambiguous and MUST NOT be used.

After the date, the heading MAY contain:

- a **title**, separated by `·`, `|` or `–`: `## 2026-03-10 · Session 4`. Links in it (for example to a calendar event) are allowed and are metadata.
- a **status** in parentheses: `(cancelled)`, `(postponed)`. Translations such as `(nicht stattgefunden)` SHOULD be recognised. A cancelled session MAY still hold notes, such as an agenda that moves to the next session.

A session ends at the next session heading or at the end of the document. A thematic break (`---`) before a session heading is RECOMMENDED for readability and MUST be ignored by parsers.

### 5.2 Session metadata

The first lines of a session MAY carry metadata as `key: value` pairs, on one line separated by ` · ` or on separate lines:

```markdown
## 2026-03-10 · Session 4
time: 14:00–16:00 · type: session · participants: J, M
topics: delegation, opening of the new shop
```

| Key | Meaning |
| --- | --- |
| `time` | Start–end time; duration is derived |
| `type` | `intake`, `session` (default), `interview`, `closing` |
| `participants` | Tags present, if different from the engagement (e.g. a second coachee, an interview partner) |
| `topics` | Short topic summary, for example for a report to the sponsor |

In a session of `type: interview`, the default speaker is the interviewed person: the first participant listed in `participants` who is not the coach.

Metadata is optional. Its purpose is to remove double bookkeeping: time sheets and sponsor reports can be generated from the log.

## 6. Session sections

### 6.1 Headings inside a session

Every heading inside a session whose text does not start with a date is a **session section**, regardless of its level. Sections MAY be nested; a section ends at the next heading of the same or a higher level, or at the next session heading.

### 6.2 Standard sections

Some sections recur in almost every coaching log. Parsers SHOULD recognise the following names and their aliases and apply the defaults listed. Writers MAY use any other name.

| Section | Aliases (examples) | Default speaker | Items are |
| --- | --- | --- | --- |
| `Since last time` | Check-in, Updates, Letzte Wochen, What happened since we last spoke? | coachee | notes |
| `Agenda` | Topics, Themen, What would you like to discuss?, Input before the session | coachee | notes |
| `Review` | Rückblick, Todos from last time, Previous action points, Check on previous action items | coachee | reviewed experiments (§7.5) |
| `Discussion` | Diskussion, Talking points, Besprochene Themen, Notes | document default | notes |
| `Observations` | Key insights, Beobachtungen, Suggestions, Recommended actions, Handlungshinweise | coach | notes |
| `Decisions` | Decisions made, Entscheidungen | document default | decisions (§7.4) |
| `Experiments` | Action points, Action items, Todos, Aufgaben, Next steps | coachee (owner) | experiments (§7.5) |
| `Summary` | Key takeaways, Zusammenfassung, Quintessenz, Learnings | coach | notes |
| `Feedback` | Feedback on the session, Stop / Start doing | coachee | feedback on the coaching itself |

In sections whose default speaker is the coachee, questions are the coachee's (§7.3).

### 6.3 Section default

A section heading that starts with a speaker tag or alias sets the default speaker for that section explicitly, overriding §6.2:

```markdown
### J: Circle of influence

- what you decide alone
- what you can influence
  - M: the suppliers belong here
```

### 6.4 Perspective sections

A section heading of the form `Perspective: <name or tag>` (aliases: `Sicht`, `View`) contains the view of that person as reported in the session. Its default speaker is that person:

```markdown
### Perspective: her father
- the shops ran fine for 30 years
```

## 7. Markers

Markers stand at the start of a list item or paragraph, after the list bullet and after a checkbox. Several markers MAY be combined in any order (`! M: …` equals `M: ! …`).

### 7.1 Speaker

| Form | Speaker |
| --- | --- |
| `J: text` or `Jonas: text` | the participant with that tag, name or alias |
| unmarked question (§7.3) | the coach — except in sections whose default speaker is the coachee |
| other unmarked text | the default speaker of the section (§6), else of the session (§5.2), else `default_speaker` |

Text after the tag is what that person said or contributed — paraphrased unless quoted. A label without text (`- J:`) applies to its nested items. First-person notes without quotation marks (`- I want more time`) are paraphrases in the speaker's voice, not verbatim quotes.

### 7.2 Verbatim quote

Text in quotation marks (`"…"`, `“…”`, `„…“`) at the start of the text — after any markers — is a **verbatim quote** of the line's speaker: `- "I don't want to run it like my father"`, `- M: "I say yes before I think"`.

A quote by someone who is not a participant carries a trailing attribution: `- "She is too young for this" — her father`.

### 7.3 Question

A line ending in `?` is a question. Unless the section says otherwise (§6.2), unmarked questions are the coach's. A coachee's question outside such sections MUST carry the coachee's tag: `- M: What would you do in my place?`

### 7.4 Decision

`=` marks a **decision**: something that was decided in or before the session and will hold until it is changed.

```markdown
- = the shift leads plan the April schedule
- = M: her father keeps the shop window, she keeps the staff
```

Decisions are distinct from insights (something understood) and experiments (something to try). Items in a `Decisions` section (§6.2) are decisions without the marker.

### 7.5 Experiments, action points and their review

A task list item is an **experiment** (action point):

```markdown
- [ ] talk to both shift leads before Friday
- [ ] J: send the delegation sheet
```

- The owner is the coachee unless a speaker tag follows the checkbox.
- Nested lines under an experiment are notes about it, not further experiments.
- Completion is **not** a success measure in Coachdown. What matters is what was learned.

An experiment is **reviewed** in a later session by repeating it — usually in a `Review` section — with its state and a nested `learned:` line:

```markdown
### Review
- [x] Let the shift leads plan the April schedule on their own
  - learned: the mistake bothered her less than she expected
- [ ] Agree with her father on one area that is his
  - not done – "I didn't find the right moment"
```

Parsers SHOULD link a reviewed item to the most recent earlier experiment with the same or nearly the same text. A writer MAY add the original date to make the link explicit: `- [x] (2026-03-10) Let the shift leads …`.

### 7.6 Insight

`!` marks an **insight** of the coachee: a realisation or conclusion that matters to their development.

```markdown
- ! "I check everything because I don't trust myself"
```

An insight voiced by the coach is a hypothesis; it SHOULD be written with the coach's tag (`- J: ! …`) or in an `Observations` section, and parsers MUST record it as a hypothesis, not as a coachee insight.

### 7.7 Relations

Indentation expresses relation: a nested item answers, elaborates or reacts to its parent. Parsers SHOULD record the parent of every item.

### 7.8 Themes

`#tag` anywhere in a line assigns a theme. Tags SHOULD be lower-case with hyphens (`#handover`). Themes are optional; agents MAY infer them.

### 7.9 Marker overview *(informative)*

| Marker | Meaning |
| --- | --- |
| *(nothing)* | default speaker of the section or document |
| `J:` / `Jonas:` | explicit speaker |
| `"…"` | verbatim quote |
| `…?` | question |
| `=` | decision |
| `- [ ]` / `- [x]` | experiment / reviewed experiment |
| `!` | coachee insight |
| indentation | relation |
| `#tag` | theme |
| `> ` | material (§8) |
| `[AI]` | generated material (§8.2) |

## 8. Material

### 8.1 Embedded material

A blockquote (`> `) contains **material**, not conversation: a pasted document, a prepared framework, a job ad, a journal entry the coachee sent in advance. Tables and images are material as well, wherever they appear. Parsers MUST NOT count material as statements of the session. Comments on material MAY appear inside the blockquote with speaker markers.

Links to external material (dashboards, boards, documents) are allowed anywhere. Material that is large or shared with others SHOULD live in its own document and be linked from the log.

### 8.2 Generated material

Text produced by a tool — an AI summary, a transcript excerpt, an automated report — MUST be labelled so that it is never mistaken for something a participant said. Write `[AI]` (or `[generated]`) at the start of the section heading or blockquote:

```markdown
### [AI] Summary
> [AI] Mara wants to hand over scheduling and keep supplier contracts.
```

Parsers MUST treat everything under such a label as generated material.

## 9. Processing

A conforming parser produces, for every list item and paragraph inside a session:

| Field | Values |
| --- | --- |
| session | date, title, status, metadata (§5) |
| section | name, recognised standard section (§6.2), default speaker |
| text | without markers |
| speaker | tag, and whether it was **marked** or **inferred** |
| mode | `verbatim`, `note` |
| type | `note`, `question`, `insight`, `hypothesis`, `decision`, `experiment`, `review`, `material`, `generated` |
| owner | for experiments and decisions |
| parent | the item it is nested under |
| links | for reviews: the experiment reviewed |
| themes | `#tags` |

Everything inferred rather than marked SHOULD carry a confidence value. A structured record format for this output will be defined in a separate specification.

## 10. Privacy

Coachdown documents contain personal data: names, health, money, family, conflicts at work.

- Tools MUST NOT send Coachdown documents to third parties without the explicit consent of coach and coachee. This includes AI services.
- Exports for research MUST omit the text and keep only structure, types and themes. Removing names is not sufficient, because context identifies people.
- Reports to a sponsor SHOULD be limited to session metadata (§5.2) and topics the coachee has agreed to share.
- Real coaching notes MUST NOT be published as examples, even with names removed.

## 11. Editors and conversion *(informative)*

- **Plain Markdown** (any editor, Obsidian, VS Code): everything works as specified.
- **Google Docs**: the "Meeting notes" building block creates headings like `Mar 10, 2026 | Mara and Jonas` with a calendar link — a valid session heading (§5.1). Checklists become task list items on export. Front matter can be replaced by an `About this log` section (§3.2). See [`docs/google-docs.md`](docs/google-docs.md).
- **Converters** from other formats SHOULD normalise their output to plain Markdown lists. Note that some Google Docs exports render every indented list item as a blockquote (`- > text`); converters MUST remove these artificial blockquotes, otherwise all content would be read as material (§8.1).

## 12. Versioning

The specification follows semantic versioning. Minor versions add markers, sections or recognised aliases; documents written for an earlier minor version remain valid. Changes that would make existing documents mean something different require a new major version. All changes are listed in the [changelog](CHANGELOG.md).

## 13. Open questions

- Marker for scaling values (`7/10`) and emotions
- Linking topics across sessions beyond experiments
- A minimal structured record format (YAML) for parser output
- Localised standard section names beyond English and German
