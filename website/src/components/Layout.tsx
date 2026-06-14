import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Overview" },
  { to: "/skills", label: "Lifecycle" },
  { to: "/personas", label: "Personas" },
  { to: "/agents", label: "Agents" },
  { to: "/watchtower", label: "Watchtower" },
  { to: "/install", label: "Install" },
];

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <header className="sticky top-0 z-50 border-b border-border-light bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 h-14 md:px-10">
          <NavLink
            to="/"
            className="text-[21px] font-semibold tracking-tight text-text-primary"
          >
            UV Suite
          </NavLink>

          <nav className="hidden items-center gap-0 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-1 text-xs transition-colors ${
                    isActive
                      ? "text-text-primary font-medium"
                      : "text-text-secondary hover:text-text-primary"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            className="p-1.5 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 9h16.5m-16.5 6.75h16.5"
                />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <nav className="border-t border-border-light px-4 py-3 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block py-2 text-sm ${isActive ? "text-text-primary font-medium" : "text-text-secondary"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1240px] px-6 py-16 md:px-10">
        <Outlet />
      </main>

      <footer className="border-t border-border-light">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-6 text-xs text-text-tertiary md:px-10">
          <span>UV Suite · MIT</span>
          <div className="flex gap-4">
            <a
              href="https://github.com/utsavanand/uv-suite"
              className="hover:text-text-primary transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.utsava.xyz/"
              className="hover:text-text-primary transition-colors"
            >
              utsava.xyz
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
