// Stub: auth state lives in Auth.js / next-auth's useSession() hook now.
// This slice exists only to satisfy configureStore's "must have a reducer"
// requirement; nothing reads or writes the store. Once a real reducer is
// added, drop this file.

import { createSlice } from "@reduxjs/toolkit";

const stubSlice = createSlice({
  name: "stub",
  initialState: {},
  reducers: {},
});

export default stubSlice.reducer;
