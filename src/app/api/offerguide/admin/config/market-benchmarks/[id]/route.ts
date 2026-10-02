import { OgMarketBenchmarks } from "@/lib/db/mongo/models/index.js";
import { createItemHandlers } from "@/lib/offerguide/adminCrud";

export const { GET, PUT, DELETE } = createItemHandlers(OgMarketBenchmarks);
