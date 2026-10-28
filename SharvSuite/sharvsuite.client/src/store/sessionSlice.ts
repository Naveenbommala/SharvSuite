import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type SessionUser = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
};

type SessionState = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  lastLoginAt: string | null;
};

const initialState: SessionState = {
  user: null,
  isAuthenticated: false,
  lastLoginAt: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    hydrateSession: (state, action: PayloadAction<SessionState>) => {
      state.user = action.payload.user;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.lastLoginAt = action.payload.lastLoginAt;
    },
    setSessionUser: (state, action: PayloadAction<SessionUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.lastLoginAt = new Date().toISOString();
    },
    clearSessionUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.lastLoginAt = null;
    },
  },
});

export const { hydrateSession, setSessionUser, clearSessionUser } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
export type { SessionState };
