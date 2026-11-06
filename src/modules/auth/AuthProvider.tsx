import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./client.ts"
interface AuthState {
  status: "loading" | "guest" | "signed-in" | "unconfigured" | "error"
  user: User | null
  error: string | null
}
interface AuthContextValue extends AuthState {
  invalidateLearningData: () => void
  accountNotice: string | null
  announceAccountDeletion: () => void
  clearAccountNotice: () => void
  identityKey: string
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  retry: () => void
}
const AuthContext = createContext<AuthContextValue | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: supabase ? "loading" : "unconfigured",
    user: null,
    error: null,
  })
  const [accountNotice, setAccountNotice] = useState<string | null>(null)
  const [dataRevision, setDataRevision] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [actionError, setActionError] = useState<string | null>(null)
  const actionPending = useRef(false)
  useEffect(() => {
    if (!supabase) return
    let active = true
    let events = 0
    setState({ status: "loading", user: null, error: null })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      events++
      if (active)
        setState({
          status: session?.user ? "signed-in" : "guest",
          user: session?.user ?? null,
          error: null,
        })
    })
    const version = events
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || events !== version) return
        setState(
          error
            ? { status: "error", user: null, error: error.message }
            : {
                status: data.session?.user ? "signed-in" : "guest",
                user: data.session?.user ?? null,
                error: null,
              },
        )
      })
      .catch((reason: unknown) => {
        if (active && events === version)
          setState({
            status: "error",
            user: null,
            error:
              reason instanceof Error
                ? reason.message
                : "Could not read your session.",
          })
      })
    const params = new URLSearchParams(window.location.search)
    if (params.has("error")) {
      setActionError(
        params.get("error_description") ?? "Google sign-in was not completed.",
      )
      for (const field of ["error", "error_description", "error_code"])
        params.delete(field)
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${params.size ? `?${params}` : ""}${window.location.hash}`,
      )
    }
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [attempt])
  useEffect(() => {
    if (!state.user || typeof BroadcastChannel === "undefined") return
    const channel = new BroadcastChannel("conjugadora-account-data")
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const value = event.data
      if (
        value &&
        typeof value === "object" &&
        "userId" in value &&
        value.userId === state.user?.id
      )
        setDataRevision((n) => n + 1)
    }
    return () => channel.close()
  }, [state.user?.id])
  function invalidateLearningData() {
    setAccountNotice(
      "Learning data reset. Your account and practice preferences were kept.",
    )
    setDataRevision((n) => n + 1)
    if (state.user && typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("conjugadora-account-data")
      channel.postMessage({ userId: state.user.id })
      channel.close()
    }
  }
  async function signIn() {
    if (!supabase || actionPending.current) return
    actionPending.current = true
    setAccountNotice(null)
    setActionError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/settings` },
      })
      if (error) throw error
    } catch (reason: unknown) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "Could not start Google sign-in.",
      )
    } finally {
      actionPending.current = false
    }
  }
  async function signOut() {
    if (!supabase || actionPending.current) return
    actionPending.current = true
    setAccountNotice(null)
    setActionError(null)
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" })
      if (error) throw error
    } catch (reason: unknown) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "Could not sign out. Please retry.",
      )
    } finally {
      actionPending.current = false
    }
  }
  const identityKey =
    state.status === "loading" || state.status === "error"
      ? state.status
      : state.user
        ? `${state.user.id}:${dataRevision}`
        : "guest"
  return (
    <AuthContext.Provider
      value={{
        ...state,
        error: actionError ?? state.error,
        identityKey,
        invalidateLearningData,
        accountNotice,
        announceAccountDeletion: () =>
          setAccountNotice(
            "Your Conjugadora account and saved data were deleted.",
          ),
        clearAccountNotice: () => setAccountNotice(null),
        signIn,
        signOut,
        retry: () => {
          setActionError(null)
          setAttempt((value) => value + 1)
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error("AuthProvider is missing.")
  return auth
}
