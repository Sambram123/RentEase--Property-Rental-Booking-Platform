import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';
import api from '../services/api';

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Token storage helpers ────────────────────────────────────────────────────
const TOKEN_KEY = 'rentease_token';
const USER_KEY  = 'rentease_user';

const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  // Hydrate from localStorage on first render for instant auth state
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  });
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true); // true until Firebase resolves

  // ── Attach JWT to every axios request ──────────────────────────────────────
  useEffect(() => {
    const interceptorId = api.interceptors.request.use((config) => {
      const storedToken = getStoredToken();
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });
    return () => api.interceptors.request.eject(interceptorId);
  }, [token]);

  // ── Sync our own user state when backend returns a profile ─────────────────
  const syncBackendUser = useCallback(async (backendPayload) => {
    const { token: jwt, user: backendUser } = backendPayload;
    saveSession(jwt, backendUser);
    setToken(jwt);
    setUser(backendUser);
  }, []);

  // ── Firebase auth state listener ───────────────────────────────────────────
  useEffect(() => {
    if (!auth) {
      // Firebase not configured yet — skip, keep any localStorage session
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Firebase session gone — clear everything
        clearSession();
        setUser(null);
        setToken(null);
      }
      // If firebaseUser exists and we already have a stored token, keep it.
      // The actual sync happens at login/register time.
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ─── Auth actions ──────────────────────────────────────────────────────────

  /**
   * Email/password registration
   * 1. Creates Firebase user
   * 2. POSTs to our backend → gets JWT
   */
  const register = useCallback(async (name, email, password, role) => {
    // Create Firebase account first
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    // Persist to our backend and get JWT
    const { data } = await api.post('/auth/register', { name, email, password, role });
    await syncBackendUser(data.data);
    return data.data.user;
  }, [syncBackendUser]);

  /**
   * Email/password login
   */
  const login = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    const { data } = await api.post('/auth/login', { email, password });
    await syncBackendUser(data.data);
    return data.data.user;
  }, [syncBackendUser]);

  /**
   * Google sign-in via popup
   */
  const loginWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const { displayName, email, photoURL } = result.user;

    const { data } = await api.post('/auth/firebase', {
      name:        displayName,
      email,
      avatar:      photoURL,
      firebaseUid: result.user.uid,
    });
    await syncBackendUser(data.data);
    return data.data.user;
  }, [syncBackendUser]);

  /**
   * Logout — signs out Firebase and clears localStorage
   */
  const logout = useCallback(async () => {
    if (auth) await signOut(auth);
    clearSession();
    setUser(null);
    setToken(null);
  }, []);

  // ─── Context value ─────────────────────────────────────────────────────────
  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user),
    register,
    login,
    loginWithGoogle,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
