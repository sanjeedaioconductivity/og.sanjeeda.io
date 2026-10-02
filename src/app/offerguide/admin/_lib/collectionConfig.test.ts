// Sprint 10, Epic 10.5 — the config-driven collection descriptors.
//
// Functional Domains and Consent Toggles are the same component driven by these
// two objects. These pin the properties the shared form/table depend on: the
// key field exists and is immutable, every table field is a real field, and the
// consent master flag is read-only (the FRS says isMaster is set in seed data
// and shown for context, never edited here).

import { describe, it, expect } from "vitest";
import {
  CONSENT_TOGGLES_CONFIG,
  FUNCTIONAL_DOMAINS_CONFIG,
  type CollectionConfig,
} from "./collectionConfig";

const CONFIGS: CollectionConfig[] = [FUNCTIONAL_DOMAINS_CONFIG, CONSENT_TOGGLES_CONFIG];

describe.each(CONFIGS)("$collection config", (config) => {
  it("declares its key field, and that field is one of its fields", () => {
    const key = config.fields.find((f) => f.name === config.keyField);
    expect(key, `keyField ${config.keyField} is not in fields`).toBeDefined();
  });

  it("the key field is immutable and required", () => {
    const key = config.fields.find((f) => f.name === config.keyField)!;
    expect(key.immutable).toBe(true);
    expect(key.required).toBe(true);
  });

  it("every table field is a declared field", () => {
    const names = new Set(config.fields.map((f) => f.name));
    for (const f of config.fields.filter((f) => f.inTable)) {
      expect(names.has(f.name)).toBe(true);
    }
  });

  it("has a singular noun for buttons and confirms", () => {
    expect(config.noun).toBeTruthy();
    expect(config.noun).not.toMatch(/s$/); // singular: "domain", "toggle"
  });
});

describe("consent toggles", () => {
  it("shows isMaster read-only — set in seed data, never edited here", () => {
    const isMaster = CONSENT_TOGGLES_CONFIG.fields.find((f) => f.name === "isMaster");
    expect(isMaster?.readOnly).toBe(true);
    expect(isMaster?.kind).toBe("boolean");
  });

  it("keys on toggleId", () => {
    expect(CONSENT_TOGGLES_CONFIG.keyField).toBe("toggleId");
  });
});

describe("functional domains", () => {
  it("keys on domainId and is the minimal field set", () => {
    expect(FUNCTIONAL_DOMAINS_CONFIG.keyField).toBe("domainId");
    expect(FUNCTIONAL_DOMAINS_CONFIG.fields.map((f) => f.name).sort()).toEqual(
      ["domainId", "name", "sortOrder"].sort()
    );
  });
});
