"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const SERVER_DEFAULT: Theme = "dark";

export function useTheme(): {
  theme: Theme;
  ready: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
} {
  const [theme, setThemeState] = useState<Theme>(SERVER_DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const actual: Theme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    // Sync React state to the actual DOM theme that the inline script set during HTML parsing.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(actual);
    setReady(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== "light" && stored !== "dark") {
        const next: Theme = mq.matches ? "dark" : "light";
        setThemeState(next);
        document.documentElement.classList.toggle("dark", next === "dark");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, ready, toggleTheme, setTheme };
}
