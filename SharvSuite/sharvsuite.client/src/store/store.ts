import { configureStore } from '@reduxjs/toolkit';
import { hydrateSession, sessionReducer, type SessionState } from './sessionSlice';

const SESSION_STORAGE_KEY = 'sharvsuite_session_state';

function loadSessionState() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const serializedState = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!serializedState) {
      return undefined;
    }

    const parsed = JSON.parse(serializedState) as { session?: SessionState };
    return parsed.session ?? null;
  } catch {
    return null;
  }
}

export const store = configureStore({
  reducer: {
    session: sessionReducer,
  },
});

const hydratedSession = loadSessionState();
if (hydratedSession) {
  store.dispatch(hydrateSession(hydratedSession));
}

store.subscribe(() => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serializedState = JSON.stringify({
      session: store.getState().session,
    });
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, serializedState);
  } catch {
    // Ignore storage failures to avoid blocking app behavior.
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
