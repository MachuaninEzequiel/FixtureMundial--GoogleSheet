import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase manages session persistence automatically
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync user display name to the ranking sheet
        try {
          const idToken = await firebaseUser.getIdToken();
          await fetch('/api/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ displayName: firebaseUser.displayName }),
          });
        } catch {
          // Non-critical: sync failure doesn't block login
        }
      }
      setUser(firebaseUser); // null if logged out
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithGoogle = useCallback(() => {
    return signInWithPopup(auth, googleProvider);
  }, []);

  const logout = useCallback(() => {
    return signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
