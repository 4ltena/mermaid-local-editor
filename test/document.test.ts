import { describe, it, expect, vi } from "vitest";
import { DocumentManager, basename, type FileBridge, type DocHost } from "../src/document";

const DEFAULT = "graph TD;A-->B";

function makeBridge(over: Partial<FileBridge> = {}): FileBridge {
  return {
    showOpenDialog: vi.fn(async () => null),
    readFile: vi.fn(async () => ({ content: "" })),
    showSaveDialog: vi.fn(async () => null),
    writeFile: vi.fn(async () => ({ ok: true as const })),
    confirmUnsaved: vi.fn(async () => "discard" as const),
    setActiveDoc: vi.fn(),
    removeRecent: vi.fn(),
    getStartupPath: vi.fn(async () => null),
    setTitle: vi.fn(),
    ...over,
  };
}

function makeHost(initial = DEFAULT): DocHost {
  let content = initial;
  return {
    getEditorContent: () => content,
    applyContent: async (t) => {
      content = t;
    },
    setStatus: vi.fn(),
    persist: vi.fn(),
    loadDraft: () => ({ code: null, path: null }),
    t: (k) => k,
    defaultContent: DEFAULT,
  };
}

describe("basename", () => {
  it("handles both separators", () => {
    expect(basename("/a/b/c.mmd")).toBe("c.mmd");
    expect(basename("C:\\x\\y.mmd")).toBe("y.mmd");
  });
});

describe("DocumentManager", () => {
  it("opens a file and is not dirty", async () => {
    const bridge = makeBridge({
      showOpenDialog: vi.fn(async () => "/d/x.mmd"),
      readFile: vi.fn(async () => ({ content: "flowchart LR" })),
    });
    const host = makeHost("");
    const doc = new DocumentManager(bridge, host);
    await doc.open();
    expect(host.getEditorContent()).toBe("flowchart LR");
    expect(doc.isDirty()).toBe(false);
    expect(bridge.setActiveDoc).toHaveBeenCalledWith("/d/x.mmd", true);
    expect(bridge.confirmUnsaved).not.toHaveBeenCalled();
  });

  it("save on an untitled doc falls back to saveAs", async () => {
    const bridge = makeBridge({ showSaveDialog: vi.fn(async () => "/d/new.mmd") });
    const host = makeHost();
    host.applyContent("edited");
    const doc = new DocumentManager(bridge, host);
    const ok = await doc.save();
    expect(ok).toBe(true);
    expect(bridge.showSaveDialog).toHaveBeenCalled();
    expect(bridge.writeFile).toHaveBeenCalledWith("/d/new.mmd", "edited");
  });

  it("cancelling the unsaved guard aborts open", async () => {
    const bridge = makeBridge({
      confirmUnsaved: vi.fn(async () => "cancel" as const),
      showOpenDialog: vi.fn(async () => "/d/x.mmd"),
    });
    const host = makeHost();
    host.applyContent("dirty content");
    const doc = new DocumentManager(bridge, host);
    await doc.open();
    expect(bridge.showOpenDialog).not.toHaveBeenCalled();
  });

  it("recovers an unsaved draft at startup", async () => {
    const bridge = makeBridge({
      getStartupPath: vi.fn(async () => "/d/x.mmd"),
      readFile: vi.fn(async () => ({ content: "on disk" })),
    });
    const host = makeHost();
    host.loadDraft = () => ({ code: "unsaved edits", path: "/d/x.mmd" });
    const doc = new DocumentManager(bridge, host);
    await doc.init();
    expect(host.getEditorContent()).toBe("unsaved edits");
    expect(doc.isDirty()).toBe(true);
  });
});
