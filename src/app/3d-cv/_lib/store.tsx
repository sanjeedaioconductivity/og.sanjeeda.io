'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CareerStage, DimensionId } from './dimensions';
import { completionPercent } from './dimensions';
import {
  EMPTY_ATTRIBUTES,
  EMPTY_ENTRIES,
  scoreOf,
  type AttributeName,
  type Attributes,
  type AttributeValue,
  type EntriesByDimension,
  type Entry,
  type ListDimensionId,
  newId,
} from './entries';
import { SAMPLE_BASIC_PROFILE, sampleExtracted, sampleExtras } from './sample';
import { makeVersion, type CvVersion } from './cv';
import type { JobDescription } from './jobs';
import type { CvMode, ProfileSnapshot } from './matching';

/**
 * Client-side state for the Phase 1 prototype.
 *
 * There is no backend yet, so the whole journey lives in React state and is
 * mirrored to localStorage, letting a reviewer refresh or come back without
 * losing their place. localStorage is per-browser and can be unavailable
 * (private windows, blocked storage), so every access is wrapped and the app
 * still works without it. This file is the seam a real API replaces later.
 */

export type StartMethod = 'upload' | 'manual' | 'mentor' | 'skip';

export interface Account {
  fullName: string;
  email: string;
  mobile: string;
  city: string;
  careerStage: CareerStage | '';
  signupMethod: 'email' | 'google' | 'linkedin' | 'otp';
  wantsMentor: boolean;
}

export interface UploadItem {
  id: string;
  kind: 'file' | 'linkedin';
  name: string;
  /** Bytes for files; 0 for a LinkedIn URL. */
  size: number;
}

export interface BasicProfile {
  fullName: string;
  title: string;
  email: string;
  mobile: string;
  city: string;
  linkedin: string;
  portfolio: string;
  careerStage: CareerStage | '';
  jobFamilies: string[];
  preferredLocation: string;
  confirmed: boolean;
}

export interface Cv3dState {
  account: Account | null;
  startMethod: StartMethod | null;
  uploads: UploadItem[];
  extracted: boolean;
  basic: BasicProfile;
  entries: EntriesByDimension;
  attributes: Attributes;
  mentorRequested: boolean;
  /** The job description being tailored for, before a CV is generated from it. */
  currentJob: JobDescription | null;
  versions: CvVersion[];
}

// v2: dimension scores are now derived from entries instead of stored.
const STORAGE_KEY = 'sanjeeda.3dcv.v2';

const EMPTY_BASIC: BasicProfile = {
  fullName: '',
  title: '',
  email: '',
  mobile: '',
  city: '',
  linkedin: '',
  portfolio: '',
  careerStage: '',
  jobFamilies: [],
  preferredLocation: '',
  confirmed: false,
};

const INITIAL: Cv3dState = {
  account: null,
  startMethod: null,
  uploads: [],
  extracted: false,
  basic: EMPTY_BASIC,
  entries: EMPTY_ENTRIES,
  attributes: EMPTY_ATTRIBUTES,
  mentorRequested: false,
  currentJob: null,
  versions: [],
};

/** The profile as a CV version stores it. */
export function snapshotOf(state: Cv3dState): ProfileSnapshot {
  const { confirmed, ...basic } = state.basic;
  void confirmed;
  return { basic, entries: state.entries, attributes: state.attributes };
}

export function stageOf(state: Cv3dState): CareerStage {
  return state.basic.careerStage || state.account?.careerStage || 'junior';
}

/** Fields the candidate typed at signup win over anything "extracted" from a CV. */
function basicFromAccount(account: Account | null, base: BasicProfile): BasicProfile {
  if (!account) return base;
  return {
    ...base,
    fullName: account.fullName || base.fullName,
    email: account.email || base.email,
    mobile: account.mobile || base.mobile,
    city: account.city || base.city,
    careerStage: account.careerStage || base.careerStage,
  };
}

interface Cv3dContextValue {
  state: Cv3dState;
  hydrated: boolean;
  scores: Record<DimensionId, number>;
  completion: number;
  saveEntry: (dimension: ListDimensionId, entry: Entry) => void;
  removeEntry: (dimension: ListDimensionId, id: string) => void;
  addSampleEntries: (dimension: ListDimensionId) => void;
  setAttribute: (name: AttributeName, patch: Partial<AttributeValue>) => void;
  createAccount: (account: Account) => void;
  chooseStart: (method: StartMethod) => void;
  setUploads: (uploads: UploadItem[]) => void;
  runExtraction: () => void;
  saveBasic: (basic: Omit<BasicProfile, 'confirmed'>) => void;
  requestMentor: () => void;
  setJob: (job: JobDescription | null) => void;
  /** Snapshots the profile into a new CV version for the current job. Returns its id. */
  createVersion: (mode: CvMode) => string;
  updateVersion: (id: string, patch: Partial<CvVersion>) => void;
  deleteVersion: (id: string) => void;
  reset: () => void;
}

const Cv3dContext = createContext<Cv3dContextValue | null>(null);

