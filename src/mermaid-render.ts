import mermaid from "mermaid";

export type MermaidTheme = "default" | "dark" | "forest" | "neutral";

let renderSeq = 0;

export interface RenderResult {
  svg: string;
}

export function configureMermaid(theme: MermaidTheme): void {
  mermaid.initialize({
    startOnLoad: false,
    theme,
    securityLevel: "strict",
    suppressErrorRendering: true,
    fontFamily:
      '"Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", Meiryo, sans-serif',
  });
}

/**
 * Render Mermaid source to an SVG string. Throws on parse/render errors so the
 * caller can show the message and keep the last good diagram.
 */
export async function renderMermaid(code: string): Promise<RenderResult> {
  const trimmed = code.trim();
  if (!trimmed) {
    throw new Error("コードが空です。");
  }
  // Validate first for a clean error before touching the DOM.
  await mermaid.parse(trimmed);
  const id = `mle-svg-${++renderSeq}`;
  const { svg } = await mermaid.render(id, trimmed);
  return { svg };
}

/** Extract intrinsic pixel size from a rendered SVG markup string. */
export function svgIntrinsicSize(svgEl: SVGSVGElement): { w: number; h: number } {
  const vb = svgEl.viewBox?.baseVal;
  if (vb && vb.width && vb.height) {
    return { w: vb.width, h: vb.height };
  }
  const rect = svgEl.getBoundingClientRect();
  return { w: rect.width || 800, h: rect.height || 600 };
}
