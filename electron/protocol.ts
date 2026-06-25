import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { protocol, net } from "electron";
import { resolveRendererPath } from "./path-resolver";

export const APP_SCHEME = "app";

/** Must be called at top level, before `app` is ready. */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
    },
  ]);
}

/** Must be called after `app` is ready. */
export function handleAppProtocol(): void {
  const rendererRoot = join(import.meta.dirname, "../renderer");
  protocol.handle(APP_SCHEME, (request) => {
    const filePath = resolveRendererPath(rendererRoot, request.url);
    if (!filePath) return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(filePath).toString());
  });
}
