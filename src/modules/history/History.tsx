import { Link } from "react-router"
import { HistoryControls, HistoryList } from "./HistoryList.tsx"
import { useHistory } from "./useHistory.ts"
export function History() {
  const history = useHistory()
  return (
    <section className="page-section" aria-labelledby="history-title">
      <p className="eyebrow">ONE SESSION AT A TIME</p>
      <h1 id="history-title">History</h1>
      <p className="page-intro">Every practice is a little progress.</p>
      {history.guest ? (
        <p className="empty-state">
          <Link to="/settings">Sign in</Link> to save completed practices. Guest
          results are not stored.
        </p>
      ) : history.authError ? (
        <p role="alert">Account session unavailable. Retry from Settings.</p>
      ) : (
        <>
          <HistoryControls
            mode={history.mode}
            onMode={history.changeMode}
            onRefresh={history.refresh}
            disabled={history.loading}
          />
          {history.error ? (
            <div role="alert">
              <p>{history.error}</p>
              <button onClick={history.retry}>Retry history</button>
            </div>
          ) : !history.data ? (
            <p role="status">Loading history…</p>
          ) : (
            <HistoryList
              data={history.data}
              page={history.page}
              onPrevious={history.previous}
              onNext={history.next}
            />
          )}
        </>
      )}
    </section>
  )
}
