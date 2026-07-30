/**
 * Client-side error reporting hook for the TanStack Router root error boundary.
 *
 * This project was originally scaffolded on the Lovable platform, which injects
 * a `lib/lovable-error-reporting` module at build time to forward runtime errors
 * to its own dashboard. That module isn't part of this repository, so outside of
 * Lovable's environment the import fails and breaks the build.
 *
 * This local replacement keeps the same call site and behaviour (log the error
 * with enough context to debug it) without depending on any external platform.
 * Swap the body of `reportError` for a real error-tracking integration (Sentry,
 * LogRocket, a custom endpoint, etc.) when one is available.
 */

export interface ErrorReportContext {
  /** Where the error was caught, e.g. "tanstack_root_error_component". */
  boundary: string;
  [key: string]: unknown;
}

export function reportError(error: unknown, context: ErrorReportContext): void {
  console.error(`[NeuroPharm Assist] Unhandled UI error (${context.boundary}):`, error, context);
}
