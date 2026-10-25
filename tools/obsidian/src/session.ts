import { openExperiments, parseCoachdown, roleOf } from './parser';

export interface SessionPlan {
  /** 0-based line where the block is inserted. */
  line: number;
  /** Text to insert at the start of that line. */
  insert: string;
  /** 0-based line where the cursor should go: the first empty bullet under "Since last time". */
  cursorLine: number;
  number: number;
  reviewCount: number;
}

/**
 * Plans a new session block for a Coachdown log: dated heading, standard
 * sections, and the open experiments copied into "Review" so they get asked about.
 * Respects `order: newest-first` (default) and `oldest-first`.
 */
export function planNewSession(text: string, today: string): SessionPlan {
  const doc = parseCoachdown(text);
  const lines = text.split('\n');
  const numbers = doc.sessions.map((s) => Number(s.title.match(/session\s+(\d+)/i)?.[1] ?? 0));
  const next = Math.max(doc.sessions.length, ...numbers, 0) + 1;

  const open = openExperiments(doc);
  const review = open.length
    ? open.map((i) => `- [ ] ${roleOf(doc, i.owner) === 'coach' && i.owner ? `${i.owner}: ` : ''}${i.text}`).join('\n')
    : '- ';

  const first = doc.sessions.length ? doc.sessions.reduce((a, b) => (a.line < b.line ? a : b)) : null;
  const hashes = first ? lines[first.line - 1].match(/^#+/)?.[0] ?? '##' : '##';
  const sub = '#'.repeat(Math.min(6, hashes.length + 1));
  const block = `---\n\n${hashes} ${today} · Session ${next}\n\n${sub} Since last time\n\n- \n\n${sub} Review\n\n${review}\n\n${sub} Discussion\n\n- \n\n${sub} Experiments\n\n- [ ] \n\n`;

  let line: number;
  let prefix = '';
  if (doc.order === 'oldest-first' || !first) {
    line = lines.length;
    if (lines[lines.length - 1]?.trim() !== '') prefix = '\n\n';
    else if (lines.length > 1 && lines[lines.length - 2]?.trim() !== '') prefix = '\n';
  } else {
    line = first.line - 1;
    // Insert above the thematic break that precedes the first session, if there is one.
    let k = line - 1;
    while (k >= 0 && lines[k].trim() === '') k--;
    if (k >= 0 && /^\s*(---|\*\*\*|___)\s*$/.test(lines[k])) line = k;
  }
  const prefixLines = prefix.split('\n').length - 1;
  return { line, insert: prefix + block, cursorLine: line + prefixLines + 6, number: next, reviewCount: open.length };
}
