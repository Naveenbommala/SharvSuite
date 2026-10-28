import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  type Auth,
  type UserCredential,
  signInWithPopup,
} from 'firebase/auth';
import { apiFetch } from './apiClient';

export type FirebaseRuntimeConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export type AuthConfigResponse = {
  firebase: FirebaseRuntimeConfig;
  googleCalendar: {
    clientId: string;
  };
};

type FirebaseAuthContext = {
  app: FirebaseApp;
  auth: Auth;
};

let firebaseAuthContext: FirebaseAuthContext | null = null;

export async function fetchAuthConfig(): Promise<AuthConfigResponse> {
  const response = await apiFetch('/api/auth/config');

  if (!response.ok) {
    throw new Error(
      `Unable to load authentication configuration. Status ${response.status}.`,
    );
  }

  const json = (await response.json()) as AuthConfigResponse;
  return json;
}

function getFirebaseAuth(config: FirebaseRuntimeConfig): FirebaseAuthContext {
  if (firebaseAuthContext) {
    return firebaseAuthContext;
  }

  const app = initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  });

  firebaseAuthContext = {
    app,
    auth: getAuth(app),
  };

  return firebaseAuthContext;
}

export async function signInWithGoogle(
  config: FirebaseRuntimeConfig,
): Promise<UserCredential> {
  const { auth } = getFirebaseAuth(config);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  return signInWithPopup(auth, provider);
}

export async function signOutUser(config: FirebaseRuntimeConfig): Promise<void> {
  const { auth } = getFirebaseAuth(config);
  await auth.signOut();
}
