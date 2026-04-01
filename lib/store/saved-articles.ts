import { create } from "zustand";
import { persist } from "zustand/middleware";

type SavedArticlesState = {
  savedIds: string[];
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
};

export const useSavedArticles = create<SavedArticlesState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggle: (id: string) => {
        const { savedIds } = get();
        if (savedIds.includes(id)) {
          set({ savedIds: savedIds.filter((s) => s !== id) });
        } else {
          set({ savedIds: [...savedIds, id] });
        }
      },
      isSaved: (id: string) => get().savedIds.includes(id),
    }),
    {
      name: "gjirafanews-saved",
    }
  )
);
