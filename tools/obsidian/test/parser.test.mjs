// Run with: npm test  (builds first, then runs Node's built-in test runner)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { matchLeadingDate, openExperiments, parseCoachdown, planNewSession, summarise } from '../dist/coachdown.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const example = (name) => readFileSync(join(here, '../../../examples', `${name}.coach.md`), 'utf8');
const find = (doc, text) => doc.items.find((i) => i.text.includes(text));

test('dates in all supported formats', () => {
  assert.equal(matchLeadingDate('2026-03-10 · Session 4').date, '2026-03-10');
  assert.equal(matchLeadingDate('Mar 10, 2026 | Nora and Jonas').date, '2026-03-10');
  assert.equal(matchLeadingDate('10 March 2026').date, '2026-03-10');
  assert.equal(matchLeadingDate('10. März 2026').date, '2026-03-10');
  assert.equal(matchLeadingDate('10.03.2026 · Sitzung 5').date, '2026-03-10');
  assert.equal(matchLeadingDate('10.03.26').date, '2026-03-10');
  assert.equal(matchLeadingDate('Discussion'), null);
  assert.equal(matchLeadingDate('03/10/2026'), null);
});

test('minimal log without front matter', () => {
  const doc = parseCoachdown(example('minimal'));
  assert.equal(doc.sessions.length, 1);
  assert.equal(find(doc, 'What would your team say').type, 'question');
  assert.equal(find(doc, 'What would your team say').speaker, 'coach');
  assert.equal(find(doc, "I don't delegate").type, 'insight');
  assert.equal(find(doc, "I don't delegate").speaker, 'coachee');
  assert.equal(find(doc, "That's true for the first time").speaker, 'coach');
  assert.equal(find(doc, 'Hand the weekly report').type, 'experiment');
});

test('complete fictional engagement', () => {
  const doc = parseCoachdown(example('fictional-engagement'));
  assert.deepEqual(doc.participants.map((p) => [p.tag, p.role]), [['J', 'coach'], ['M', 'coachee'], ['F', 'other']]);
  assert.equal(doc.sessions.length, 4);
  assert.equal(doc.sessions.find((s) => s.date === '2026-04-07').status, 'cancelled');
  assert.equal(doc.sessions.find((s) => s.date === '2026-03-24').metadata.time, '14:00–15:00');

  // Agenda belongs to the coachee, including questions.
  const agendaQuestion = find(doc, 'How do I tell Tom');
  assert.equal(agendaQuestion.type, 'question');
  assert.equal(agendaQuestion.speaker, 'M');

  // Unmarked questions in the discussion are the coach's.
  assert.equal(find(doc, 'What stops you from saying something').speaker, 'J');
  // Insight and explicit coach line
  assert.equal(find(doc, 'I treat him like the owner').type, 'insight');
  assert.equal(find(doc, 'You describe two roles').speaker, 'J');
  assert.equal(find(doc, 'You describe two roles').speakerMarked, true);
  // Third-party quote
  const third = find(doc, "Ask Mara, she's the boss now");
  assert.equal(third.speaker, 'other');
  assert.equal(third.speakerName, 'her father, according to a shift lead');
  // Perspective section
  assert.equal(find(doc, 'worries that the shops lose').speakerName, 'her father');
  // Decisions section
  assert.equal(find(doc, 'the shift leads plan May as well').type, 'decision');
  // Section default `### J: Closing`, explicit M: overrides it
  assert.equal(find(doc, 'What is one small step').speaker, 'J');
  assert.equal(find(doc, 'he is more ready to let go').speaker, 'M');
  // Scaling answers marked M: inside a coach section
  assert.equal(find(doc, '4 last month, 6 today').speaker, 'M');
  // Review with learned line
  const review = doc.items.find((i) => i.type === 'review');
  assert.equal(review.done, true);
  assert.match(review.learned, /bothered her less/);
  // Material and generated text are not statements
  assert.equal(find(doc, 'I opened the new shop').type, 'material');
  assert.equal(find(doc, 'links her constant checking').type, 'generated');
  // Engagement backlog
  assert.equal(find(doc, 'supplier contracts – renegotiate').type, 'backlog');
});

test('open experiments are closed by later reviews', () => {
  const doc = parseCoachdown(example('fictional-engagement'));
  const open = openExperiments(doc).map((i) => i.text);
  assert.ok(!open.some((t) => t.startsWith('Let the shift leads plan the April schedule')));
  assert.ok(open.some((t) => t.startsWith('Agree with her father')));
  assert.ok(open.some((t) => t.startsWith('send the "levels of delegation"')));
});

