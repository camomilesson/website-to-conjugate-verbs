/** Storage choices apply to authentication only, never account learning data. */
interface BrowserStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
export function createSessionStorage(
  projectUrl: string,
  local: BrowserStore,
  session: BrowserStore,
  newId: () => string,
) {
  const legacyKey = `sb-${new URL(projectUrl).hostname.split(".")[0]}-auth-token`
  const choiceKey = `${legacyKey}:storage`
  const pendingKey = `${legacyKey}:start-sign-in`
  const tabKey = `${legacyKey}:tab`
  const choice = session.getItem(choiceKey)
  // Unmarked, existing sessions retain their previous behaviour during rollout.
  const persistent =
    choice === "persistent" ||
    (choice !== "session" && local.getItem(legacyKey) !== null)
  if (!choice && !persistent) session.setItem(choiceKey, "session")
  let tabId = session.getItem(tabKey)
  if (!tabId) {
    tabId = newId()
    session.setItem(tabKey, tabId)
  }
  const storageKey = persistent ? legacyKey : `${legacyKey}-${tabId}`
  return {
    persistent,
    storageKey,
    storage: persistent ? local : session,
    prepareSignIn(remember: boolean) {
      // Check both stores before redirecting, so blocked storage is reported.
      const store = remember ? local : session
      const probe = `${legacyKey}:probe`
      store.setItem(probe, "1")
      store.removeItem(probe)
      session.setItem(choiceKey, remember ? "persistent" : "session")
      session.setItem(pendingKey, "1")
    },
    consumeSignIn() {
      const pending = session.getItem(pendingKey) === "1"
      session.removeItem(pendingKey)
      return pending
    },
  }
}
