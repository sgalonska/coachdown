/**
 * Coachdown parser.
 *
 * Turns a Coachdown document (Markdown) into a structured record:
 * sessions, sections and one item per list item or paragraph, each with a
 * speaker, a type and a parent. Anything that was inferred rather than marked
 * is flagged with `speakerMarked: false`.
 *
 * Specification: https://github.com/sgalonska/coachdown/blob/main/SPEC.md
 *
 * This module has no dependencies and runs in Obsidian, Node.js and browsers.
 */

export type Role = 'coach' | 'coachee' | 'sponsor' | 'observer' | 'other';

export interface Participant {
  /** The tag typed in notes, e.g. `J`. For documents without participants: `coach` / `coachee`. */
  tag: string;
  role: Role;
  name?: string;
  aliases: string[];
}

export type ItemType =
  | 'note'
  | 'question'
  | 'insight'
  | 'hypothesis'
  | 'decision'
  | 'experiment'
  | 'review'
  | 'backlog'
  | 'material'
  | 'generated';

export type SectionKind =
  | 'since-last-time'
  | 'agenda'
  | 'review'
  | 'discussion'
  | 'observations'
  | 'decisions'
  | 'experiments'
  | 'summary'
  | 'feedback'
  | 'perspective'
  | 'other';

export interface Section {
  name: string;
  level: number;
  line: number;
  kind: SectionKind;
  /** Default speaker inside this section, if the section sets one. */
  defaultSpeaker?: string;
  generated: boolean;
}

export interface Session {
  index: number;
  /** ISO date `YYYY-MM-DD`. */
  date: string;
  heading: string;
  title: string;
  status: 'held' | 'cancelled' | 'postponed';
  type: string;
  line: number;
  metadata: Record<string, string>;
  participants?: string[];
}

export interface Item {
  id: number;
  /** 1-based line number in the source. */
  line: number;
  /** Index into `sessions`, or `null` for engagement sections. */
  session: number | null;
  section: string | null;
  sectionKind: SectionKind | null;
  text: string;
  raw: string;
  speaker: string | null;
  /** Name of a non-participant speaker, e.g. for `"…" — her father`. */
  speakerName?: string;
  speakerMarked: boolean;
  mode: 'verbatim' | 'note';
  type: ItemType;
  owner?: string;
  done?: boolean;
  learned?: string;
  /** For reviewed experiments with an explicit date: `- [x] (2026-03-10) …`. */
  reviewOf?: string;
  parent: number | null;
  depth: number;
  themes: string[];
}

export interface CoachdownDocument {
  version?: string;
  participants: Participant[];
  defaultSpeaker: string;
  order: 'newest-first' | 'oldest-first';
  engagementSections: { name: string; line: number }[];
  sessions: Session[];
  items: Item[];
  warnings: string[];
}

// ---------------------------------------------------------------- dates

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, januar: 1, jänner: 1,
  feb: 2, february: 2, februar: 2,
  mar: 3, march: 3, mär: 3, märz: 3, maerz: 3, mrz: 3,
  apr: 4, april: 4,
  may: 5, mai: 5,
  jun: 6, june: 6, juni: 6,
  jul: 7, july: 7, juli: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, okt: 10, oktober: 10,
  nov: 11, november: 11,
  dec: 12, december: 12, dez: 12, dezember: 12,
};
const MONTH_RE = '([A-Za-zÄÖÜäöü]{3,9})';

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const validDate = (y: number, m: number, d: number) => m >= 1 && m <= 12 && d >= 1 && d <= 31 && y > 1900;

/** If `text` starts with a supported date, returns the ISO date and the rest of the text. */
export function matchLeadingDate(text: string): { date: string; rest: string } | null {
  const t = text.replace(/^[*_~\s]+/, '');
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})\b/);
  if (m && validDate(+m[1], +m[2], +m[3])) return { date: iso(+m[1], +m[2], +m[3]), rest: t.slice(m[0].length) };
  m = t.match(new RegExp(`^${MONTH_RE}\\.? (\\d{1,2}),? (\\d{4})\\b`));
  if (m && MONTHS[m[1].toLowerCase()] && validDate(+m[3], MONTHS[m[1].toLowerCase()], +m[2])) {
    return { date: iso(+m[3], MONTHS[m[1].toLowerCase()], +m[2]), rest: t.slice(m[0].length) };
  }
  m = t.match(new RegExp(`^(\\d{1,2})\\.? ${MONTH_RE}\\.? (\\d{4})\\b`));
  if (m && MONTHS[m[2].toLowerCase()] && validDate(+m[3], MONTHS[m[2].toLowerCase()], +m[1])) {
    return { date: iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]), rest: t.slice(m[0].length) };
  }
  m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})(?!\d)/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    if (validDate(y, +m[2], +m[1])) return { date: iso(y, +m[2], +m[1]), rest: t.slice(m[0].length) };
  }
  return null;
}

