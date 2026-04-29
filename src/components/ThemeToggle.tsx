"use client";

import { useEffect, useState } from "react";

type Theme = "parchment" | "midnight";
const KEY = "lp.theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("parchment");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Theme | null) ?? "parchment";
    setTheme(saved);
    document.documentElement.dataset.theme =
      saved === "midnight" ? "midnight" : "";
  }, []);

  const toggle = () => {
    const next: Theme = theme === "parchment" ? "midnight" : "parchment";
    setTheme(next);
    localStorage.setItem(KEY, next);
    document.documentElement.dataset.theme = next === "midnight" ? "midnight" : "";
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "parchment" ? "midnight" : "parchment"} mode`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#1a1208] transition-transform duration-500 hover:rotate-180 hover:text-[color:var(--color-gold)]"
      data-cursor
    >
      <span aria-hidden className="text-[15px] leading-none">
        {theme === "parchment" ? "☾" : "☼"}
      </span>
    </button>
  );
}
