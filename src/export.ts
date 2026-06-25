// File export helpers. Uses a Blob + anchor download, which works in a plain
// browser, the Electron renderer (Chromium) and mobile WebViews alike — no native
// plugin required, keeping the cross-platform surface small.

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke a tick later so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(
    d.getHours(),
  )}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function exportSvg(svgEl: SVGSVGElement): void {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  const source = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${source}`], {
    type: "image/svg+xml;charset=utf-8",
  });
  triggerDownload(blob, `mermaid-${timestamp()}.svg`);
}

export async function exportPng(svgEl: SVGSVGElement, scale = 2): Promise<void> {
  const vb = svgEl.viewBox?.baseVal;
  const rect = svgEl.getBoundingClientRect();
  const w = (vb && vb.width) || rect.width || 800;
  const h = (vb && vb.height) || rect.height || 600;

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  const source = new XMLSerializer().serializeToString(clone);
  const svgUrl =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("画像の生成に失敗しました。"));
    img.src = svgUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas を初期化できませんでした。");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, `mermaid-${timestamp()}.png`);
      resolve();
    }, "image/png");
  });
}
