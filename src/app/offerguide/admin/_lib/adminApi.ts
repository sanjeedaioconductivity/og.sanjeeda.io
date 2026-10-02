/**
 * Thin client over `/api/offerguide/admin/config/*` (Sprint 10).
 *
 * The admin API already exists and is unchanged by this sprint — 28 of its 30
 * operations are reused exactly as they are. This is the one place the screens
 * talk to it, so the response conventions are decoded once:
 *
 *   - Every error is `{ error, message }`. `message` is written for a human
 *     and is what the form shows; `error` is the machine code.
 *   - 409 is a rule, not a failure: the master consent toggle refusing to
 *     retire, a duplicate city, a duplicate {role, location}. The FRS wants
 *     these shown inline where the admin acted, not as a red toast.
 *   - Mongo's duplicate-key error arrives as a 400 whose message contains
 *     `E11000`. `friendlyMessage()` rewrites it (Story 10.4.3) — the raw text
 *     names an index, which tells an admin nothing.
 *
 * Auth rides on the httpOnly portalToken cookie via `credentials: "include"`;
 * nothing here ever sees or sends a token.
 */

import type { AdminCollection } from "./adminNav";

const BASE = "/api/offerguide/admin/config";

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
    this.name = "AdminApiError";
  }

  /** A rule the server enforced (409), as opposed to a bad request or an outage. */
  get isConflict() {
    return this.status === 409;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* empty or non-JSON */
  }

  if (!res.ok) {
    const b = (body ?? {}) as { error?: string; message?: string };
    throw new AdminApiError(
      friendlyMessage(b.message ?? `Request failed (${res.status})`),
      res.status,
      b.error ?? "error"
    );
  }

  return body as T;
}

/**
 * Turns server messages that name database internals into ones an admin can
 * act on. Only Mongo's duplicate-key text is rewritten today; everything else
 * is already written for a person.
 */
export function friendlyMessage(message: string): string {
  if (/E11000/.test(message)) {
    return "One of these already exists — edit the existing entry instead of creating a new one.";
  }
  return message;
}

export const adminApi = {
  list<T>(collection: AdminCollection) {
    return request<T[]>(`/${collection}`);
  },

  get<T>(collection: AdminCollection, id: string) {
    return request<T>(`/${collection}/${encodeURIComponent(id)}`);
  },

  create<T>(collection: AdminCollection, body: unknown) {
    return request<T>(`/${collection}`, { method: "POST", body: JSON.stringify(body) });
  },

  /** Partial merge — the factory's PUT only touches the fields sent. */
  update<T>(collection: AdminCollection, id: string, body: unknown) {
    return request<T>(`/${collection}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  /** Soft delete: sets active:false and returns the retired document. */
  retire<T>(collection: AdminCollection, id: string) {
    return request<T>(`/${collection}/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  /** The reverse of retire — a plain partial PUT, per Story 10.3.4. */
  reactivate<T>(collection: AdminCollection, id: string) {
    return request<T>(`/${collection}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ active: true }),
    });
  },

  // Geography's embedded cities have their own sub-resource routes rather than
  // being array edits on the parent — see the city route files' own comments.
  addCity<T>(countryCode: string, city: { cityId: string; name: string }) {
    return request<T>(`/geography/${encodeURIComponent(countryCode)}/cities`, {
      method: "POST",
      body: JSON.stringify(city),
    });
  },

  patchCity<T>(countryCode: string, cityId: string, patch: { name?: string; active?: boolean }) {
    return request<T>(
      `/geography/${encodeURIComponent(countryCode)}/cities/${encodeURIComponent(cityId)}`,
      { method: "PATCH", body: JSON.stringify(patch) }
    );
  },

  // Scoring's two Sprint-10 additions. activate flips the active pointer;
  // preview is a read-only dry run against the golden fixtures.
  activateScoring<T>(version: number) {
    return request<T>(`/scoring/${version}/activate`, { method: "POST" });
  },

  previewScoring<T>(version: number) {
    return request<T>(`/scoring/${version}/preview`);
  },
};
