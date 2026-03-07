"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeId = "light" | "midnight" | "vivid" | "ocean";

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  /** Swatch colours shown in the picker */
  swatches: [string, string];
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "light",
    label: "Light",
    swatches: ["#6366f1", "#a855f7"],
  },
  {
    id: "midnight",
    label: "Midnight",
    swatches: ["#3b82f6", "#8b5cf6"],
  },
  {
    id: "vivid",
    label: "Vivid",
    swatches: ["#f26419", "#7c3aed"],
  },
  {
    id: "ocean",
    label: "Ocean",
    swatches: ["#06b6d4", "#10b981"],
  },
];

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => { },
  themes: THEMES,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("midnight");

  // On mount, restore persisted theme
  useEffect(() => {
    const saved = localStorage.getItem("livepoll-theme") as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) {
      applyTheme(saved);
      setThemeState(saved);
    } else {
      applyTheme("light");
    }
  }, []);

  const setTheme = (id: ThemeId) => {
    applyTheme(id);
    setThemeState(id);
    localStorage.setItem("livepoll-theme", id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
}

export function useTheme() {
  return useContext(ThemeContext);
}
