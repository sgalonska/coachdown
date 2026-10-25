# Coachdown

> Full specification: https://github.com/sgalonska/coachdown/blob/main/SPEC.md · Current version: **0.2 (draft)**

**A tiny Markdown convention for taking notes during coaching sessions — readable by humans, parseable by machines.**

Coaching conversations are unstructured. Names, anecdotes, emotions, half-finished thoughts — everything comes up, and nobody structures a conversation while it is happening. Coachdown does not try to change that. It adds a handful of optional markers to the notes a coach already takes, so that later a parser or an AI agent can tell with confidence:

- **who said it** — coach or coachee,
- **what kind of statement it is** — question, verbatim quote, insight, decision, experiment,
- **what it relates to** — indentation,
- **which session it belongs to** — a dated heading.

Everything you do not mark is still valid. It is simply interpreted later.

```markdown
## 2026-03-10 · Session 4

### Since last time
- the new shop opened, the first weekend sold out

### Discussion
- What made that possible?
  - ! "I let the team decide the opening hours – and they were right"
- J: That is the first decision you describe without checking it twice
- = the shift leads plan the April schedule

### Experiments
- [ ] Ask both shift leads what they would change next
```

## Why

Coachdown takes load off the coach: a few characters while you write, so a script or an AI agent can do the sorting afterwards. Because the log is plain Markdown that coach and coachee share, it also makes privacy-friendly analysis possible: patterns across sessions, without reading what was said. Read the [full story](docs/story.md).

**What exists today:** the writing format, a guide, a template, examples, the reference parser and an [Obsidian plugin](tools/obsidian/) with a live dashboard. **What doesn't yet:** plugins for other editors, AI-assisted attribution and deeper analysis. That's where you come in.

## Quick start

1. Copy [`templates/engagement.coach.md`](templates/engagement.coach.md) and replace the names and tags.
2. For each session, add a dated heading **at the top** of the sessions — newest first.
3. Write as you always do. Use a marker only where it removes doubt.

New to the format? Read the [writing guide](docs/writing-guide.md). Working in Google Docs? See [Coachdown in Google Docs](docs/google-docs.md).

## The markers

| Marker | Meaning | Example |
| --- | --- | --- |
| *(nothing)* | Default speaker of the section or document — usually the coachee | `- the opening went well` |
| `"…"` | Verbatim quote | `- "I don't want to run it like my father"` |
| `…?` | Question — by the coach, except in the coachee's own sections | `- What would you need to let go?` |
| `J:` / `Jonas:` | Explicit speaker, by tag or name declared in the front matter | `- J: notice how often you say "must"` |
| `!` | Insight of the coachee | `- ! I check everything because I don't trust myself` |
| `=` | Decision | `- = the shift leads plan April` |
| `- [ ]` | Experiment / action point (owner: coachee unless marked) | `- [ ] J: send the delegation sheet` |
| `- [x]` + `learned:` | Reviewed experiment | `- [x] … ` / `  - learned: …` |
| indentation | Relation: answer, elaboration, reaction | |
| `> ` | Material — a pasted document, a prepared text, not conversation | `> **Notes before the session** …` |
| `[AI]` | Generated material, never a participant's words | `### [AI] Summary` |
| `### J: Title` | Section default: everything in this section is by `J` unless marked | `### J: Circle of influence` |
| `### Perspective: …` | The reported view of someone who is not present | `### Perspective: her father` |
| `#tag` | Theme | `#handover` |

## Standard sections

Most coaching sessions follow the same few steps. Coachdown recognises them — in English and German — and gives each a sensible default, so you need even fewer markers:

| Section | Default speaker | Items are |
| --- | --- | --- |
| Since last time | coachee | notes |
| Agenda | coachee | notes |
| Review | coachee | reviewed experiments |
| Discussion | document default | notes |
| Observations | coach | notes |
| Decisions | document default | decisions |
| Experiments | coachee (owner) | experiments |
| Summary | coach | notes |
| Feedback | coachee | feedback on the coaching |

