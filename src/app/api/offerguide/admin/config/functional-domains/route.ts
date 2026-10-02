import { OgFunctionalDomains } from "@/lib/db/mongo/models/index.js";
import { createCollectionHandlers } from "@/lib/offerguide/adminCrud";

export const { GET, POST } = createCollectionHandlers(OgFunctionalDomains);
