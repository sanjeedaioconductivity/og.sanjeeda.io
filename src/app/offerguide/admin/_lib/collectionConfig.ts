/**
 * Per-collection descriptors for the shared admin table + form (Story 10.5.1).
 *
 * Functional Domains and Consent Toggles are the same screen with a different
 * field list, so they are config objects here rather than two near-duplicate
 * components. Geography and Questions and Market Benchmarks are NOT driven from
 * this file — they each need bespoke form bodies (embedded cities; scoreType-
 * dependent editors; percentile validation) and get their own screens.
 *
 * `key` is the field the admin API keys on for GET/PUT/DELETE of one item, and
 * it is immutable once set — the business key other data depends on. The form
 * only lets you edit it on create.
 */

import type { AdminCollection } from "./adminNav";

export type FieldKind = "text" | "textarea" | "number" | "boolean";

export type FieldSpec = {
  name: string;
  label: string;
  kind: FieldKind;
  /** Required on create. */
  required?: boolean;
  /** Not editable after create — the business key. */
  immutable?: boolean;
  /** Shown in the table as a column. */
  inTable?: boolean;
  help?: string;
  /** Read-only in the form (e.g. a server-managed flag shown for context). */
  readOnly?: boolean;
};

export type CollectionConfig = {
  collection: AdminCollection;
  /** Singular noun for buttons and confirms: "Add domain", "Retire toggle". */
  noun: string;
  /** The business key field name. */
  keyField: string;
  fields: FieldSpec[];
  /** Optional client-side check returning an error message, or null if valid. */
  validate?: (values: Record<string, unknown>) => string | null;
};

export const FUNCTIONAL_DOMAINS_CONFIG: CollectionConfig = {
  collection: "functional-domains",
  noun: "domain",
  keyField: "domainId",
  fields: [
    {
      name: "domainId",
      label: "Domain ID",
      kind: "text",
      required: true,
      immutable: true,
      inTable: true,
      help: "Stable identifier. Cannot be changed once created.",
    },
    { name: "name", label: "Name", kind: "text", required: true, inTable: true },
    { name: "sortOrder", label: "Sort order", kind: "number", inTable: true },
  ],
};

export const CONSENT_TOGGLES_CONFIG: CollectionConfig = {
  collection: "consent-toggles",
  noun: "toggle",
  keyField: "toggleId",
  fields: [
    {
      name: "toggleId",
      label: "Toggle ID",
      kind: "text",
      required: true,
      immutable: true,
      inTable: true,
      help: "e.g. consent_salary_ranges. Cannot be changed once created.",
    },
    { name: "label", label: "Label", kind: "text", required: true, inTable: true },
    { name: "helpText", label: "Help text", kind: "textarea", required: true },
    {
      name: "sourceScreen",
      label: "Source screen",
      kind: "text",
      required: true,
      inTable: true,
      help: "Which wizard screen's data this consent covers, e.g. SCR-004.",
    },
    {
      name: "isMaster",
      label: "Master toggle",
      kind: "boolean",
      readOnly: true,
      inTable: true,
      help: "The master toggle cannot be retired. Set in seed data, not editable here.",
    },
    { name: "sortOrder", label: "Sort order", kind: "number" },
  ],
};
