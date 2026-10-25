/**
 * Command-line interface for the Coachdown parser.
 *
 *   node dist/cli.cjs <file.coach.md> [--summary | --insights | --experiments | --decisions] [--compact]
 *
 * Without a flag it prints the full structured record as JSON.
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { openExperiments, parseCoachdown, speakerLabel, summarise, type CoachdownDocument } from './parser';

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith('--'));
const flag = (name: string) => args.includes(`--${name}`);

if (files.length === 0 || flag('help')) {
  console.log(`Usage: coachdown <file.coach.md> [options]

Options:
  (none)          print the structured record as JSON
  --summary       one line per session with counts
  --insights      list all coachee insights with their session
  --experiments   list open experiments
  --decisions     list all decisions
  --compact       JSON without indentation`);
  process.exit(files.length === 0 ? 1 : 0);
}

const dateOf = (doc: CoachdownDocument, session: number | null) => (session === null ? '—' : doc.sessions[session].date);

for (const file of files) {
  const doc = parseCoachdown(readFileSync(file, 'utf8'));
  if (files.length > 1) console.log(`\n# ${basename(file)}`);

  if (flag('summary')) {
    console.log('date        status     items  coach  coachee  ?   !   =   [ ]  reviewed');
    for (const s of summarise(doc)) {
      const row = [
        s.session.date,
        s.session.status.padEnd(9),
        String(s.items).padStart(5),
        String(s.byRole.coach ?? 0).padStart(6),
        String(s.byRole.coachee ?? 0).padStart(8),
        String(s.questions).padStart(3),
        String(s.insights).padStart(3),
        String(s.decisions).padStart(3),
        String(s.experiments).padStart(4),
        String(s.reviewed).padStart(9),
      ];
      console.log(row.join('  '));
    }
  } else if (flag('insights')) {
    for (const i of doc.items.filter((x) => x.type === 'insight')) console.log(`${dateOf(doc, i.session)}  ${speakerLabel(doc, i).padEnd(10)}  ${i.text}`);
  } else if (flag('experiments')) {
    for (const i of openExperiments(doc)) console.log(`${dateOf(doc, i.session)}  ${(i.owner ?? '').padEnd(10)}  ${i.text}`);
  } else if (flag('decisions')) {
    for (const i of doc.items.filter((x) => x.type === 'decision')) console.log(`${dateOf(doc, i.session)}  ${i.text}`);
  } else {
    console.log(JSON.stringify(doc, null, flag('compact') ? 0 : 2));
  }
}
