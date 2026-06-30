import type { ConfirmLabels } from "./document";

declare global {
  interface Window {
    api: {
      showOpenDialog(): Promise<string | null>;
      readFile(path: string): Promise<{ content: string } | { error: string }>;
      showSaveDialog(suggestedName: string): Promise<string | null>;
      writeFile(path: string, content: string): Promise<{ ok: true } | { error: string }>;
      confirmUnsaved(
        filename: string,
        labels: ConfirmLabels,
      ): Promise<"save" | "discard" | "cancel">;
      setActiveDoc(path: string | null, addToRecent: boolean): void;
      getStartupPath(): Promise<string | null>;
      setTitle(title: string): void;
      allowClose(): void;
      onCommand(cb: (payload: { type: string; path?: string }) => void): void;
    };
  }
}

export {};
