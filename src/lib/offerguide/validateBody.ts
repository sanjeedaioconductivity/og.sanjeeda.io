import { validateEnumField } from "@/lib/offerguide/questions";

/**
 * Runs every top-level field in a PATCH/POST body through OgQuestions-backed
 * enum validation. Fields with no matching (active, scoreType "enum") question
 * document are a silent pass-through — this only enforces validation OgQuestions
 * actually defines, never a hardcoded field list. "*OtherText" companion keys are
 * skipped as direct targets (they're consumed as the paired field's free text).
 */
export async function validateOfferFields(
  body: Record<string, unknown>
): Promise<string | null> {
  for (const [key, value] of Object.entries(body)) {
    if (key.endsWith("OtherText")) continue;
    const otherTextKey = `${key}OtherText`;
    const result = await validateEnumField(key, value, body[otherTextKey]);
    if (!result.ok) return result.message;
  }
  return null;
}
