import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let app  = null;
let auth = null;
const googleProvider = new GoogleAuthProvider();

// Only initialize if the API key is present (avoids crashes during dev without .env)
if (import.meta.env.VITE_FIREBASE_API_KEY) {
  app  = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Persist the session in localStorage so the user stays logged in on refresh
  setPersistence(auth, browserLocalPersistence).catch(console.error);

  // Request profile and email scopes for Google sign-in
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
}

export { auth, googleProvider };
export default app;
