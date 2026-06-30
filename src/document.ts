export interface ConfirmLabels {
  message: string;
  save: string;
  discard: string;
  cancel: string;
}

export interface FileBridge {
  showOpenDialog(): Promise<string | null>;
  readFile(path: string): Promise<{ content: string } | { error: string }>;
  showSaveDialog(suggestedName: string): Promise<string | null>;
  writeFile(path: string, content: string): Promise<{ ok: true } | { error: string }>;
  confirmUnsaved(filename: string, labels: ConfirmLabels): Promise<"save" | "discard" | "cancel">;
  setActiveDoc(path: string | null, addToRecent: boolean): void;
  getStartupPath(): Promise<string | null>;
  setTitle(title: string): void;
}

export interface DocHost {
  getEditorContent(): string;
  applyContent(text: string): void;
  setStatus(key: string): void;
  persist(code: string, path: string | null): void;
  loadDraft(): { code: string | null; path: string | null };
  t(key: string): string;
  defaultContent: string;
}

const APP_SUFFIX = " — Mermaid Local Editor";

/** Browser-safe basename (no node:path in the renderer). */
export function basename(p: string): string {
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

export class DocumentManager {
  private path: string | null = null;
  private baseline = "";

  constructor(
    private bridge: FileBridge,
    private host: DocHost,
  ) {}

  async init(): Promise<void> {
    const diskPath = await this.bridge.getStartupPath();
    const draft = this.host.loadDraft();
    if (diskPath) {
      const res = await this.bridge.readFile(diskPath);
      if ("content" in res) {
        this.path = diskPath;
        this.baseline = res.content;
        const recovered =
          draft.code != null && draft.path === diskPath && draft.code !== res.content;
        this.host.applyContent(recovered ? draft.code! : res.content);
        this.bridge.setActiveDoc(diskPath, false);
        this.refresh();
        return;
      }
      this.host.setStatus("status.openFailed");
    }
    this.path = null;
    this.baseline = this.host.defaultContent;
    this.host.applyContent(draft.code ?? this.host.defaultContent);
    this.bridge.setActiveDoc(null, false);
    this.refresh();
  }

  /** Called on every editor change. */
  onEdit(): void {
    this.host.persist(this.host.getEditorContent(), this.path);
    this.updateTitle();
  }

  isDirty(): boolean {
    return this.host.getEditorContent() !== this.baseline;
  }

  private docName(): string {
    return this.path ? basename(this.path) : this.host.t("doc.untitled");
  }

  private updateTitle(): void {
    this.bridge.setTitle(`${this.isDirty() ? "*" : ""}${this.docName()}${APP_SUFFIX}`);
  }

  private refresh(): void {
    this.host.persist(this.host.getEditorContent(), this.path);
    this.updateTitle();
  }

  /** True if the caller may proceed (user did not cancel). */
  private async guard(): Promise<boolean> {
    if (!this.isDirty()) return true;
    const choice = await this.bridge.confirmUnsaved(this.docName(), {
      message: this.host.t("confirm.message"),
      save: this.host.t("confirm.save"),
      discard: this.host.t("confirm.discard"),
      cancel: this.host.t("confirm.cancel"),
    });
    if (choice === "cancel") return false;
    if (choice === "discard") return true;
    return this.save();
  }

  async newDoc(): Promise<void> {
    if (!(await this.guard())) return;
    this.path = null;
    this.baseline = this.host.defaultContent;
    this.host.applyContent(this.host.defaultContent);
    this.bridge.setActiveDoc(null, false);
    this.refresh();
  }

  async open(): Promise<void> {
    if (!(await this.guard())) return;
    const p = await this.bridge.showOpenDialog();
    if (!p) return;
    await this.loadPath(p);
  }

  async openRecent(p: string): Promise<void> {
    if (!(await this.guard())) return;
    await this.loadPath(p);
  }

  private async loadPath(p: string): Promise<void> {
    const res = await this.bridge.readFile(p);
    if ("error" in res) {
      this.host.setStatus("status.openFailed");
      return;
    }
    this.path = p;
    this.baseline = res.content;
    this.host.applyContent(res.content);
    this.bridge.setActiveDoc(p, true);
    this.refresh();
    this.host.setStatus("status.opened");
  }

  /** True on a successful save. */
  async save(): Promise<boolean> {
    if (!this.path) return this.saveAs();
    const content = this.host.getEditorContent();
    const res = await this.bridge.writeFile(this.path, content);
    if ("error" in res) {
      this.host.setStatus("status.saveFailed");
      return false;
    }
    this.baseline = content;
    this.bridge.setActiveDoc(this.path, true);
    this.refresh();
    this.host.setStatus("status.saved");
    return true;
  }

  async saveAs(): Promise<boolean> {
    const suggested = this.path ? basename(this.path) : "untitled.mmd";
    const p = await this.bridge.showSaveDialog(suggested);
    if (!p) return false;
    const content = this.host.getEditorContent();
    const res = await this.bridge.writeFile(p, content);
    if ("error" in res) {
      this.host.setStatus("status.saveFailed");
      return false;
    }
    this.path = p;
    this.baseline = content;
    this.bridge.setActiveDoc(p, true);
    this.refresh();
    this.host.setStatus("status.saved");
    return true;
  }

  async handleCloseRequest(allowClose: () => void): Promise<void> {
    if (await this.guard()) allowClose();
  }
}
