import { useRef, useState } from "react"
import { ConfirmDataAction } from "./DataControls.tsx"
export default function AccountControlsDemo() {
  const [action, setAction] = useState<"reset" | "delete" | null>(null)
  const [fail, setFail] = useState(false)
  const failNext = useRef(false)
  const [calls, setCalls] = useState<string[]>([])
  const [message, setMessage] = useState("No action performed.")
  function open(value: "reset" | "delete") {
    failNext.current = fail
    setAction(value)
  }
  return (
    <section className="page-section">
      <h1>Account controls · isolated fixture demo</h1>
      <p>
        Synthetic account demo@example.invalid. No real data or identity can be
        deleted here.
      </p>
      <label>
        <input
          type="checkbox"
          checked={fail}
          onChange={(event) => setFail(event.target.checked)}
        />{" "}
        Fail the next attempt
      </label>
      <div className="selection-actions">
        <button onClick={() => open("reset")}>Preview reset</button>
        <button onClick={() => open("delete")}>Preview deletion</button>
      </div>
      <p role="status">{message}</p>
      <p>
        Fixture calls: {calls.length} · Unique request IDs:{" "}
        {new Set(calls).size}
      </p>
      {action && (
        <ConfirmDataAction
          confirmation={{
            action,
            owner: "fixture-owner",
            email: "demo@example.invalid",
            operationId: "fixture-reset-id",
            generation: "fixture-generation",
          }}
          onClose={() => {
            setAction(null)
          }}
          onReset={() => {
            setMessage("Demo reset acknowledged. No real data changed.")
            setAction(null)
          }}
          executeReset={async (id) => {
            await Promise.resolve()
            setCalls((values) => [...values, id])
            if (failNext.current) {
              failNext.current = false
              throw new Error("Simulated lost reply. Retry the same request.")
            }
            return "fixture-next-generation"
          }}
          executeDelete={async (id) => {
            await Promise.resolve()
            setCalls((values) => [...values, id])
            if (failNext.current) {
              failNext.current = false
              throw new Error("Simulated deletion error. No real data changed.")
            }
            setMessage("Demo deletion acknowledged. No real account deleted.")
          }}
        />
      )}
    </section>
  )
}
