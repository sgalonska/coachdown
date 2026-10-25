# Coachdown in Google Docs

> Full specification: https://github.com/sgalonska/coachdown/blob/main/SPEC.md · This guide covers Coachdown **0.2.1**.

Many coaches keep one shared Google Doc per coachee. Coachdown works there with a few adjustments. Menu names below may differ slightly depending on your Google Docs version and language.

## Set up the document

1. Create a new document per engagement and name it, for example, `Mara & Jonas – Coaching Log`.
2. Put the **header note** at the very top, as the first line:

   > This log uses **Coachdown 0.2.1** — markers and rules: https://github.com/sgalonska/coachdown/blob/main/SPEC.md

3. YAML front matter is awkward in Google Docs. Use an **About this log** section instead (spec §3.2):

   ```markdown
   ## About this log
   - coachdown: 0.2.1.1
   - participants: J = coach (Jonas), M = coachee (Mara)
   - order: newest-first
   ```

4. Add the engagement sections you need — Goals, Context, Agreements, Backlog, Progress, Glossary — above the first session.

If Markdown is enabled in Google Docs (Tools → Preferences → *Enable Markdown*), you can paste the content of [`templates/engagement.coach.md`](../templates/engagement.coach.md) with *Paste from Markdown*.

## Sessions

The **Meeting notes** building block (type `@meeting notes` or use Insert → Building blocks) creates a heading like:

```markdown
## Mar 10, 2026 | Mara and Jonas
```

This is a valid Coachdown session heading: it starts with a date (spec §5.1), and the calendar link after `|` is treated as metadata. Insert new meeting notes **above** the previous session to keep the log newest first.

Google Docs puts session headings and section headings such as "Discussion" on the same heading level. That is fine — in Coachdown every heading that does not start with a date is a section (spec §6.1).

## Markers

- Speaker tags, `!`, `=`, quotation marks and `#tags` are plain text and work as they are.
- Use Google Docs **checklists** for experiments. They are exported as task list items (`- [ ]`, `- [x]`).
- Use indentation (Tab) for relations, as you are used to.
- Paste material as a **block quote** or into a separate document and link to it.
- Smart chips (people, dates) are exported as text; prefer plain text for speaker tags.

## Exporting

Use File → Download → *Markdown (.md)* to get a Coachdown file. Some export routes wrap every indented list item in a block quote (`- > text`). Tools that read Coachdown from Google Docs must remove these artificial block quotes (spec §11); when in doubt, check a few lines of the export.

## Sharing and privacy

The shared doc is the coachee's record as much as yours. Agree with the coachee who may read it, whether AI tools may process it, and keep private reflections — if any — in a separate document. See spec §10.
