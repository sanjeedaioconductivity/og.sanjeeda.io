/**
 * The light/dark theme's localStorage key, declared once.
 *
 * Kept free of React and the DOM — like palettes.ts — so the pre-paint inline
 * script in app/layout.tsx can read it from a SERVER component. It used to be
 * exported from theme-provider.tsx, which is a `'use client'` module: importing a
 * value from one of those into a server component yields a client-reference
 * proxy, not the string, and stringifying that proxy into the inline script
 * produced `var k='function(){throw Error("...It's not possible...")}'` — an
 * unterminated string that threw `SyntaxError: Unexpected identifier 's'` on
 * every page load and silently disabled the flash-of-wrong-theme guard.
 */
export const THEME_STORAGE_KEY = "portal-theme";
