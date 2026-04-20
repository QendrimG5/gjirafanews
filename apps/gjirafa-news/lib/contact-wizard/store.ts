import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";

// Persist form state to localStorage for 10 minutes so users don't lose
// in-progress entries on accidental refresh. File uploads (Step 3) can't be
// serialized and are explicitly excluded — users will need to re-add files
// after a reload.
const TTL_MS = 10 * 60 * 1000;
const STORAGE_KEY = "gn-contact-wizard";

// Wraps localStorage with a timestamp envelope. On read, entries older than
// TTL_MS are deleted and treated as missing.
const ttlStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(name);
    if (!raw) return null;
    try {
      const envelope = JSON.parse(raw) as { ts: number; v: string };
      if (!envelope.ts || Date.now() - envelope.ts > TTL_MS) {
        window.localStorage.removeItem(name);
        return null;
      }
      return envelope.v;
    } catch {
      window.localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      name,
      JSON.stringify({ ts: Date.now(), v: value }),
    );
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
  },
};

export type UserType = "individual" | "business" | "student";

export type PersonalInfo = {
  name: string;
  email: string;
  phone: string;
};

export type Preferences = {
  userType: UserType | "";
  newsletter?: boolean;
  companyName?: string;
  vatNumber?: string;
  university?: string;
  graduationYear?: string;
};

export type UploadedDoc = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeBytes: number;
  mime: string;
};

export type Step = 1 | 2 | 3 | 4;

export type WizardErrors = Partial<Record<string, string[]>>;

type WizardState = {
  step: Step;
  personal: PersonalInfo;
  preferences: Preferences;
  documents: UploadedDoc[];
  errors: WizardErrors;
  // When set, `next` and `back` will jump here instead of ±1.
  // Used by the review screen's "Edit" buttons so the user can return
  // directly to step 4 after editing a single step.
  returnTo: Step | null;

  setStep: (s: Step) => void;
  editStep: (s: Step) => void;
  next: () => void;
  back: () => void;

  setPersonal: (p: Partial<PersonalInfo>) => void;
  setPreferences: (p: Partial<Preferences>) => void;
  addDocuments: (files: File[]) => void;
  removeDocument: (id: string) => void;

  setErrors: (e: WizardErrors) => void;
  reset: () => void;
};

const initialPersonal: PersonalInfo = { name: "", email: "", phone: "" };
const initialPreferences: Preferences = { userType: "" };

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useWizard = create<WizardState>()(
  persist(
    (set, get) => ({
  step: 1,
  personal: initialPersonal,
  preferences: initialPreferences,
  documents: [],
  errors: {},
  returnTo: null,

  setStep: (s) => set({ step: s, errors: {}, returnTo: null }),
  editStep: (s) => set({ step: s, errors: {}, returnTo: 4 }),
  next: () => {
    const { step, returnTo } = get();
    if (returnTo) {
      set({ step: returnTo, errors: {}, returnTo: null });
      return;
    }
    if (step < 4) set({ step: (step + 1) as Step, errors: {} });
  },
  back: () => {
    const { step, returnTo } = get();
    if (returnTo) {
      // Cancel the edit and return to review without further validation.
      set({ step: returnTo, errors: {}, returnTo: null });
      return;
    }
    if (step > 1) set({ step: (step - 1) as Step, errors: {} });
  },

  setPersonal: (p) =>
    set((state) => ({ personal: { ...state.personal, ...p } })),

  setPreferences: (p) =>
    set((state) => {
      // When userType changes, clear sibling fields so stale data from a
      // different branch doesn't leak into the submission. Initialize the
      // new branch's fields as empty strings (not undefined) so Zod's
      // `.min(n, "…")` message fires instead of a generic "Required".
      if (p.userType && p.userType !== state.preferences.userType) {
        const base: Preferences = { userType: p.userType };
        if (p.userType === "individual") base.newsletter = false;
        if (p.userType === "business") {
          base.companyName = "";
          base.vatNumber = "";
        }
        if (p.userType === "student") {
          base.university = "";
          base.graduationYear = "";
        }
        return { preferences: base };
      }
      return { preferences: { ...state.preferences, ...p } };
    }),

  addDocuments: (files) =>
    set((state) => {
      console.log(files);
      const additions: UploadedDoc[] = files.map((file) => ({
        id: makeId(),
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        sizeBytes: file.size,
        mime: file.type,
      }));
      return { documents: [...state.documents, ...additions] };
    }),

  removeDocument: (id) =>
    set((state) => {
      const doomed = state.documents.find((d) => d.id === id);
      if (doomed) URL.revokeObjectURL(doomed.previewUrl);
      return { documents: state.documents.filter((d) => d.id !== id) };
    }),

  setErrors: (e) => set({ errors: e }),

  reset: () =>
    set((state) => {
      for (const d of state.documents) URL.revokeObjectURL(d.previewUrl);
      return {
        step: 1,
        personal: initialPersonal,
        preferences: initialPreferences,
        documents: [],
        errors: {},
        returnTo: null,
      };
    }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => ttlStorage),
      // Only persist form data. Files, errors, and in-flight edit state are
      // intentionally excluded — Files can't survive JSON, and errors should
      // always start cleared after a reload.
      partialize: (state) => ({
        step: state.step,
        personal: state.personal,
        preferences: state.preferences,
      }),
      version: 1,
    },
  ),
);
