import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authStorage } from '../utils/storage';
import { signInWithGoogle, signOutFromGoogle, auth, onAuthStateChanged } from '../utils/firebase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  googleLogin: () => Promise<void>;
  register: (email: string, password: string, businessName: string, ownerName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage first
    const currentUser = authStorage.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsLoading(false);
      return;
    }

    // Check Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Convert Firebase user to app User
        const appUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          businessName: firebaseUser.displayName || 'My Business',
          ownerName: firebaseUser.displayName || 'Owner',
          createdAt: Date.now(),
          photoURL: firebaseUser.photoURL || undefined,
        };
        localStorage.setItem('credpos_user', JSON.stringify(appUser));
        setUser(appUser);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const loggedInUser = await authStorage.login(email, password);
    setUser(loggedInUser);
  };

  const demoLogin = async () => {
    const demoUser = await authStorage.demoLogin();
    setUser(demoUser);
  };

  const googleLogin = async () => {
    try {
      const firebaseUser = await signInWithGoogle();
      const appUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        businessName: firebaseUser.displayName || 'My Business',
        ownerName: firebaseUser.displayName || 'Owner',
        createdAt: Date.now(),
        photoURL: firebaseUser.photoURL || undefined,
      };
      localStorage.setItem('credpos_user', JSON.stringify(appUser));
      setUser(appUser);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, businessName: string, ownerName: string) => {
    const newUser = await authStorage.register(email, password, businessName, ownerName);
    setUser(newUser);
  };

  const logout = async () => {
    authStorage.logout();
    try {
      await signOutFromGoogle();
    } catch (e) {
      console.log('Not signed in with Google');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, demoLogin, googleLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
