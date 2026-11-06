import { loadAccountControlsDemo } from "../modules/account-controls/index.ts"
import { Privacy } from "../modules/privacy/index.ts"
import { useAuth } from "../modules/auth/ui.ts"
import type { MouseEvent } from "react"
import { lazy, Suspense, useEffect, useRef } from "react"
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router"
import { Practice, practiceEntryKey } from "../modules/practice/index.ts"
import { Progress, loadProgressDemo } from "../modules/progress/index.ts"
import { History, loadHistoryDemo } from "../modules/history/index.ts"
import { Settings } from "../modules/settings/index.ts"

const ProgressDemo = import.meta.env.DEV ? lazy(loadProgressDemo) : null

const HistoryDemo = import.meta.env.DEV ? lazy(loadHistoryDemo) : null

const AccountControlsDemo = import.meta.env.DEV
  ? lazy(loadAccountControlsDemo)
  : null

const sections = ["Practice", "Progress", "History", "Settings"]

export function App() {
  const { identityKey, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const entryKey = practiceEntryKey(location.state)
  function enterPractice(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    )
      return
    event.preventDefault()
    void navigate("/practice", {
      state: { practiceEntry: crypto.randomUUID() },
    })
  }
  const main = useRef<HTMLElement>(null)
  const previousPath = useRef(location.pathname)
  const previousEntry = useRef(entryKey)

  useEffect(() => {
    const title =
      location.pathname === "/privacy"
        ? "Privacy & your data"
        : (sections.find(
            (section) => `/${section.toLowerCase()}` === location.pathname,
          ) ?? "Practice")
    document.title = `La Conjugadora · ${title}`
    if (
      previousPath.current !== location.pathname ||
      previousEntry.current !== entryKey
    ) {
      main.current?.focus()
      previousPath.current = location.pathname
      previousEntry.current = entryKey
    }
  }, [location.pathname, entryKey])

  return (
    <div className="study-app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <NavLink
          to="/practice"
          className="wordmark"
          lang="es"
          aria-label="La Conjugadora home"
          onClick={enterPractice}
        >
          <span className="brand-symbol" aria-hidden="true">
            á
          </span>
          <span>
            La Conjugadora
            <span className="brand-caption">SPANISH, ONE VERB AT A TIME</span>
          </span>
        </NavLink>
        <p className="masthead-subtitle" lang="es">
          Practica los verbos en español
        </p>
        <nav aria-label="Main navigation">
          {sections.map((section) => (
            <NavLink
              key={section}
              to={`/${section.toLowerCase()}`}
              onClick={section === "Practice" ? enterPractice : undefined}
            >
              <span className="nav-symbol" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {section === "Practice" ? (
                    <path d="M6 18 18 6M6 6h12v12" />
                  ) : section === "Progress" ? (
                    <path d="M5 19V12M12 19V5M19 19V9" />
                  ) : section === "History" ? (
                    <path d="M4 10a8 8 0 1 1 1 8M4 5v5h5M12 8v5l3 2" />
                  ) : (
                    <>
                      <path d="M4 7h16M4 17h16" />
                      <circle cx="9" cy="7" r="2" fill="currentColor" />
                      <circle cx="15" cy="17" r="2" fill="currentColor" />
                    </>
                  )}
                </svg>
              </span>
              {section}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="sidebar-note-mark" aria-hidden="true">
            a → á
          </span>
          <p>
            A little practice.
            <br />A little more natural.
          </p>
        </div>
        <NavLink to="/settings" className="account-link">
          <span className="account-avatar" aria-hidden="true">
            {user ? "✓" : "G"}
          </span>
          <span>
            {user ? "Your account" : "Guest workspace"}
            <small>
              {user ? "Learning, saved." : "Sign in to save your progress"}
            </small>
          </span>
          <span aria-hidden="true">↗</span>
        </NavLink>
      </header>
      <main id="main" ref={main} tabIndex={-1}>
        <Routes>
          {AccountControlsDemo && (
            <Route
              path="/dev/account-controls"
              element={
                <Suspense fallback={<p>Loading demo…</p>}>
                  <AccountControlsDemo />
                </Suspense>
              }
            />
          )}
          <Route path="/privacy" element={<Privacy />} />
          {HistoryDemo && (
            <Route
              path="/dev/history"
              element={
                <Suspense fallback={<p>Loading demo…</p>}>
                  <HistoryDemo />
                </Suspense>
              }
            />
          )}
          {ProgressDemo && (
            <Route
              path="/dev/progress"
              element={
                <Suspense fallback={<p>Loading demo…</p>}>
                  <ProgressDemo />
                </Suspense>
              }
            />
          )}
          <Route
            path="/practice"
            element={<Practice key={`${identityKey}:${entryKey}`} />}
          />
          <Route path="/progress" element={<Progress key={identityKey} />} />
          <Route path="/history" element={<History key={identityKey} />} />
          <Route path="/settings" element={<Settings key={identityKey} />} />
          <Route path="*" element={<Navigate to="/practice" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>
          La Conjugadora <span aria-hidden="true">·</span> Made for practice.
        </span>
        <NavLink to="/privacy">Privacy &amp; your data</NavLink>
      </footer>
    </div>
  )
}