Aliases such as *Updates*, *Letzte Wochen*, *Action Points*, *Key Insights* or *Todos from last time* are listed in the [specification](SPEC.md#62-standard-sections).

## One log per engagement

A Coachdown document is the rolling log of one coaching engagement:

```markdown
---
coachdown: 0.2
spec: https://github.com/sgalonska/coachdown/blob/main/SPEC.md
participants:
  J: coach
  M: coachee
default_speaker: coachee
order: newest-first
---

> This log uses **Coachdown 0.2** — markers and rules: https://github.com/sgalonska/coachdown/blob/main/SPEC.md

# Mara & Jonas – Coaching Log

## Goals
## Progress
## Backlog

---

## 2026-03-24 · Session 5
…

---

## 2026-03-10 · Session 4
…
```

- The **header note** tells everyone who opens the log where the rules are.
- **Engagement sections** — Goals, Context, Agreements, Backlog, Progress, Resources, Glossary — stand above the sessions and are kept up to date.
- **Sessions** go on top, so the latest one is the first thing you see and you scroll down into the past.

## From notes to structure

Coachdown is the **writing format**. Because the markers are explicit, a parser or an AI agent can turn a log into a structured record: one entry per statement with speaker, type, relations and a confidence value for everything it had to infer. That record is what growth views and anonymised analysis build on. The [reference parser](tools/obsidian/src/parser.ts) does exactly this, as a dependency-free TypeScript module with a command-line tool. See [Processing](SPEC.md#9-processing).

## Tools

**[Coachdown for Obsidian](tools/obsidian/)** shows all your logs in one dashboard: sessions, insights, decisions and open experiments. It adds new sessions on top of a log with last time's open experiments already in *Review*, and copies any log as structured JSON. It runs entirely locally.

![The Coachdown dashboard in Obsidian](tools/obsidian/docs/dashboard.png)

The same folder contains the reference parser and a command-line tool:

```bash
cd tools/obsidian && npm install && npm run build
node dist/cli.cjs ../../examples/fictional-engagement.coach.md --insights
```

Setup and usage: [`tools/obsidian/README.md`](tools/obsidian/README.md).

## Privacy

Coaching notes are among the most personal documents there are. Coachdown files contain names, health information, money and family matters.

- **Never commit real session notes to a public repository.** The `.gitignore` here ignores all `.coach.md` files except examples and templates.
- Do not send a log to an AI service or any other third party without the consent of coach and coachee.
- Anonymised research exports contain structure and tags only — removing names is not enough.
- All examples in this repository are fictional.

## Repository

| File | Content |
| --- | --- |
| [`SPEC.md`](SPEC.md) | The specification |
| [`CHANGELOG.md`](CHANGELOG.md) | Changes between versions |
| [`docs/story.md`](docs/story.md) | Why Coachdown exists |
| [`docs/writing-guide.md`](docs/writing-guide.md) | How to take notes with Coachdown during a live session |
| [`docs/google-docs.md`](docs/google-docs.md) | Using Coachdown in Google Docs |
| [`templates/engagement.coach.md`](templates/engagement.coach.md) | Empty log to start a new engagement |
| [`examples/`](examples/README.md) | Fictional logs: minimal, complete, Google Docs style, pair coaching, team interviews, German |
| [`tools/obsidian/`](tools/obsidian/README.md) | Obsidian plugin, reference parser and command-line tool |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to take part |

## Roadmap

- [x] v0.1 writing format
- [x] v0.2 standard sections, decisions, reviews, session metadata, Google Docs support
- [x] Reference parser: Coachdown → structured record ([`tools/obsidian`](tools/obsidian/))
- [x] Obsidian plugin with dashboard, new-session command and JSON export
- [ ] Structured record specification
- [ ] Agent prompt for inferring unmarked attribution
- [ ] Growth views: ownership of conclusions, insights per session, theme evolution
- [ ] Anonymised export profile for research

## License

- Specification and documentation: [CC BY 4.0](LICENSE-SPEC.md)
- Code (parsers, tools): [MIT](LICENSE)

Coachdown was started by Sebastian Galonska ([cto.berlin](https://cto.berlin)).
