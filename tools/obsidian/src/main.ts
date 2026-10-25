import {
  App,
  Editor,
  ItemView,
  MarkdownPostProcessorContext,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  WorkspaceLeaf,
  debounce,
} from 'obsidian';
import { parseCoachdown } from './parser';
import { planNewSession } from './session';
import { ALL_PANELS, parseBlockOptions, renderDashboard, type LogInput } from './render';

const VIEW_TYPE = 'coachdown-dashboard';

interface CoachdownSettings {
  /** File name suffix that marks a Coachdown log. */
  suffix: string;
  /** Also treat notes with a `coachdown:` front matter key as logs. */
  detectFrontMatter: boolean;
  /** Only look for logs inside this folder (empty = whole vault). */
  folder: string;
  /** Highlight markers in reading view. */
  decorate: boolean;
}

const DEFAULT_SETTINGS: CoachdownSettings = { suffix: '.coach.md', detectFrontMatter: true, folder: '', decorate: true };

export default class CoachdownPlugin extends Plugin {
  settings: CoachdownSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE, (leaf) => new DashboardView(leaf, this));
    this.addRibbonIcon('list-checks', 'Open Coachdown dashboard', () => this.activateView());

    this.addCommand({ id: 'open-dashboard', name: 'Open dashboard', callback: () => this.activateView() });

    this.addCommand({
      id: 'insert-session',
      name: 'Insert new session',
      editorCallback: (editor: Editor) => this.insertSession(editor),
    });

    this.addCommand({
      id: 'copy-json',
      name: 'Copy current log as JSON',
      editorCallback: async (editor: Editor) => {
        const doc = parseCoachdown(editor.getValue());
        await navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
        new Notice(`Coachdown: copied ${doc.sessions.length} sessions, ${doc.items.length} items.`);
      },
    });

    this.registerMarkdownCodeBlockProcessor('coachdown', async (source, el, ctx) => {
      const opts = parseBlockOptions(source);
      const logs = await this.collectLogs(opts.source, ctx.sourcePath);
      renderDashboard(el, logs, { panels: opts.panels, limit: opts.limit, onOpen: (path, line) => this.openAt(path, line) });
    });

    this.registerMarkdownPostProcessor((el, ctx) => this.decorate(el, ctx));

    this.addSettingTab(new CoachdownSettingTab(this.app, this));

    const refresh = debounce(() => this.refreshViews(), 800, true);
    this.registerEvent(this.app.vault.on('modify', (file) => { if (file instanceof TFile && this.isLog(file)) refresh(); }));
    this.registerEvent(this.app.vault.on('rename', () => refresh()));
    this.registerEvent(this.app.vault.on('delete', () => refresh()));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.refreshViews();
  }

  // ------------------------------------------------------------ logs

  isLog(file: TFile): boolean {
    if (file.extension !== 'md') return false;
    if (this.settings.folder && !file.path.startsWith(this.settings.folder.replace(/\/?$/, '/'))) return false;
    if (file.path.endsWith(this.settings.suffix)) return true;
    if (!this.settings.detectFrontMatter) return false;
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    return !!fm && 'coachdown' in fm;
  }

  logFiles(): TFile[] {
    return this.app.vault.getMarkdownFiles().filter((f) => this.isLog(f)).sort((a, b) => a.basename.localeCompare(b.basename));
  }

  async readLog(file: TFile): Promise<LogInput> {
    const text = await this.app.vault.cachedRead(file);
    return { name: file.basename.replace(/\.coach$/, ''), path: file.path, doc: parseCoachdown(text) };
  }

  /** `auto`: the current note if it is a log, otherwise all logs. Also accepts `this`, `all`, a file path or a folder. */
  async collectLogs(source: string, currentPath: string): Promise<LogInput[]> {
    const current = this.app.vault.getAbstractFileByPath(currentPath);
    const all = this.logFiles();
    let files: TFile[];
    if (source === 'all') files = all;
    else if (source === 'this' || source === 'auto') {
      files = current instanceof TFile && this.isLog(current) ? [current] : source === 'auto' ? all : [];
    } else {
      const target = source.replace(/^\[\[|\]\]$/g, '');
      const exact = this.app.metadataCache.getFirstLinkpathDest(target, currentPath);
      files = exact ? [exact] : all.filter((f) => f.path.startsWith(target.replace(/\/?$/, '/')));
    }
    return Promise.all(files.map((f) => this.readLog(f)));
  }

  async openAt(path: string, line: number) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return;
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file, { eState: { line: Math.max(0, line - 1) } });
  }

  // ------------------------------------------------------------ dashboard view

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      const right = workspace.getRightLeaf(false);
      if (!right) return;
      leaf = right;
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  refreshViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof DashboardView) void view.render();
    }
  }

  // ------------------------------------------------------------ insert session

  insertSession(editor: Editor) {
    const plan = planNewSession(editor.getValue(), window.moment().format('YYYY-MM-DD'));
    if (plan.line >= editor.lineCount()) editor.replaceRange(plan.insert, { line: editor.lastLine(), ch: editor.getLine(editor.lastLine()).length });
    else editor.replaceRange(plan.insert, { line: plan.line, ch: 0 });
    editor.setCursor({ line: plan.cursorLine, ch: 2 });
    editor.focus();
    new Notice(`Coachdown: Session ${plan.number} added${plan.reviewCount ? ` with ${plan.reviewCount} experiment${plan.reviewCount === 1 ? '' : 's'} to review` : ''}.`);
  }

  // ------------------------------------------------------------ reading view

  decorate(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    if (!this.settings.decorate) return;
    const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
    if (!(file instanceof TFile) || !this.isLog(file)) return;
    const fm = ctx.frontmatter ?? {};
    const roles = new Map<string, string>();
    const participants = (fm.participants ?? {}) as Record<string, unknown>;
    for (const [tag, value] of Object.entries(participants)) {
      const role = typeof value === 'string' ? value : (value as { role?: string })?.role;
      const name = typeof value === 'object' ? (value as { name?: string })?.name : undefined;
      if (role) {
        roles.set(tag.toLowerCase(), role);
        if (name) roles.set(name.toLowerCase(), role);
      }
    }
    roles.set('coach', 'coach');
    roles.set('coachee', 'coachee');

    el.querySelectorAll('li').forEach((li) => {
      const first = Array.from(li.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
      const text = first?.textContent?.trim() ?? '';
      if (/^!\s/.test(text)) li.classList.add('cd-insight');
      if (/^=\s/.test(text)) li.classList.add('cd-decision');
      const tag = text.match(/^([\p{L}][\p{L}\d .'-]{0,30}?):(\s|$)/u);
      const role = tag ? roles.get(tag[1].trim().toLowerCase()) : undefined;
      if (role) li.classList.add('cd-speaker', `cd-role-${role}`);
    });
  }
}

class DashboardView extends ItemView {
  private selected = '';

  constructor(leaf: WorkspaceLeaf, private plugin: CoachdownPlugin) {
    super(leaf);
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return 'Coachdown'; }
  getIcon() { return 'list-checks'; }

  async onOpen() { await this.render(); }

  async render() {
    const root = this.contentEl;
    root.empty();
    root.addClass('coachdown-view');
    const files = this.plugin.logFiles();

    const bar = root.createDiv({ cls: 'coachdown-toolbar' });
    const select = bar.createEl('select', { cls: 'dropdown' });
    select.createEl('option', { text: `All logs (${files.length})`, value: '' });
    for (const f of files) select.createEl('option', { text: f.basename.replace(/\.coach$/, ''), value: f.path });
    select.value = this.selected;
    select.addEventListener('change', () => { this.selected = select.value; void this.render(); });
    const reload = bar.createEl('button', { text: 'Refresh' });
    reload.addEventListener('click', () => void this.render());

    const chosen = this.selected ? files.filter((f) => f.path === this.selected) : files;
    const logs = await Promise.all(chosen.map((f) => this.plugin.readLog(f)));
    renderDashboard(root.createDiv(), logs, { panels: ALL_PANELS, limit: this.selected ? 0 : 5, onOpen: (p, l) => this.plugin.openAt(p, l) });
  }
}

class CoachdownSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: CoachdownPlugin) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Log file suffix')
      .setDesc('Notes whose path ends with this are treated as Coachdown logs.')
      .addText((t) => t.setValue(this.plugin.settings.suffix).onChange(async (v) => { this.plugin.settings.suffix = v.trim() || DEFAULT_SETTINGS.suffix; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Detect by front matter')
      .setDesc('Also treat notes with a "coachdown:" front matter key as logs.')
      .addToggle((t) => t.setValue(this.plugin.settings.detectFrontMatter).onChange(async (v) => { this.plugin.settings.detectFrontMatter = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Folder')
      .setDesc('Only look for logs in this folder. Leave empty for the whole vault.')
      .addText((t) => t.setPlaceholder('Coaching').setValue(this.plugin.settings.folder).onChange(async (v) => { this.plugin.settings.folder = v.trim(); await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Highlight markers in reading view')
      .setDesc('Colours coach lines, insights (!) and decisions (=).')
      .addToggle((t) => t.setValue(this.plugin.settings.decorate).onChange(async (v) => { this.plugin.settings.decorate = v; await this.plugin.saveSettings(); }));
  }
}