// ---------------------------------------------------------------- sections

const SECTION_ALIASES: Record<Exclude<SectionKind, 'perspective' | 'other'>, string[]> = {
  'since-last-time': ['since last time', 'check-in', 'check in', 'updates', 'update', 'letzte wochen', 'what happened since we last spoke', 'what happened during the last weeks', 'things that happened over the last weeks', 'seit dem letzten mal'],
  agenda: ['agenda', 'topics', 'themen', 'what would you like to discuss', 'input before the session', 'input before the meeting'],
  review: ['review', 'rückblick', 'todos from last time', 'todo from last time', 'previous action points', 'check on previous action items', 'action points from last time'],
  discussion: ['discussion', 'diskussion', 'talking points', 'discussion points', 'besprochene themen', 'notes', 'notizen'],
  observations: ['observations', 'key insights', 'beobachtungen', 'suggestions', 'recommended actions', 'handlungshinweise'],
  decisions: ['decisions', 'decision', 'decisions made', 'entscheidungen', 'entscheidung'],
  experiments: ['experiments', 'experiment', 'action points', 'action point', 'action items', 'todos', 'todo', 'aufgaben', 'next steps', 'nächste schritte'],
  summary: ['summary', 'key takeaways', 'zusammenfassung', 'quintessenz', 'learnings'],
  feedback: ['feedback', 'feedback on the session', 'stop doing', 'start doing'],
};

const SECTION_DEFAULT_ROLE: Partial<Record<SectionKind, Role>> = {
  'since-last-time': 'coachee',
  agenda: 'coachee',
  review: 'coachee',
  feedback: 'coachee',
  observations: 'coach',
  summary: 'coach',
};

