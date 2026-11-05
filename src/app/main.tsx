import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router"
import { App } from "./App.tsx"
import "./theme.css"

const root = document.getElementById("root")
if (!root) throw new Error("Application root is missing.")

const router = createBrowserRouter([{ path: "*", element: <App /> }])

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
