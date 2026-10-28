/**
 * Prefix for links written as plain anchors.
 *
 * Next adds the configured basePath to its own router and asset URLs, but not
 * to a raw <a href="/portal">. Under vijeta.me/ClearMind an unprefixed anchor
 * would land on the portfolio's 404 instead of the portal.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function href(path: string): string {
  return `${BASE_PATH}${path}`;
}
