import { join, normalize, sep } from "node:path";

/**
 * Resolve an `app://` request URL to an absolute file path inside `root`.
 * Maps the bare root to `index.html`. Returns `null` if the resolved path
 * would escape `root` (directory-traversal protection).
 */
export function resolveRendererPath(root: string, requestUrl: string): string | null {
  // Parse URL manually to preserve the path before normalization, and stop at
  // the query (?) or fragment (#) so they never leak into the file name.
  const match = requestUrl.match(/^app:\/\/[^\/]*([^?#]*)/);
  const rawPathname = match ? match[1] || "/" : new URL(requestUrl).pathname;

  let rel: string;
  try {
    rel = decodeURIComponent(rawPathname);
  } catch {
    // Malformed percent-encoding (e.g. "%zz") throws URIError; reject it.
    return null;
  }
  if (rel === "/" || rel === "") rel = "/index.html";
  const resolved = normalize(join(root, rel));
  const rootWithSep = root.endsWith(sep) ? root : root + sep;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}
