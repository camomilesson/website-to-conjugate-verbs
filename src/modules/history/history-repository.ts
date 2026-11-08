import { supabase } from "../auth/index.ts"
import { parseHistoryRows } from "../learning-data/index.ts"
import {
  cursorCondition,
  HISTORY_PAGE_SIZE,
  historyPage,
} from "./history-model.ts"
import type { HistoryCursor, HistoryMode } from "./history-model.ts"
export async function readHistoryPage(
  userId: string,
  options: {
    mode: HistoryMode
    cursor: HistoryCursor | null
    ceiling: HistoryCursor | null
    signal?: AbortSignal
  },
) {
  if (!supabase) throw new Error("Account services are unavailable.")
  let query = supabase
    .from("practice_history")
    .select(
      "id,completed_at,mode,accent_policy,correct,answered,configuration,dataset_version,defaults_version,example_mistake",
    )
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(HISTORY_PAGE_SIZE + 1)
  if (options.mode !== "all") query = query.eq("mode", options.mode)
  const bound = options.cursor ?? options.ceiling
  if (bound) query = query.or(cursorCondition(bound, options.cursor === null))
  if (options.signal) query = query.abortSignal(options.signal)
  const { data, error } = await query
  if (error) throw new Error(`Could not load history: ${error.message}`)
  return historyPage(parseHistoryRows(data))
}
