import { OgQuestions } from "@/lib/db/mongo/models/index.js";
import { createItemHandlers } from "@/lib/offerguide/adminCrud";

// Keyed on fieldId (e.g. "offer_employment_type"), not the Mongo _id — that's
// the identifier the contract's path parameter declares, and it's the one an
// admin editing configuration actually has to hand.
export const { GET, PUT, DELETE } = createItemHandlers(OgQuestions, {
  keyField: "fieldId",
});
