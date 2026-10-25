# Changelog

> Full specification: https://github.com/sgalonska/coachdown/blob/main/SPEC.md

All notable changes to the Coachdown specification.

## 0.2.1 — Draft

### Changed
- The **insight marker is now `!!` at the end of the item**, replacing the leading `!` (§7.6). You only know something was an insight after it has been said, so the marker can be added without moving the cursor back. A leading `!` no longer has a meaning.

## 0.2 — Draft

Shaped by years of coaching experience.

### Added
- **Header note** pointing to the specification in every document (§3.1) and a `spec` key in the front matter.
- **Participants** with names and aliases: `Jonas:` is recognised as `J:` (§3.3). Several coachees per engagement; roles `sponsor`, `observer`, `other`.
- **Recommended engagement sections**: About this log, Goals, Context, Agreements, Backlog, Progress, Resources, Glossary, Contact (§4).
- **Progress** section as a human-written growth story (§4).
- **Session metadata** line: `time`, `type`, `participants`, `topics` (§5.2).
- **Session status** such as `(cancelled)` (§5.1).
- **Interview sessions** (`type: interview`) whose default speaker is the interviewed person (§5.2).
- **More examples**: minimal log, Google Docs style, pair coaching, team interviews, German log.
- **Standard session sections** with built-in defaults — Since last time, Agenda, Review, Discussion, Observations, Decisions, Experiments, Summary, Feedback — in English and German aliases (§6.2).
- **Perspective sections** for views of people who are not present (§6.4).
- **Decision marker** `=` (§7.4).
- **Review of experiments** with `learned:` lines (§7.5).
- **Generated material** label `[AI]` (§8.2).
- Informative notes on Google Docs and converters (§11).

### Changed
- A session heading may have **any heading level** and several **date formats** (ISO, `Mar 10, 2026`, `10 Mar 2026`, `10.03.2026`) (§5.1).
- Every other heading inside a session is a section, regardless of level (§6.1).
- Unmarked questions are the coach's **except** in sections where the coachee is the default speaker (§7.3).
- Tables and images are material (§8.1).
- First-person notes without quotation marks are paraphrases, not verbatim quotes (§7.1).

## 0.1 — Draft

- Initial writing format: speaker tags, quotes, questions, insights, experiments, indentation, blockquoted material, section default, themes, newest-first logs.
