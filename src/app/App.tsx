import { useAuth } from "../modules/auth/ui.ts"
import { useEffect, useRef } from "react"
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router"
import { Practice } from "../modules/practice/index.ts"
import { Progress } from "../modules/progress/index.ts"
import { History } from "../modules/history/index.ts"
import { Settings } from "../modules/settings/index.ts"

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
          <Route path="/practice" element={<Practice key={identityKey} />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings key={identityKey} />} />
          <Route path="*" element={<Navigate to="/practice" replace />} />
        </Routes>
      </main>
    </div>
  )
}