test('Google Docs style: About this log, names as tags, same-level headings', () => {
  const doc = parseCoachdown(example('google-docs-style'));
  assert.deepEqual(doc.participants.map((p) => [p.tag, p.role, p.name]), [['J', 'coach', 'Jonas'], ['N', 'coachee', 'Nora']]);
  assert.equal(doc.sessions.length, 3);
  assert.equal(doc.sessions.find((s) => s.date === '2026-04-07').status, 'cancelled');
  assert.equal(find(doc, 'How do I deal with the senior nurse').speaker, 'N');
  assert.equal(find(doc, 'Could she own the swap rules').speaker, 'J');
  assert.equal(find(doc, 'Talk to the senior nurse').type, 'experiment');
});

test('pair coaching keeps both coachees apart', () => {
  const doc = parseCoachdown(example('pair-coaching'));
  assert.equal(find(doc, 'giving in is not the same as agreeing').speaker, 'T');
  assert.equal(find(doc, 'giving in is not the same as agreeing').type, 'insight');
  assert.equal(find(doc, 'held the design review without Tom').speaker, 'L');
});

test('interview sessions default to the interviewee', () => {
  const doc = parseCoachdown(example('team-interviews'));
  const kim = doc.sessions.find((s) => s.title === 'Interview Kim');
  assert.equal(kim.type, 'interview');
  const items = doc.items.filter((i) => i.session === kim.index);
  assert.equal(items.find((i) => i.text.startsWith('second year')).speaker, 'K');
  assert.equal(items.find((i) => i.text.startsWith('What do you need')).speaker, 'J');
});

test('German log with German section names', () => {
  const doc = parseCoachdown(example('deutsch'));
  assert.equal(doc.sessions.length, 3);
  assert.equal(doc.sessions.find((s) => s.date === '2026-11-26').status, 'cancelled');
  assert.equal(find(doc, 'Wie gehe ich damit um').speaker, 'S');
  assert.equal(find(doc, 'großes Pflichtgefühl').speaker, 'J');
  assert.equal(find(doc, 'Ich springe ein, damit niemand enttäuscht ist – auch').type, 'insight');
  assert.equal(doc.items.find((i) => i.type === 'review').learned, 'vorbereitet sein hilft mehr als gut formulieren');
  const s = summarise(doc).find((x) => x.session.date === '2026-12-10');
  assert.equal(s.decisions, 1);
  assert.equal(s.experiments, 1);
});

test('Google Docs export artefacts (- > text) are list items, not material', () => {
  const doc = parseCoachdown('## 2026-01-15\n\n- > the team grew\n  - > "I can let go"!!\n');
  assert.equal(doc.items.length, 2);
  assert.equal(doc.items[1].type, 'insight');
  assert.equal(doc.items[1].parent, 0);
});

test('new session goes on top and carries open experiments into Review', () => {
  const text = example('fictional-engagement');
  const plan = planNewSession(text, '2026-04-21');
  assert.equal(plan.number, 5);
  assert.ok(plan.insert.includes('## 2026-04-21 · Session 5'));
  assert.ok(plan.insert.includes('- [ ] Agree with her father'));
  assert.ok(plan.insert.includes('- [ ] J: send the "levels of delegation" sheet'));
  const lines = text.split('\n');
  const after = [...lines.slice(0, plan.line), ...plan.insert.split('\n'), ...lines.slice(plan.line)].join('\n');
  const doc = parseCoachdown(after);
  assert.equal(doc.sessions[0].date, '2026-04-21');
  assert.equal(doc.sessions.length, 5);
});

test('trailing !! marks an insight; a leading ! is plain text', () => {
  const doc = parseCoachdown('---\nparticipants:\n  J: coach\n  M: coachee\n---\n\n## 2026-03-10 · Session 1\n\n- I check everything because I do not trust myself!!\n- J: Maybe control is the real topic here !! #control\n- Great news!!!\n- Plain note!\n- ! leading bang\n');
  const a = find(doc, 'I check everything');
  assert.equal(a.type, 'insight');
  assert.equal(a.text, 'I check everything because I do not trust myself');
  assert.equal(a.speaker, 'M');
  const b = find(doc, 'Maybe control');
  assert.equal(b.type, 'hypothesis');
  assert.equal(b.text.includes('!!'), false);
  assert.equal(find(doc, 'Great news').type, 'note');
  assert.equal(find(doc, 'Plain note').type, 'note');
  assert.equal(find(doc, 'leading bang').type, 'note');
});

test('?: marks an unidentified speaker', () => {
  const doc = parseCoachdown('# Log\n\n## 2026-03-10 · Session 1\n\n- ?: we should check the budget first\n- = ?: the launch moves to May\n- the coachee line\n');
  const line = find(doc, 'check the budget');
  assert.equal(line.speaker, 'unknown');
  assert.equal(line.speakerMarked, true);
  assert.equal(line.text, 'we should check the budget first');
  assert.equal(find(doc, 'launch moves').speaker, 'unknown');
  assert.equal(find(doc, 'launch moves').type, 'decision');
  assert.equal(find(doc, 'the coachee line').speaker, 'coachee');
});
