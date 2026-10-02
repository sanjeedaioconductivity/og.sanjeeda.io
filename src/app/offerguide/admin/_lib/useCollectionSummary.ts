"use client";

/**
 * Live active/retired counts for one admin collection (Story 10.1.2).
 *
 * Reads the collection's existing `GET /admin/config/{collection}` — the same
 * unchanged endpoint the resource screens will use — and counts client-side.
 * These collections are small (a few dozen documents at most), so pulling the
 * list to count it costs nothing meaningful and avoids inventing a count
 * endpoint the API does not have.
 *
 * Scoring is the odd one out: it has versions rather than active/retired rows,
 * so its summary is "N versions, vX active". Everything else soft-deletes with
 * an `active` flag, per the admin contract.
 */

import { useEffect, useState } from "react";
import type { AdminCollection } from "./adminNav";

export type CollectionSummary =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "counts"; active: number; retired: number }
  | { kind: "versions"; total: number; activeVersion: number | null };

type Row = { active?: boolean; version?: number; isActive?: boolean };

export function useCollectionSummary(collection: AdminCollection): CollectionSummary {
  const [summary, setSummary] = useState<CollectionSummary>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/offerguide/admin/config/${collection}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`${res.status}`);

        const rows = (await res.json()) as Row[];

        if (collection === "scoring") {
          const active = rows.find((r) => r.isActive)?.version ?? null;
          setSummary({ kind: "versions", total: rows.length, activeVersion: active });
        } else {
          // `active` defaults to true on every schema, so a row that simply lacks
          // the field is live, not retired.
          const retired = rows.filter((r) => r.active === false).length;
          setSummary({ kind: "counts", active: rows.length - retired, retired });
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setSummary({ kind: "error", message: (error as Error).message });
      }
    })();

    return () => controller.abort();
  }, [collection]);

  return summary;
}
