import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/language";

export interface EditorOptions {
  parent: HTMLElement;
  initialDoc: string;
  onChange: (doc: string) => void;
  dark: boolean;
}

// Minimal dark theme so the editor follows the UI light/dark toggle.
const darkTheme = EditorView.theme(
  {
    "&": { color: "#e6e7ea", backgroundColor: "#202226" },
    ".cm-content": { caretColor: "#a06bff" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#a06bff" },
    ".cm-activeLine": { backgroundColor: "#2a2c31" },
    ".cm-gutters": {
      backgroundColor: "#202226",
      color: "#6b7178",
      border: "none",
    },
    ".cm-activeLineGutter": { backgroundColor: "#2a2c31" },
  },
  { dark: true },
);

export class CodeEditor {
  private view: EditorView;
  private onChange: (doc: string) => void;

  constructor(opts: EditorOptions) {
    this.onChange = opts.onChange;
    this.view = new EditorView({
      parent: opts.parent,
      state: this.makeState(opts.initialDoc, opts.dark),
    });
  }

  private extensions(dark: boolean): Extension[] {
    const base: Extension[] = [
      lineNumbers(),
      history(),
      bracketMatching(),
      highlightActiveLine(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.lineWrapping,
      EditorView.updateListener.of((u) => {
        if (u.docChanged) this.onChange(u.state.doc.toString());
      }),
    ];
    if (dark) base.push(darkTheme);
    return base;
  }

  private makeState(doc: string, dark: boolean): EditorState {
    return EditorState.create({ doc, extensions: this.extensions(dark) });
  }

  getValue(): string {
    return this.view.state.doc.toString();
  }

  setValue(doc: string): void {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: doc },
    });
  }

  /** Rebuild the editor state to swap the light/dark theme in place. */
  setDark(dark: boolean): void {
    const doc = this.getValue();
    this.view.setState(this.makeState(doc, dark));
  }

  focus(): void {
    this.view.focus();
  }
}
