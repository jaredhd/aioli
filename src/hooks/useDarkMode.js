import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'aioli-theme';

function getSystemPreference() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getInitialDarkMode() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return getSystemPreference();
}

function applyThemeToDOM(isDark) {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

export function useDarkMode() {
  const [darkMode, setDarkModeState] = useState(getInitialDarkMode);

  // Apply to DOM on mount and whenever darkMode changes
  useEffect(() => {
    applyThemeToDOM(darkMode);
  }, [darkMode]);

  // Listen for system preference changes (only when no localStorage override)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setDarkModeState(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkModeState((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const setDarkMode = useCallback((value) => {
    const isDark = Boolean(value);
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    setDarkModeState(isDark);
  }, []);

  return { darkMode, toggleDarkMode, setDarkMode };
}
