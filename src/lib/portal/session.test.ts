// Sprint 9 — the session-changed announcement.
//
// This mechanism exists because of a reported bug: logging in as an admin left
// the nav on the guest tier until a hard refresh. AuthProvider lives in the root
// layout and never unmounts, so a client-side navigation after login does not
// make it re-read the session. Login and logout now announce; the provider
// listens.
//
// The tests below pin the contract that fix depends on — announce reaches every
// subscriber, and unsubscribing actually stops delivery.

import { describe, it, expect, vi } from "vitest";
import { announceAuthChange, onAuthChange } from "./session";

/** BroadcastChannel delivery is asynchronous even in-process. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("announceAuthChange / onAuthChange", () => {
  it("notifies a subscriber", async () => {
    const handler = vi.fn();
    const unsubscribe = onAuthChange(handler);

    announceAuthChange();
    await settle();

    expect(handler).toHaveBeenCalled();
    unsubscribe();
  });

  it("notifies every subscriber — one per open tab", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubFirst = onAuthChange(first);
    const unsubSecond = onAuthChange(second);

    announceAuthChange();
    await settle();

    expect(first).toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
    unsubFirst();
    unsubSecond();
  });

  it("stops delivering after unsubscribe — no update on an unmounted provider", async () => {
    const handler = vi.fn();
    onAuthChange(handler)();

    announceAuthChange();
    await settle();

    expect(handler).not.toHaveBeenCalled();
  });

  it("announcing with nobody listening is not an error", () => {
    expect(() => announceAuthChange()).not.toThrow();
  });

  it("subscribing returns a callable unsubscribe even when unsupported", () => {
    const unsubscribe = onAuthChange(() => {});
    expect(typeof unsubscribe).toBe("function");
    expect(() => unsubscribe()).not.toThrow();
  });
});
