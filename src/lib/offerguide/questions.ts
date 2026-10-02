import dbConnect from "@/utils/dbConnect";
import { OgQuestions, OgConsentToggles } from "@/lib/db/mongo/models/index.js";

const OTHER_TEXT_MAX_LENGTH = 255;

export function camelToSnake(fieldName: string): string {
  return fieldName.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

type QuestionOption = { value: string; active?: boolean };
type QuestionDoc = { scoreType: string; options?: QuestionOption[] };
type ConsentToggleDoc = { toggleId: string };

export type FieldValidationResult = { ok: true } | { ok: false; message: string };

/**
 * Validates a single field's value against OgQuestions' own live option list —
 * never a hardcoded list, so retiring an option via the admin API takes effect
 * without a code change here. Fields with no matching OgQuestions document
 * (free text, salary numbers, etc.) or a non-"enum" scoreType are pass-through.
 */
export async function validateEnumField(
  fieldName: string,
  value: unknown,
  otherText?: unknown
): Promise<FieldValidationResult> {
  if (value === undefined || value === null || value === "") return { ok: true };

  await dbConnect();
  const question = await OgQuestions.findOne({
    fieldId: camelToSnake(fieldName),
    active: true,
  }).lean<QuestionDoc | null>();

  if (!question || question.scoreType !== "enum") return { ok: true };

  const activeOptions = (question.options ?? []).filter(
    (opt) => opt.active !== false
  );
  const allowedValues = activeOptions.map((opt) => opt.value);

  if (typeof value !== "string" || !allowedValues.includes(value)) {
    return {
      ok: false,
      message: `"${value}" is not a valid value for ${fieldName}. Allowed: ${allowedValues.join(", ")}.`,
    };
  }

  if (value === "Other") {
    const text = typeof otherText === "string" ? otherText.trim() : "";
    if (!text) {
      return {
        ok: false,
        message: `${fieldName} requires free text when "Other" is selected.`,
      };
    }
    if (text.length > OTHER_TEXT_MAX_LENGTH) {
      return {
        ok: false,
        message: `${fieldName}'s free text exceeds the ${OTHER_TEXT_MAX_LENGTH} character limit.`,
      };
    }
  }

  return { ok: true };
}

/**
 * Validates consent selection keys against currently active OgConsentToggles —
 * retired/unknown toggle keys are rejected, not silently stored.
 */
export async function validateConsentSelections(
  selections: Record<string, unknown>
): Promise<FieldValidationResult> {
  await dbConnect();
  const activeToggles = await OgConsentToggles.find({ active: true })
    .select("toggleId")
    .lean<ConsentToggleDoc[]>();
  const activeToggleIds = new Set(activeToggles.map((t) => t.toggleId));

  const invalidKeys = Object.keys(selections).filter(
    (key) => !activeToggleIds.has(key)
  );

  if (invalidKeys.length > 0) {
    return {
      ok: false,
      message: `Unknown or retired consent toggle key(s): ${invalidKeys.join(", ")}.`,
    };
  }

  return { ok: true };
}
