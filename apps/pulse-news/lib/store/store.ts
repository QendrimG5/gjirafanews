import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

// The store now only manages client-side auth state.
// Server state (articles, categories, auth session) is handled by TanStack Query,
// which has its own cache outside of Redux. This keeps the store minimal and
// avoids the middleware/reducer boilerplate RTK Query required.

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
