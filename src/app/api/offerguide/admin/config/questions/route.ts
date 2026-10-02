import { OgQuestions } from "@/lib/db/mongo/models/index.js";
import { createCollectionHandlers } from "@/lib/offerguide/adminCrud";

// Full QuestionAdmin shape (scoreType, option scores, numericBands,
// nullScore) — unlike the candidate-facing /api/offerguide/config/questions
// route, which projects down to label/helpText/options only.
export const { GET, POST } = createCollectionHandlers(OgQuestions);