export function Cv3dProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Cv3dState>(INITIAL);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Cv3dState>;
        // Storage only exists in the browser, so it can't seed useState without a
        // server/client hydration mismatch; loading it once after mount is the point.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState({
          ...INITIAL,
          ...saved,
          basic: { ...EMPTY_BASIC, ...saved.basic },
          entries: { ...EMPTY_ENTRIES, ...saved.entries },
          attributes: { ...EMPTY_ATTRIBUTES, ...saved.attributes },
          versions: saved.versions ?? [],
          currentJob: saved.currentJob ?? null,
        });
      }
    } catch {
      // Unreadable or blocked storage: start fresh.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: the session still works, it just won't survive a refresh.
    }
  }, [state, hydrated]);

  const createAccount = useCallback((account: Account) => {
    setState((s) => ({
      ...s,
      account,
      basic: basicFromAccount(account, s.basic),
    }));
  }, []);

  const chooseStart = useCallback((method: StartMethod) => {
    setState((s) => ({
      ...s,
      startMethod: method,
      mentorRequested: s.mentorRequested || method === 'mentor',
    }));
  }, []);

  const setUploads = useCallback((uploads: UploadItem[]) => {
    setState((s) => ({ ...s, uploads }));
  }, []);

  const runExtraction = useCallback(() => {
    const sample = sampleExtracted();
    setState((s) => ({
      ...s,
      extracted: true,
      entries: sample.entries,
      attributes: sample.attributes,
      basic: basicFromAccount(s.account, {
        ...SAMPLE_BASIC_PROFILE,
        jobFamilies: [...SAMPLE_BASIC_PROFILE.jobFamilies],
        confirmed: false,
      }),
    }));
  }, []);

  const saveBasic = useCallback((basic: Omit<BasicProfile, 'confirmed'>) => {
    setState((s) => ({ ...s, basic: { ...basic, confirmed: true } }));
  }, []);

  /** Insert, or replace the entry with the same id. */
  const saveEntry = useCallback((dimension: ListDimensionId, entry: Entry) => {
    setState((s) => {
      const list = s.entries[dimension];
      const exists = list.some((e) => e.id === entry.id);
      const next = exists ? list.map((e) => (e.id === entry.id ? entry : e)) : [...list, entry];
      return { ...s, entries: { ...s.entries, [dimension]: next } };
    });
  }, []);

  const removeEntry = useCallback((dimension: ListDimensionId, id: string) => {
    setState((s) => ({
      ...s,
      entries: { ...s.entries, [dimension]: s.entries[dimension].filter((e) => e.id !== id) },
    }));
  }, []);

  const addSampleEntries = useCallback((dimension: ListDimensionId) => {
    setState((s) => ({
      ...s,
      entries: { ...s.entries, [dimension]: [...s.entries[dimension], ...sampleExtras(dimension)] },
    }));
  }, []);

  const setAttribute = useCallback((name: AttributeName, patch: Partial<AttributeValue>) => {
    setState((s) => ({
      ...s,
      attributes: { ...s.attributes, [name]: { ...s.attributes[name], ...patch } },
    }));
  }, []);

  const setJob = useCallback((job: JobDescription | null) => {
    setState((s) => ({ ...s, currentJob: job }));
  }, []);

  const createVersion = useCallback(
    (mode: CvMode): string => {
      const job = state.currentJob;
      if (!job) throw new Error('createVersion needs a job description');
      const version = makeVersion({ id: newId(), job, mode, stage: stageOf(state), profile: snapshotOf(state) });
      setState((s) => ({ ...s, versions: [version, ...s.versions] }));
      return version.id;
    },
    [state],
  );

  const updateVersion = useCallback((id: string, patch: Partial<CvVersion>) => {
    setState((s) => ({ ...s, versions: s.versions.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
  }, []);

  const deleteVersion = useCallback((id: string) => {
    setState((s) => ({ ...s, versions: s.versions.filter((v) => v.id !== id) }));
  }, []);

  const requestMentor = useCallback(() => {
    setState((s) => ({ ...s, mentorRequested: true }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL);
  }, []);

  const scores = useMemo(() => scoreOf(state.entries, state.attributes), [state.entries, state.attributes]);

  const value = useMemo<Cv3dContextValue>(
    () => ({
      state,
      hydrated,
      scores,
      completion: completionPercent(scores),
      saveEntry,
      removeEntry,
      addSampleEntries,
      setAttribute,
      setJob,
      createVersion,
      updateVersion,
      deleteVersion,
      createAccount,
      chooseStart,
      setUploads,
      runExtraction,
      saveBasic,
      requestMentor,
      reset,
    }),
    [state, hydrated, scores, saveEntry, removeEntry, addSampleEntries, setAttribute, setJob, createVersion, updateVersion, deleteVersion, createAccount, chooseStart, setUploads, runExtraction, saveBasic, requestMentor, reset],
  );

  return <Cv3dContext.Provider value={value}>{children}</Cv3dContext.Provider>;
}

export function useCv3d(): Cv3dContextValue {
  const ctx = useContext(Cv3dContext);
  if (!ctx) throw new Error('useCv3d must be used inside the /3d-cv layout');
  return ctx;
}
