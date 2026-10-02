"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_RESOURCES, adminHref } from "../_lib/adminNav";
import { useCollectionSummary } from "../_lib/useCollectionSummary";

/**
 * One landing-page card per admin resource (ADM-000). The whole card is the
 * link, and the count line is the only live data on the landing page.
 *
 * Takes the SEGMENT, not the destination object. The landing page is a server
 * component and this is a client component, and a destination carries `icon`
 * — a function. Functions cannot cross the server→client boundary as props
 * ("Functions cannot be passed directly to Client Components"), which 500s the
 * whole page. Looking the destination up here keeps the icon on the client.
 *
 * Colour conventions follow the UI/UX doc: green for active, muted grey for
 * retired — never red, because a retired document was soft-deleted and nothing
 * was destroyed.
 */
export function CollectionCard({ segment }: { segment: string }) {
  const destination = ADMIN_RESOURCES.find((d) => d.segment === segment);
  if (!destination) throw new Error(`CollectionCard: unknown admin resource "${segment}"`);

  const { label, icon: Icon, blurb, screenId, collection } = destination;
  const summary = useCollectionSummary(collection);

  return (
    <Link href={adminHref(segment)} className="group block focus:outline-none">
      <Card className="h-full border-[#0b163f]/10 transition group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_50px_rgba(11,22,63,0.12)] group-focus-visible:ring-2 group-focus-visible:ring-[#1746b5] dark:border-white/10">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9efff] text-[#1746b5] dark:bg-white/10 dark:text-[#8eb4ff]">
            <Icon size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {label}
              <span className="text-[10px] font-semibold text-slate-400">{screenId}</span>
            </CardTitle>
            {blurb && <CardDescription className="mt-1">{blurb}</CardDescription>}
          </div>
          <ArrowRight
            size={16}
            className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1746b5]"
          />
        </CardHeader>
        <CardContent>
          <SummaryLine summary={summary} />
        </CardContent>
      </Card>
    </Link>
  );
}

function SummaryLine({ summary }: { summary: ReturnType<typeof useCollectionSummary> }) {
  switch (summary.kind) {
    case "loading":
      return <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-white/10" />;

    case "error":
      return (
        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
          Couldn&apos;t load counts ({summary.message})
        </p>
      );

    case "versions":
      return (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-[#0b163f] dark:text-white">
            {summary.total} {summary.total === 1 ? "version" : "versions"}
          </span>
          {summary.activeVersion !== null ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-500">
              v{summary.activeVersion} active
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              none active
            </Badge>
          )}
        </div>
      );

    case "counts":
      return (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge className="bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-500">
            {summary.active} active
          </Badge>
          {summary.retired > 0 && (
            <Badge variant="secondary" className="text-slate-500">
              {summary.retired} retired
            </Badge>
          )}
        </div>
      );
  }
}
