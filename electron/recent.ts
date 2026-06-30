import { app } from "electron";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

export interface AppState {
  recent: string[];
  lastPath: string | null;
}

/** Most-recent-first, de-duplicated, capped at `max`. */
export function addRecent(list: string[], path: string, max: number): string[] {
  return [path, ...list.filter((p) => p !== path)].slice(0, max);
}

function statePath(): string {
  return join(app.getPath("userData"), "mle-state.json");
}

export function loadState(): AppState {
  try {
    const raw = JSON.parse(readFileSync(statePath(), "utf8")) as Partial<AppState>;
    return {
      recent: Array.isArray(raw.recent) ? raw.recent : [],
      lastPath: typeof raw.lastPath === "string" ? raw.lastPath : null,
    };
  } catch {
    return { recent: [], lastPath: null };
  }
}

export function saveState(state: AppState): void {
  try {
    writeFileSync(statePath(), JSON.stringify(state), "utf8");
  } catch {
    // best-effort; a write failure must not crash the app
  }
}
