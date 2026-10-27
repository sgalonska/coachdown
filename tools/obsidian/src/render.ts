/**
 * Renders a Coachdown dashboard into a DOM element.
 * Uses plain DOM APIs only, so it works in Obsidian views, code blocks and tests.
 */
import { openExperiments, speakerLabel, summarise, type CoachdownDocument, type Item } from './parser';

export type Panel = 'sessions' | 'insights' | 'hypotheses' | 'decisions' | 'experiments';
export const ALL_PANELS: Panel[] = ['sessions', 'insights', 'decisions', 'experiments'];

export interface LogInput {
  name: string;
  path: string;
  doc: CoachdownDocument;
}

export interface RenderOptions {
  panels: Panel[];
  /** Maximum rows per panel; 0 = no limit. */
  limit: number;
  /** Called when a row is clicked. */
  onOpen?: (path: string, line: number) => void;
}

const el = <K extends keyof HTMLElementTagNameMap>(parent: HTMLElement, tag: K, cls?: string, text?: string) => {
  const node = parent.ownerDocument.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  parent.appendChild(node);
  return node;
};

const dateOf = (doc: CoachdownDocument, item: Item) => (item.session === null ? '' : doc.sessions[item.session].date);
const newestFirst = (doc: CoachdownDocument) => (a: Item, b: Item) => dateOf(doc, b).localeCompare(dateOf(doc, a)) || a.line - b.line;

function table(parent: HTMLElement, headers: string[], rows: { cells: string[]; line: number }[], log: LogInput, opts: RenderOptions, empty: string) {
  if (rows.length === 0) {
    el(parent, 'p', 'coachdown-empty', empty);
    return;
  }
  const t = el(parent, 'table', 'coachdown-table');
  const head = el(el(t, 'thead'), 'tr');
  for (const h of headers) el(head, 'th', undefined, h);
  const body = el(t, 'tbody');
  const shown = opts.limit > 0 ? rows.slice(0, opts.limit) : rows;
  for (const row of shown) {
    const tr = el(body, 'tr');
    row.cells.forEach((c) => el(tr, 'td', undefined, c));
    if (opts.onOpen) {
      tr.classList.add('coachdown-clickable');
      tr.tabIndex = 0;
      const open = () => opts.onOpen!(log.path, row.line);
      tr.addEventListener('click', open);
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    }
  }
  if (shown.length < rows.length) el(parent, 'p', 'coachdown-more', `+ ${rows.length - shown.length} more`);
}

export function renderLog(container: HTMLElement, log: LogInput, opts: RenderOptions) {
  const { doc } = log;
  const box = el(container, 'section', 'coachdown-log');
  const header = el(box, 'header', 'coachdown-log-header');
  const title = el(header, 'h3', 'coachdown-log-title', log.name);
  if (opts.onOpen) {
    title.classList.add('coachdown-clickable');
    title.addEventListener('click', () => opts.onOpen!(log.path, 1));
  }
  const held = doc.sessions.filter((s) => s.status === 'held');
  const last = [...held].sort((a, b) => b.date.localeCompare(a.date))[0];
  el(header, 'span', 'coachdown-log-meta', `${held.length} session${held.length === 1 ? '' : 's'}${last ? ` · last ${last.date}` : ''}`);

  for (const panel of opts.panels) {
    const sec = el(box, 'div', `coachdown-panel coachdown-panel-${panel}`);
    if (panel === 'sessions') {
      el(sec, 'h4', undefined, 'Sessions');
      const rows = summarise(doc).reverse().map((s) => ({
        line: s.session.line,
        cells: [
          s.session.date,
          s.session.status === 'held' ? s.session.title || s.session.type : `${s.session.title} (${s.session.status})`.trim(),
          String(s.questions),
          String(s.insights),
          String(s.decisions),
          String(s.experiments),
          String(s.reviewed),
        ],
      }));
      table(sec, ['Date', 'Session', '?', '!', '=', '[ ]', 'Reviewed'], rows, log, opts, 'No sessions yet.');
    }
    if (panel === 'insights' || panel === 'hypotheses') {
      const type = panel === 'insights' ? 'insight' : 'hypothesis';
      el(sec, 'h4', undefined, panel === 'insights' ? 'Insights' : 'Coach hypotheses');
      const rows = doc.items.filter((i) => i.type === type).sort(newestFirst(doc))
        .map((i) => ({ line: i.line, cells: [dateOf(doc, i), speakerLabel(doc, i), i.text] }));
      table(sec, ['Date', 'Said by', panel === 'insights' ? 'Insight' : 'Hypothesis'], rows, log, opts, panel === 'insights' ? 'No insights marked with !! yet.' : 'No coach hypotheses yet.');
    }
    if (panel === 'decisions') {
      el(sec, 'h4', undefined, 'Decisions');
      const rows = doc.items.filter((i) => i.type === 'decision').sort(newestFirst(doc))
        .map((i) => ({ line: i.line, cells: [dateOf(doc, i), i.text] }));
      table(sec, ['Date', 'Decision'], rows, log, opts, 'No decisions marked with = yet.');
    }
    if (panel === 'experiments') {
      el(sec, 'h4', undefined, 'Open experiments');
      const rows = openExperiments(doc).sort(newestFirst(doc))
        .map((i) => ({ line: i.line, cells: [dateOf(doc, i), i.owner ? speakerLabel(doc, { speaker: i.owner }) : '', i.text] }));
      table(sec, ['Since', 'Owner', 'Experiment'], rows, log, opts, 'No open experiments.');
    }
  }
}

export function renderDashboard(container: HTMLElement, logs: LogInput[], opts: RenderOptions) {
  container.classList.add('coachdown-dashboard');
  if (logs.length === 0) {
    el(container, 'p', 'coachdown-empty', 'No Coachdown logs found. Name a note *.coach.md or add `coachdown: 0.3` to its front matter.');
    return;
  }
  for (const log of logs) renderLog(container, log, opts);
}

/** Parses the options of a ```coachdown code block. */
export function parseBlockOptions(source: string): { panels: Panel[]; source: string; limit: number } {
  const get = (key: string) => source.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, 'mi'))?.[1].trim();
  const known: Panel[] = ['sessions', 'insights', 'hypotheses', 'decisions', 'experiments'];
  const show = get('show');
  const panels = show ? show.split(/[,\s]+/).map((s) => s.toLowerCase()).filter((s): s is Panel => known.includes(s as Panel)) : ALL_PANELS;
  return { panels: panels.length ? panels : ALL_PANELS, source: get('source') ?? 'auto', limit: Number(get('limit') ?? 0) || 0 };
}
