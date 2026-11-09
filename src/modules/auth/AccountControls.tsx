import { useState } from "react"
import { configurationError } from "./client.ts"
import { useAuth } from "./AuthProvider.tsx"
export function AccountControls() {
  const auth = useAuth()
  const [remember, setRemember] = useState(false)
  return (
    <section className="account-controls" aria-labelledby="account-title">
      <h2 id="account-title">Account</h2>
      {auth.accountNotice && (
        <div className="account-notice" role="status">
          <p>{auth.accountNotice}</p>
          <button onClick={auth.clearAccountNotice}>Dismiss message</button>
        </div>
      )}
      {auth.status === "unconfigured" ? (
        <p>
          Google sign-in is not configured yet. Guest practice and browser
          preferences are available.
        </p>
      ) : auth.status === "loading" ? (
        <p role="status">Checking account…</p>
      ) : auth.user ? (
        <>
          <p>Signed in as {auth.user.email ?? "your Google account"}.</p>
          <button
            onClick={() => {
              void auth.signOut()
            }}
          >
            Sign out
          </button>
          <p className="field-note">
            Your preferences and submitted answers sync to this account.
          </p>
        </>
      ) : (
        <>
          <label className="remember-sign-in">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              aria-describedby="remember-sign-in-help"
            />
            Keep me signed in on this device
          </label>
          <p id="remember-sign-in-help" className="field-note">
            Saves your sign-in in this browser between visits. Sign out to
            remove it. Leave unchecked for this tab’s browser session; your
            account and progress stay saved either way. Browsers may restore
            sessions when reopening tabs.
          </p>
          <button
            disabled={auth.status === "error"}
            onClick={() => {
              void auth.signIn(remember)
            }}
          >
            Continue with Google
          </button>
          <p className="field-note">
            Practice without an account, or sign in to sync preferences. Guest
            answers are never imported.
          </p>
        </>
      )}
      {configurationError && <p role="alert">{configurationError}</p>}
      {auth.error && (
        <div role="alert">
          <p>{auth.error}</p>
          <button onClick={auth.retry}>Retry account connection</button>
        </div>
      )}
    </section>
  )
}
