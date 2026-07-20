"use client";

export default function MobileNavToggle() {
  return (
    <button
      className="app-mobile-toggle"
      type="button"
      aria-label="Toggle navigation"
      onClick={() => document.getElementById("app-shell")?.classList.toggle("nav-open")}
    >
      ☰
    </button>
  );
}
