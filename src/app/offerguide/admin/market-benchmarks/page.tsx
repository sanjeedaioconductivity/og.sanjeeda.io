import { MarketBenchmarksAdmin } from "./MarketBenchmarksAdmin";

/**
 * ADM-003 — Market Benchmarks (Epic 10.4). Its own screen rather than the shared
 * config-driven table: the percentile inputs need to sit in one row with live
 * p25<=p50<=p75 feedback, the low-sampleSize warning is bespoke, and the
 * collection is keyed on Mongo _id (no business key) so edit/retire carry _id.
 */
export default function MarketBenchmarksPage() {
  return <MarketBenchmarksAdmin />;
}
