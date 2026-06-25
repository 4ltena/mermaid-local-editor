import { session } from "electron";

const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; font-src 'self'; connect-src 'self'";

/**
 * Apply the production CSP to every response. Not used in dev because the Vite
 * HMR client needs inline scripts and a websocket connection.
 */
export function applyProductionCsp(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [CSP],
      },
    });
  });
}
