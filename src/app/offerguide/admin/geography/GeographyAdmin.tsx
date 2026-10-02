"use client";

/**
 * ADM-004 — Geography admin (Story 10.5.2).
 *
 * Countries are the generic soft-delete collection; cities are the twist. They
 * are embedded in the country document with `_id: false` — no independent
 * identity — so the API models them as sub-resources of their country
 * (`POST /geography/{cc}/cities`, `PATCH /geography/{cc}/cities/{cityId}`), not
 * a collection of their own. The UI matches that shape: a country row expands
 * (accordion) to reveal its cities as an inline add / retire list. There is
 * deliberately no standalone city screen — that would misrepresent the model.
 *
 * A city retire is a PATCH {active:false}; there is no city DELETE, matching
 * the soft-delete rule the rest of /admin/config/* follows.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { adminApi, AdminApiError } from "../_lib/adminApi";

type City = { cityId: string; name: string; active?: boolean };
type Country = {
  countryCode: string;
  countryName: string;
  active?: boolean;
  cities?: City[];
};

type Filter = "active" | "retired" | "all";

export function GeographyAdmin() {
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addingCountry, setAddingCountry] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setCountries(await adminApi.list<Country>("geography"));
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Failed to load.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (!countries) return [];
    const q = search.trim().toLowerCase();
    return countries
      .filter((c) => {
        const active = c.active !== false;
        if (filter === "active" && !active) return false;
        if (filter === "retired" && active) return false;
        return true;
      })
      .filter((c) =>
        q === ""
          ? true
          : c.countryName.toLowerCase().includes(q) || c.countryCode.toLowerCase().includes(q)
      )
      .sort((a, b) => a.countryName.localeCompare(b.countryName));
  }, [countries, filter, search]);

  const setCountryActive = async (c: Country, active: boolean) => {
    setBusy(c.countryCode);
    setRowError(null);
    try {
      if (active) await adminApi.reactivate("geography", c.countryCode);
      else await adminApi.retire("geography", c.countryCode);
      await load();
    } catch (err) {
      setRowError({
        id: c.countryCode,
        message: err instanceof AdminApiError ? err.message : "Couldn't update this country.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="retired">Retired</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search countries…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-xs"
        />
        <Button className="ml-auto" onClick={() => setAddingCountry(true)}>
          <Plus size={16} className="mr-1" />
          Add country
        </Button>
      </div>

      {loadError && (
        <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          {loadError}
        </p>
      )}

      {countries === null && !loadError && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
          ))}
        </div>
      )}

      {countries !== null && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#0b163f]/20 p-10 text-center text-sm text-slate-500 dark:border-white/20 dark:text-slate-400">
          {search || filter !== "active" ? "No countries match this view." : "No countries yet — add the first one."}
        </div>
      )}

      <div className="space-y-2">
        {visible.map((country) => {
          const active = country.active !== false;
          const isOpen = expanded === country.countryCode;
          const cityCount = country.cities?.filter((c) => c.active !== false).length ?? 0;
          return (
            <div
              key={country.countryCode}
              className={cn(
                "overflow-hidden rounded-xl border border-[#0b163f]/10 dark:border-white/10",
                !active && "opacity-55"
              )}
            >
              <div className="flex items-center gap-2 bg-white px-3 py-2.5 dark:bg-white/5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${country.countryName}`}
                  onClick={() => setExpanded(isOpen ? null : country.countryCode)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <ChevronDown size={16} className={cn("shrink-0 transition", isOpen && "rotate-180")} />
                  <span className="font-bold text-[#0b163f] dark:text-white">{country.countryName}</span>
                  <span className="text-xs font-semibold text-slate-400">{country.countryCode}</span>
                  <span className="text-xs text-slate-400">
                    {cityCount} {cityCount === 1 ? "city" : "cities"}
                  </span>
                </button>
                {active ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-500">Active</Badge>
                ) : (
                  <Badge variant="secondary" className="text-slate-500">Retired</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={active ? `Retire ${country.countryCode}` : `Reactivate ${country.countryCode}`}
                  disabled={busy === country.countryCode}
                  onClick={() => setCountryActive(country, !active)}
                >
                  {active ? <Archive size={15} /> : <RotateCcw size={15} />}
                </Button>
              </div>

              {rowError?.id === country.countryCode && (
                <p role="alert" className="bg-white px-3 pb-2 text-xs font-semibold text-amber-600 dark:bg-white/5 dark:text-amber-400">
                  {rowError.message}
                </p>
              )}

              {isOpen && (
                <CityEditor countryCode={country.countryCode} cities={country.cities ?? []} onChanged={load} />
              )}
            </div>
          );
        })}
      </div>

      <AddCountrySheet
        open={addingCountry}
        onClose={() => setAddingCountry(false)}
        onSaved={load}
      />
    </div>
  );
}

function CityEditor({
  countryCode,
  cities,
  onChanged,
}: {
  countryCode: string;
  cities: City[];
  onChanged: () => void;
}) {
  const [cityId, setCityId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const add = async () => {
    if (!cityId.trim() || !name.trim()) {
      setError("Both city ID and name are required.");
      return;
    }
    setBusy("add");
    setError(null);
    try {
      await adminApi.addCity(countryCode, { cityId: cityId.trim(), name: name.trim() });
      setCityId("");
      setName("");
      onChanged();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Couldn't add the city.");
    } finally {
      setBusy(null);
    }
  };

  const setCityActive = async (city: City, active: boolean) => {
    setBusy(city.cityId);
    setError(null);
    try {
      await adminApi.patchCity(countryCode, city.cityId, { active });
      onChanged();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Couldn't update the city.");
    } finally {
      setBusy(null);
    }
  };

  const sorted = [...cities].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="border-t border-[#0b163f]/10 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.02]">
      {sorted.length === 0 ? (
        <p className="mb-3 text-xs text-slate-500">No cities yet.</p>
      ) : (
        <ul className="mb-3 divide-y divide-[#0b163f]/5 dark:divide-white/5">
          {sorted.map((city) => {
            const active = city.active !== false;
            return (
              <li key={city.cityId} className={cn("flex items-center gap-2 py-1.5", !active && "opacity-55")}>
                <span className="flex-1 text-sm text-[#0b163f] dark:text-slate-200">
                  {city.name}
                  <span className="ml-2 text-xs text-slate-400">{city.cityId}</span>
                </span>
                {!active && <span className="text-xs font-semibold text-slate-400">Retired</span>}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={active ? `Retire ${city.cityId}` : `Reactivate ${city.cityId}`}
                  disabled={busy === city.cityId}
                  onClick={() => setCityActive(city, !active)}
                >
                  {active ? <Archive size={14} /> : <RotateCcw size={14} />}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor={`city-id-${countryCode}`} className="text-xs">City ID</Label>
          <Input id={`city-id-${countryCode}`} value={cityId} onChange={(e) => setCityId(e.target.value)} className="h-8 w-32" />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`city-name-${countryCode}`} className="text-xs">Name</Label>
          <Input id={`city-name-${countryCode}`} value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-44" />
        </div>
        <Button size="sm" disabled={busy === "add"} onClick={add}>
          <Plus size={14} className="mr-1" />
          Add city
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
          {error}
        </p>
      )}
    </div>
  );
}

function AddCountrySheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!countryCode.trim() || !countryName.trim()) {
      setError("Both country code and name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminApi.create("geography", {
        countryCode: countryCode.trim().toUpperCase(),
        countryName: countryName.trim(),
        cities: [],
      });
      setCountryCode("");
      setCountryName("");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Couldn't add the country.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add country</SheetTitle>
          <SheetDescription>Cities are added afterwards, from the country&apos;s row.</SheetDescription>
        </SheetHeader>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-country-code">Country code <span className="text-red-500">*</span></Label>
            <Input id="new-country-code" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} placeholder="PK" />
            <p className="text-xs text-slate-500">ISO code. Stored uppercase; cannot be changed later.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-country-name">Country name <span className="text-red-500">*</span></Label>
            <Input id="new-country-name" value={countryName} onChange={(e) => setCountryName(e.target.value)} placeholder="Pakistan" />
          </div>
        </div>

        <SheetFooter className="mt-6 flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Add country"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
