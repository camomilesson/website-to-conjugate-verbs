import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router"
import { AuthProvider } from "../modules/auth/ui.ts"
import { App } from "./App.tsx"
import "./theme.css"
import "./design.css"

const root = document.getElementById("root")
if (!root) throw new Error("Application root is missing.")

const router = createBrowserRouter([{ path: "*", element: <App /> }])

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
