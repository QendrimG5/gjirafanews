import { configureStore } from "@reduxjs/toolkit";
import stubReducer from "./authSlice";

// All client and server state is now handled by TanStack Query, Zustand
// (saved-articles), and Auth.js (session). The Redux store is kept only as
// a placeholder so the legacy Provider in components/providers.tsx still
// type-checks; remove once a meaningful slice is reintroduced.

export const makeStore = () =>
  configureStore({
    reducer: {
      stub: stubReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
