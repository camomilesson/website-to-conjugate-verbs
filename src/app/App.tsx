import { useAuth } from "../modules/auth/ui.ts"
import { lazy, Suspense, useEffect, useRef } from "react"
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router"
import { Practice } from "../modules/practice/index.ts"
import { Progress, loadProgressDemo } from "../modules/progress/index.ts"
import { History, loadHistoryDemo } from "../modules/history/index.ts"
import { Settings } from "../modules/settings/index.ts"

const ProgressDemo = import.meta.env.DEV ? lazy(loadProgressDemo) : null

const HistoryDemo = import.meta.env.DEV ? lazy(loadHistoryDemo) : null

const sections = ["Practice", "Progress", "History", "Settings"]

export function App() {
  const { identityKey } = useAuth()
  const location = useLocation()
  const main = useRef<HTMLElement>(null)
  const previousPath = useRef(location.pathname)

  useEffect(() => {
    const title =
      sections.find(
        (section) => `/${section.toLowerCase()}` === location.pathname,
      ) ?? "Practice"
    document.title = `La Conjugadora · ${title}`
    if (previousPath.current !== location.pathname) {
      main.current?.focus()
      previousPath.current = location.pathname
    }
  }, [location.pathname])

  return (
    <div className="newspaper">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <NavLink
          to="/practice"
          className="wordmark"
          lang="es"
          aria-label="La Conjugadora home"
        >
          La Conjugadora
        </NavLink>
        <p className="masthead-subtitle" lang="es">
          Practica los verbos en español
        </p>
        <nav aria-label="Main navigation">
          {sections.map((section) => (
            <NavLink key={section} to={`/${section.toLowerCase()}`}>
              {section}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="main" ref={main} tabIndex={-1}>
        <Routes>
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
          <Route path="/practice" element={<Practice key={identityKey} />} />
          <Route path="/progress" element={<Progress key={identityKey} />} />
          <Route path="/history" element={<History key={identityKey} />} />
          <Route path="/settings" element={<Settings key={identityKey} />} />
          <Route path="*" element={<Navigate to="/practice" replace />} />
        </Routes>
      </main>
    </div>
  )
}