const normaliseHeading = (s: string) =>
  s.replace(/[*_`]/g, '').replace(/[:?.!]+\s*$/, '').replace(/\s+/g, ' ').trim().toLowerCase();

function sectionKindOf(name: string): SectionKind {
  const n = normaliseHeading(name);
  for (const [kind, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.includes(n)) return kind as SectionKind;
  }
  return 'other';
}

// ---------------------------------------------------------------- front matter

function parseInlineObject(value: string): Record<string, string | string[]> {
  // `{ role: coach, name: Jonas, aliases: [A, B] }`
  const out: Record<string, string | string[]> = {};
  const inner = value.trim().replace(/^\{/, '').replace(/\}$/, '');
  const re = /(\w+)\s*:\s*(\[[^\]]*\]|[^,]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner))) {
    const v = m[2].trim();
    out[m[1]] = v.startsWith('[') ? v.slice(1, -1).split(',').map(unquote).filter(Boolean) : unquote(v);
  }
  return out;
}

function unquote(s: string): string {
  return s.trim().replace(/\s+#.*$/, '').replace(/^["']|["']$/g, '').trim();
}

const ROLES: Role[] = ['coach', 'coachee', 'sponsor', 'observer', 'other'];
const asRole = (v: unknown): Role => (ROLES.includes(String(v).toLowerCase() as Role) ? (String(v).toLowerCase() as Role) : 'other');

/** Minimal YAML reader for the Coachdown front matter keys. Unknown keys are ignored. */
export function parseFrontMatter(yaml: string): { values: Record<string, string>; participants: Participant[] } {
  const values: Record<string, string> = {};
  const participants: Participant[] = [];
  const lines = yaml.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const top = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!top) continue;
    const [, key, rawValue] = top;
    if (key !== 'participants') {
      values[key] = unquote(rawValue);
      continue;
    }
    // participants block
    for (i = i + 1; i < lines.length; i++) {
      const entry = lines[i].match(/^(\s+)([^\s:#][^:]*?)\s*:\s*(.*)$/);
      if (!entry) {
        if (/^\S/.test(lines[i])) { i--; break; }
        continue;
      }
      const indent = entry[1].length;
      const tag = unquote(entry[2]);
      const v = entry[3].trim();
      const p: Participant = { tag, role: 'other', aliases: [] };
      if (v.startsWith('{')) {
        const o = parseInlineObject(v);
        p.role = asRole(o.role);
        if (typeof o.name === 'string') p.name = o.name;
        if (Array.isArray(o.aliases)) p.aliases = o.aliases;
      } else if (v) {
        p.role = asRole(unquote(v));
      } else {
        // nested block
        for (i = i + 1; i < lines.length; i++) {
          const sub = lines[i].match(/^(\s+)(\w+)\s*:\s*(.*)$/);
          if (!sub || sub[1].length <= indent) { i--; break; }
          const sv = sub[3].trim();
          if (sub[2] === 'role') p.role = asRole(unquote(sv));
          if (sub[2] === 'name') p.name = unquote(sv);
          if (sub[2] === 'aliases') p.aliases = sv.replace(/^\[|\]$/g, '').split(',').map(unquote).filter(Boolean);
        }
      }
      participants.push(p);
    }
  }
  return { values, participants };
}

// ---------------------------------------------------------------- main parser

interface SpeakerIndex {
  byToken: Map<string, string>;
  roleOf: (speaker: string | null | undefined) => Role | null;
  firstWithRole: (role: Role) => string;
}

function buildSpeakerIndex(participants: Participant[]): SpeakerIndex {
  const byToken = new Map<string, string>();
  for (const p of participants) {
    byToken.set(p.tag.toLowerCase(), p.tag);
    if (p.name) byToken.set(p.name.toLowerCase(), p.tag);
    for (const a of p.aliases) byToken.set(a.toLowerCase(), p.tag);
  }
  const firstWithRole = (role: Role) => participants.find((p) => p.role === role)?.tag ?? role;
  // Generic labels always work.
  for (const [label, role] of [['coach', 'coach'], ['coachee', 'coachee'], ['klient', 'coachee'], ['klientin', 'coachee'], ['client', 'coachee']] as const) {
    if (!byToken.has(label)) byToken.set(label, firstWithRole(role));
  }
  const roleOf = (speaker: string | null | undefined): Role | null => {
    if (!speaker) return null;
    const p = participants.find((x) => x.tag === speaker);
    if (p) return p.role;
    return ROLES.includes(speaker as Role) ? (speaker as Role) : 'other';
  };
  return { byToken, roleOf, firstWithRole };
}

const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const THEME_RE = /(?:^|\s)#([\p{L}\d][\p{L}\d_-]*)/gu;
const QUOTE_OPEN = /^["“„«]/;

function indentWidth(ws: string): number {
  let w = 0;
  for (const c of ws) w += c === '\t' ? 4 : 1;
  return w;
}

/** Splits leading speaker tags and `=`, and a trailing `!!` (insight), off an item text. Leading markers may come in any order. */
function readMarkers(text: string, idx: SpeakerIndex) {
  let rest = text;
  let speaker: string | undefined;
  let insight = false;
  let decision = false;
  for (let guard = 0; guard < 4; guard++) {
    const eq = rest.match(/^=\s+/);
    if (eq && !decision) { decision = true; rest = rest.slice(eq[0].length); continue; }
    const tag = rest.match(/^\**([\p{L}][\p{L}\d .'-]{0,30}?)\**\s*:(\s+|$)/u);
    if (tag && !speaker) {
      const token = tag[1].trim().toLowerCase();
      const resolved = idx.byToken.get(token);
      if (resolved) { speaker = resolved; rest = rest.slice(tag[0].length); continue; }
    }
    break;
  }
  // Trailing `!!` marks an insight (before any trailing #themes).
  const trailing = /(?<!!)\s*!!(?=(?:\s+#[\p{L}\d_-]+)*\s*$)/u;
  if (trailing.test(rest)) { insight = true; rest = rest.replace(trailing, ''); }
  return { speaker, insight, decision, rest: rest.trim() };
}

export function parseCoachdown(source: string): CoachdownDocument {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const doc: CoachdownDocument = {
    participants: [],
    defaultSpeaker: 'coachee',
    order: 'newest-first',
    engagementSections: [],
    sessions: [],
    items: [],
    warnings: [],
  };

  // Front matter
  let start = 0;
  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
    if (end > 0) {
      const fm = parseFrontMatter(lines.slice(1, end).join('\n'));
      doc.version = fm.values.coachdown;
      doc.participants = fm.participants;
      if (fm.values.order === 'oldest-first') doc.order = 'oldest-first';
      if (fm.values.default_speaker) doc.defaultSpeaker = fm.values.default_speaker;
      start = end + 1;
    }
  }

  // `About this log` section in documents without YAML (e.g. Google Docs).
  if (doc.participants.length === 0) {
    const about = lines.findIndex((l) => /^#{1,6}\s+about this log\b/i.test(l));
    if (about >= 0) {
      for (let i = about + 1; i < lines.length && !/^#{1,6}\s/.test(lines[i]); i++) {
        const m = lines[i].match(/^\s*[-*]\s+participants\s*:\s*(.+)$/i);
        if (!m) continue;
        for (const part of m[1].split(',')) {
          const pm = part.trim().match(/^(\w+)\s*=\s*(\w+)(?:\s*\(([^)]+)\))?/);
          if (pm) doc.participants.push({ tag: pm[1], role: asRole(pm[2]), name: pm[3]?.trim(), aliases: [] });
        }
      }
    }
  }

  const idx = buildSpeakerIndex(doc.participants);
  const resolveDefault = (value: string): string => {
    if (ROLES.includes(value as Role)) return idx.firstWithRole(value as Role);
    return idx.byToken.get(value.toLowerCase()) ?? value;
  };
  const docDefault = resolveDefault(doc.defaultSpeaker);

  let session: Session | null = null;
  let sessionDefault: string | undefined;
  const sectionStack: Section[] = [];
  const listStack: { indent: number; id: number }[] = [];
  let lastItem: Item | null = null;
  let inFence = false;
  let inComment = false;
  let sawContentInSession = false;
  let quoteGenerated = false;
  let seenHeading = false;
  const labelSpeaker = new Map<number, string>();

  const currentSection = () => sectionStack[sectionStack.length - 1] ?? null;

  const addItem = (partial: Omit<Item, 'id' | 'session' | 'section' | 'sectionKind' | 'themes'>): Item => {
    const section = currentSection();
    const item: Item = {
      id: doc.items.length,
      session: session ? session.index : null,
      section: section ? section.name : null,
      sectionKind: section ? section.kind : null,
      themes: [...partial.text.matchAll(THEME_RE)].map((m) => m[1].toLowerCase()),
      ...partial,
    };
    doc.items.push(item);
    return item;
  };

  for (let n = start; n < lines.length; n++) {
    const raw = lines[n];
    const lineNo = n + 1;

    // Code fences and HTML comments are skipped entirely.
    if (/^\s*(```|~~~)/.test(raw)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (inComment) { if (raw.includes('-->')) inComment = false; continue; }
    if (/^\s*<!--/.test(raw)) { if (!raw.includes('-->')) inComment = true; continue; }

    if (raw.trim() === '') { lastItem = null; continue; }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(raw)) { lastItem = null; continue; }

    // Headings
    const h = raw.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (h) {
      seenHeading = true;
      lastItem = null;
      listStack.length = 0;
      const level = h[1].length;
      const text = h[2];
      const date = matchLeadingDate(text);
      if (date) {
        sectionStack.length = 0;
        let rest = date.rest.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
        let status: Session['status'] = 'held';
        const st = rest.match(/\((cancelled|canceled|postponed|nicht stattgefunden|abgesagt|ausgefallen|verschoben)\)/i);
        if (st) {
          status = /postponed|verschoben/i.test(st[1]) ? 'postponed' : 'cancelled';
          rest = rest.replace(st[0], '').trim();
        }
        const title = rest.replace(/^[\s·|–—-]+/, '').trim();
        session = { index: doc.sessions.length, date: date.date, heading: text, title, status, type: 'session', line: lineNo, metadata: {} };
        doc.sessions.push(session);
        sessionDefault = undefined;
        sawContentInSession = false;
        continue;
      }
      if (!session) {
        doc.engagementSections.push({ name: text.replace(/[*_]/g, '').trim(), line: lineNo });
        sectionStack.length = 0;
        sectionStack.push({ name: text, level, line: lineNo, kind: 'other', generated: false });
        continue;
      }
      // Session section
      while (sectionStack.length && sectionStack[sectionStack.length - 1].level >= level) sectionStack.pop();
      let name = text.replace(/[*_]/g, '').trim();
      let generated = false;
      const gen = name.match(/^\[(ai|generated)\]\s*/i);
      if (gen) { generated = true; name = name.slice(gen[0].length); }
      const parentGenerated = sectionStack.some((s) => s.generated);
      const section: Section = { name, level, line: lineNo, kind: sectionKindOf(name), generated: generated || parentGenerated };
      const persp = name.match(/^(perspective|sicht|view)\s*:\s*(.+)$/i);
      const tagged = readMarkers(name, idx);
      if (persp) {
        section.kind = 'perspective';
        const who = persp[2].trim();
        section.defaultSpeaker = idx.byToken.get(who.toLowerCase()) ?? `other:${who}`;
      } else if (tagged.speaker && tagged.rest) {
        section.defaultSpeaker = tagged.speaker;
        section.name = tagged.rest;
        section.kind = sectionKindOf(tagged.rest);
      } else if (SECTION_DEFAULT_ROLE[section.kind]) {
        section.defaultSpeaker = idx.firstWithRole(SECTION_DEFAULT_ROLE[section.kind] as Role);
      }
      sectionStack.push(section);
      sawContentInSession = true;
      continue;
    }

    // Before the first heading: header note and titles are ignored.
    if (!seenHeading && /^\s*>/.test(raw)) continue;

    // Session metadata lines directly under the session heading.
    if (session && !sawContentInSession) {
      const pairs = raw.split(/\s+·\s+/).map((p) => p.match(/^\s*(time|type|participants|topics)\s*:\s*(.+)$/i));
      if (pairs.length && pairs.every(Boolean)) {
        for (const p of pairs) {
          const key = p![1].toLowerCase();
          const value = p![2].trim();
          session.metadata[key] = value;
          if (key === 'type') session.type = value.toLowerCase();
          if (key === 'participants') session.participants = value.split(/[,\s]+/).filter(Boolean).map((t) => idx.byToken.get(t.toLowerCase()) ?? t);
        }
        if (session.type === 'interview' && session.participants) {
          sessionDefault = session.participants.find((t) => idx.roleOf(t) !== 'coach');
        }
        continue;
      }
    }
    if (session) sawContentInSession = true;

    // Google Docs exports wrap indented list items in artificial blockquotes: `- > text`.
    let line = raw.replace(/^(\s*(?:[-*+]|\d+[.)])\s+)>\s?/, '$1');

    // Blockquotes: material, unless a line is a marked comment.
    const bq = line.match(/^\s*>\s?(.*)$/);
    if (bq) {
      const inner = bq[1];
      if (!inner.trim()) continue;
      if (/^\[(ai|generated)\]/i.test(inner.trim())) quoteGenerated = true;
      const innerList = inner.match(LIST_RE);
      const content = innerList ? innerList[3] : inner;
      const mk = readMarkers(content, idx);
      if (mk.speaker) {
        addItem({ line: lineNo, text: mk.rest, raw, speaker: mk.speaker, speakerMarked: true, mode: QUOTE_OPEN.test(mk.rest) ? 'verbatim' : 'note', type: mk.insight ? 'insight' : mk.decision ? 'decision' : mk.rest.endsWith('?') ? 'question' : 'note', parent: null, depth: 0 });
      } else {
        const generatedHere = quoteGenerated || !!currentSection()?.generated;
        addItem({ line: lineNo, text: content.replace(/^\[(ai|generated)\]\s*/i, '').trim(), raw, speaker: null, speakerMarked: false, mode: 'note', type: generatedHere ? 'generated' : 'material', parent: null, depth: 0 });
      }
      lastItem = null;
      continue;
    }
    quoteGenerated = false;

    // Tables and images are material.
    if (/^\s*\|/.test(line) || /^\s*!\[/.test(line)) {
      if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) continue; // table separator row
      addItem({ line: lineNo, text: line.trim(), raw, speaker: null, speakerMarked: false, mode: 'note', type: 'material', parent: null, depth: 0 });
      lastItem = null;
      continue;
    }

    const li = line.match(LIST_RE);
    if (!li) {
      // Continuation of the previous list item, or a paragraph.
      if (lastItem && /^\s+\S/.test(line)) {
        lastItem.text = `${lastItem.text} ${line.trim()}`.trim();
        lastItem.raw += `\n${raw}`;
        continue;
      }
      listStack.length = 0;
      lastItem = interpretItem(line.trim(), raw, lineNo, 0, null);
      continue;
    }

    const indent = indentWidth(li[1]);
    while (listStack.length && listStack[listStack.length - 1].indent >= indent) listStack.pop();
    const parent = listStack.length ? listStack[listStack.length - 1].id : null;
    const item = interpretItem(li[3], raw, lineNo, listStack.length, parent);
    if (item) listStack.push({ indent, id: item.id });
    lastItem = item;
  }

  function interpretItem(content: string, raw: string, lineNo: number, depth: number, parent: number | null): Item | null {
    let text = content;
    let type: ItemType = 'note';
    let done: boolean | undefined;
    let reviewOf: string | undefined;
    const section = currentSection();
    const parentItem = parent !== null ? doc.items[parent] : null;

    // `learned:` lines belong to the experiment they are nested under.
    const learned = text.match(/^(learned|gelernt)\s*:\s*(.*)$/i);
    if (learned && parentItem && (parentItem.type === 'experiment' || parentItem.type === 'review')) {
      parentItem.learned = learned[2].trim();
    }

    const box = text.match(/^\[( |x|X)\]\s*/);
    let isTask = false;
    if (box) {
      isTask = true;
      done = box[1].toLowerCase() === 'x';
      text = text.slice(box[0].length);
      const dated = text.match(/^\((\d{4}-\d{2}-\d{2})\)\s*/);
      if (dated) { reviewOf = dated[1]; text = text.slice(dated[0].length); }
    }

    const mk = readMarkers(text, idx);
    text = mk.rest;

    // An empty label like `- J:` applies its speaker to nested items.
    if (mk.speaker && !text) {
      const item = addItem({ line: lineNo, text: '', raw, speaker: mk.speaker, speakerMarked: true, mode: 'note', type: 'note', parent, depth });
      labelSpeaker.set(item.id, mk.speaker);
      return item;
    }

    let speaker = mk.speaker ?? null;
    let speakerMarked = !!mk.speaker;
    let speakerName: string | undefined;
    let mode: Item['mode'] = 'note';

    const attributed = text.match(/^["“„«](.+?)["”“»]\s+[—–]\s+(.+)$/);
    if (attributed && !speaker) {
      mode = 'verbatim';
      speaker = 'other';
      speakerName = attributed[2].trim();
      speakerMarked = true;
    } else if (QUOTE_OPEN.test(text)) {
      mode = 'verbatim';
    }

    const isQuestion = /\?\s*(["”“»])?\s*$/.test(text.replace(/(?:\s#[\p{L}\d_-]+)+\s*$/u, ''));
    const kind = section?.kind ?? null;
    const topLevelInSection = depth === 0;

    if (section?.generated) type = 'generated';
    else if (isTask && !session) type = 'backlog';
    else if (isTask) type = kind === 'review' ? 'review' : 'experiment';
    else if (kind === 'experiments' && topLevelInSection && session) type = 'experiment';
    else if (mk.decision || (kind === 'decisions' && topLevelInSection)) type = 'decision';
    else if (mk.insight) type = 'insight';
    else if (isQuestion) type = 'question';

    // Speaker resolution for unmarked items.
    if (!speaker) {
      const inheritedLabel = parent !== null ? findLabel(parent) : undefined;
      const sectionDefault = section?.defaultSpeaker;
      const sectionRole = sectionDefault ? (sectionDefault.startsWith('other:') ? 'other' : idx.roleOf(sectionDefault)) : null;
      if (inheritedLabel) {
        speaker = inheritedLabel;
        speakerMarked = true;
      } else if (type === 'question') {
        // Unmarked questions are the coach's, except in sections that belong to someone else.
        speaker = sectionDefault && sectionRole !== 'coach' ? sectionDefault : idx.firstWithRole('coach');
      } else {
        speaker = sectionDefault ?? sessionDefault ?? docDefault;
      }
    }
    if (speaker?.startsWith('other:')) { speakerName = speaker.slice(6); speaker = 'other'; }

    if (type === 'insight' && idx.roleOf(speaker) === 'coach') type = 'hypothesis';

    let owner: string | undefined;
    if (type === 'experiment' || type === 'review' || type === 'backlog') owner = mk.speaker ?? idx.firstWithRole('coachee');
    if (type === 'decision' && mk.speaker) owner = mk.speaker;
    if (owner && (type === 'experiment' || type === 'review')) { speaker = owner; speakerMarked = !!mk.speaker; }

    return addItem({ line: lineNo, text, raw, speaker, speakerName, speakerMarked, mode, type, owner, done, reviewOf, parent, depth });
  }

  function findLabel(id: number): string | undefined {
    let cur: number | null = id;
    while (cur !== null) {
      const label = labelSpeaker.get(cur);
      if (label) return label;
      cur = doc.items[cur].parent;
    }
    return undefined;
  }

  return doc;
}

// ---------------------------------------------------------------- helpers

/** The role of a speaker tag in a parsed document. */
export function roleOf(doc: CoachdownDocument, speaker: string | null | undefined): Role | null {
  if (!speaker) return null;
  const p = doc.participants.find((x) => x.tag === speaker);
  if (p) return p.role;
  return ROLES.includes(speaker as Role) ? (speaker as Role) : 'other';
}

/** A display name for a speaker: participant name, tag or role. */
export function speakerLabel(doc: CoachdownDocument, item: Pick<Item, 'speaker' | 'speakerName'>): string {
  if (item.speakerName) return item.speakerName;
  if (!item.speaker) return '';
  const p = doc.participants.find((x) => x.tag === item.speaker);
  return p?.name ?? p?.tag ?? item.speaker;
}

/** Sessions in chronological order (oldest first), regardless of file order. */
export function sessionsChronological(doc: CoachdownDocument): Session[] {
  return [...doc.sessions].sort((a, b) => a.date.localeCompare(b.date) || a.line - b.line);
}

const normaliseText = (s: string) => s.toLowerCase().replace(/[^\p{L}\d]+/gu, ' ').trim();

/**
 * Experiments that are still open: not done, and not reviewed as done in a
 * later session. Reviews are linked by (nearly) identical text, as in the spec.
 */
export function openExperiments(doc: CoachdownDocument): Item[] {
  const dateOf = (i: Item) => (i.session !== null ? doc.sessions[i.session].date : '');
  const tasks = doc.items.filter((i) => (i.type === 'experiment' || i.type === 'review') && i.text);
  const same = (a: string, b: string) => {
    const x = normaliseText(a);
    const y = normaliseText(b);
    return x === y || x.startsWith(y) || y.startsWith(x);
  };
  const open = tasks.filter((exp) => {
    if (exp.done) return false;
    // Closed by a later (or same-day) review marked as done.
    if (tasks.some((o) => o !== exp && o.done && dateOf(o) >= dateOf(exp) && same(o.text, exp.text))) return false;
    // A review that was not done but carried over as a new experiment in the same or a later session.
    if (exp.type === 'review' && tasks.some((o) => o !== exp && o.type === 'experiment' && dateOf(o) >= dateOf(exp) && same(o.text, exp.text))) return false;
    return true;
  });
  // The same open experiment repeated across sessions is listed once, with its most recent occurrence.
  return open.filter((exp, i) => !open.some((o, j) => j !== i && same(o.text, exp.text) && (dateOf(o) > dateOf(exp) || (dateOf(o) === dateOf(exp) && j < i))));
}

export interface SessionSummary {
  session: Session;
  items: number;
  byRole: Partial<Record<Role, number>>;
  questions: number;
  insights: number;
  hypotheses: number;
  decisions: number;
  experiments: number;
  reviewed: number;
}

/** Counts per session. Material and generated text are excluded from speaker counts. */
export function summarise(doc: CoachdownDocument): SessionSummary[] {
  return sessionsChronological(doc).map((session) => {
    const items = doc.items.filter((i) => i.session === session.index && i.text && i.type !== 'material' && i.type !== 'generated');
    const byRole: Partial<Record<Role, number>> = {};
    for (const i of items) {
      const r = roleOf(doc, i.speaker);
      if (r) byRole[r] = (byRole[r] ?? 0) + 1;
    }
    const count = (t: ItemType) => items.filter((i) => i.type === t).length;
    return {
      session,
      items: items.length,
      byRole,
      questions: count('question'),
      insights: count('insight'),
      hypotheses: count('hypothesis'),
      decisions: count('decision'),
      experiments: count('experiment'),
      reviewed: items.filter((i) => i.type === 'review').length,
    };
  });
}
