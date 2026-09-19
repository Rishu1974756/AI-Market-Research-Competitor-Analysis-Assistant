"use client";

import { useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    document.documentElement.dataset.theme || "dark"
  );

  async function toggleTheme() {
    const nextTheme =
      theme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme =
      nextTheme;

    setTheme(nextTheme);

    await fetch("/api/theme", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        theme: nextTheme,
      }),
    });
  }

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}