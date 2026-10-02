"use client";

/**
 * The create/edit form for a config-driven collection (Story 10.5.1).
 *
 * Renders one input per FieldSpec, in a Sheet slide-over so the list stays
 * visible behind it (UI/UX doc). The same component serves create and edit —
 * the difference is that immutable key fields are locked once a record exists.
 *
 * Server errors surface INLINE at the top of the form, not as a toast: a 409
 * (duplicate key, or a rule the server enforces) is information the admin needs
 * where they are working, per the FRS's "show, then explain" stance.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { adminApi, AdminApiError } from "../_lib/adminApi";
import type { CollectionConfig, FieldSpec } from "../_lib/collectionConfig";

export type AdminRecord = Record<string, unknown> & { _id?: string };

function initialValues(config: CollectionConfig, record: AdminRecord | null) {
  const values: Record<string, unknown> = {};
  for (const f of config.fields) {
    values[f.name] =
      record?.[f.name] ?? (f.kind === "boolean" ? false : f.kind === "number" ? 0 : "");
  }
  return values;
}

export function AdminCollectionForm({
  config,
  record,
  open,
  onClose,
  onSaved,
}: {
  config: CollectionConfig;
  /** null → create; a record → edit. */
  record: AdminRecord | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = record !== null;
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    initialValues(config, record)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setField = (name: string, value: unknown) => {
    setValues((v) => ({ ...v, [name]: value }));
    setError(null);
  };

  const handleSave = async () => {
    // Required-field check before hitting the network.
    for (const f of config.fields) {
      if (f.required && !f.readOnly && String(values[f.name] ?? "").trim() === "") {
        setError(`${f.label} is required.`);
        return;
      }
    }

    const clientError = config.validate?.(values);
    if (clientError) {
      setError(clientError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        // Never send an immutable key or a read-only field back on edit.
        const patch: Record<string, unknown> = {};
        for (const f of config.fields) {
          if (f.immutable || f.readOnly) continue;
          patch[f.name] = values[f.name];
        }
        await adminApi.update(config.collection, String(record![config.keyField]), patch);
      } else {
        const body: Record<string, unknown> = {};
        for (const f of config.fields) {
          if (f.readOnly) continue;
          body[f.name] = values[f.name];
        }
        await adminApi.create(config.collection, body);
      }
      onSaved();
      onClose();
    } catch (err) {
      // Inline, including the 409 duplicate-key case the api client rewrites.
      setError(err instanceof AdminApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? `Edit ${config.noun}` : `Add ${config.noun}`}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? `Editing ${String(record?.[config.keyField] ?? "")}.`
              : `Create a new ${config.noun}.`}
          </SheetDescription>
        </SheetHeader>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
          >
            {error}
          </p>
        )}

        <div className="mt-4 space-y-4">
          {config.fields.map((field) => (
            <FieldControl
              key={field.name}
              field={field}
              value={values[field.name]}
              locked={isEdit && (field.immutable ?? false)}
              onChange={(v) => setField(field.name, v)}
            />
          ))}
        </div>

        <SheetFooter className="mt-6 flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : `Add ${config.noun}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FieldControl({
  field,
  value,
  locked,
  onChange,
}: {
  field: FieldSpec;
  value: unknown;
  locked: boolean;
  onChange: (value: unknown) => void;
}) {
  const disabled = locked || field.readOnly;
  const id = `field-${field.name}`;

  if (field.kind === "boolean") {
    return (
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor={id}>{field.label}</Label>
          {field.help && <p className="text-xs text-slate-500">{field.help}</p>}
        </div>
        <Switch
          id={id}
          checked={Boolean(value)}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {field.label}
        {field.required && !field.readOnly && <span className="text-red-500"> *</span>}
        {locked && <span className="ml-2 text-xs font-normal text-slate-400">(cannot change)</span>}
      </Label>
      {field.kind === "textarea" ? (
        <textarea
          id={id}
          value={String(value ?? "")}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        />
      ) : (
        <Input
          id={id}
          type={field.kind === "number" ? "number" : "text"}
          value={String(value ?? "")}
          disabled={disabled}
          onChange={(e) =>
            onChange(field.kind === "number" ? Number(e.target.value) : e.target.value)
          }
        />
      )}
      {field.help && !locked && <p className="text-xs text-slate-500">{field.help}</p>}
    </div>
  );
}
