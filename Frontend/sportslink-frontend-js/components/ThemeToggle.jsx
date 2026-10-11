"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "sportslink-theme";

export function ThemeToggle({ compact = false }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    let savedTheme = "light";
    try {
      const stored = window.localStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") savedTheme = stored;
    } catch {
      // The theme still works for this session if storage is unavailable.
    }
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      // Keep the current theme active even when browser storage is disabled.
    }
  }

  const targetLabel = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={`theme-toggle${compact ? " theme-toggle-compact" : ""}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${targetLabel} theme`}
      title={`Switch to ${targetLabel} theme`}
      aria-pressed={theme === "dark"}
    >
      <span className="theme-toggle-symbol" aria-hidden="true">
        {theme === "dark" ? <Sun size={17} strokeWidth={1.9} /> : <Moon size={17} strokeWidth={1.9} />}
      </span>
    </button>
  );
}
