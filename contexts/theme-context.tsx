import type { DocumentSnapshot, FirestoreError } from 'firebase/firestore';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { auth, db } from '../services/firebaseConfig';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>(systemColorScheme || 'dark');

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Initial load
    const loadUserTheme = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
          const userTheme = docSnap.data().theme as Theme;
          if (userTheme) {
            setThemeState(userTheme);
          }
        }
      } catch (error) {
        console.error('Error loading user theme:', error);
      }
    };

    loadUserTheme();

    // Set up real-time listener
    const unsubscribe = onSnapshot(doc(db, 'users', uid), (docSnapshot: DocumentSnapshot) => {
      if (docSnapshot.exists()) {
        const userTheme = docSnapshot.data().theme as Theme;
        if (userTheme) {
          setThemeState(userTheme);
        }
      }
    }, (error: FirestoreError) => {
      console.error('Error listening to theme changes:', error);
    });

    return () => unsubscribe();
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
