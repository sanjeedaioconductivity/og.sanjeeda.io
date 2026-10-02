import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { CollectionCard } from "./_components/CollectionCard";
import { ADMIN_RESOURCES, API_DOCS_LINK } from "./_lib/adminNav";

/**
 * ADM-000 — Admin landing (Sprint 10, Story 10.1.2).
 *
 * Six cards, one per admin-managed collection, each showing a live count. The
 * seventh, unstyled link to the raw contract stays present per the FRS — it is
 * still the reference for what the API actually accepts.
 *
 * Deliberately NOT here, per the FRS's resolved decision: a "current admins"
 * list. Admin identity is script-only by Sprint 9 design, this sprint is about
 * configuration rather than admin management, and no read endpoint for it
 * exists. That stays an `npm run admins` fact.
 */
export default function AdminLandingPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight text-[#0b163f] dark:text-white">
          Configuration
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Everything the wizard and the scoring engine read from Mongo, editable
          here for the first time. Changes take effect on a candidate&apos;s next
          request — nothing is cached.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ADMIN_RESOURCES.map(({ segment }) => (
          <CollectionCard key={segment} segment={segment} />
        ))}
      </div>

      <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
        Raw contract:{" "}
        <Link
          href={API_DOCS_LINK.href}
          className="inline-flex items-center gap-1 font-semibold text-[#1746b5] underline-offset-2 hover:underline dark:text-[#8eb4ff]"
        >
          {API_DOCS_LINK.label}
          <ExternalLink size={13} />
        </Link>
      </p>
    </div>
  );
}
