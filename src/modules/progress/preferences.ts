import { CATEGORIES, getPresetCategories } from "@conjugadora/verb-catalogue"
import type { CategoryId, Preset } from "@conjugadora/verb-catalogue"
import type { ModeFilter, SortOrder } from "./matrix.ts"
export interface ProgressPreferences {
  schemaVersion: 1
  mode: ModeFilter
  view: Preset | "select"
  custom: CategoryId[]
  sort: SortOrder
}
export const PROGRESS_STORAGE_KEY = "conjugadora.progress-view.v1"
export function defaultProgressPreferences(): ProgressPreferences {
  return {
    schemaVersion: 1,
    mode: "all",
    view: "basic",
    custom: getPresetCategories("basic"),
    sort: "name",
  }
}
export function parseProgressPreferences(value: unknown): ProgressPreferences {
  if (
    !value ||
    typeof value !== "object" ||
    !("schemaVersion" in value) ||
    value.schemaVersion !== 1 ||
    !("mode" in value) ||
    !["all", "typing", "choice", "strict", "relaxed"].includes(
      String(value.mode),
    ) ||
    !("view" in value) ||
    !["basic", "advanced", "all", "select"].includes(String(value.view)) ||
    !("sort" in value) ||
    ![
      "name",
      "name-desc",
      "accuracy",
      "accuracy-asc",
      "attempts",
      "attempts-asc",
    ].includes(String(value.sort)) ||
    !("custom" in value) ||
    !Array.isArray(value.custom) ||
    value.custom.length > 16 ||
    !value.custom.every(
      (id: unknown) =>
        typeof id === "string" &&
        CATEGORIES.some((category) => category.id === id),
    )
  )
    throw new Error(
      "Saved Progress display choices are invalid. Restore the default view to replace them.",
    )
  const custom = value.custom
  return {
    schemaVersion: 1,
    mode: value.mode as ModeFilter,
    view: value.view as ProgressPreferences["view"],
    sort: value.sort as SortOrder,
    custom: CATEGORIES.filter((category) => custom.includes(category.id)).map(
      (category) => category.id,
    ),
  }
}
// Serial writes survive view unmounts; reads can wait until the owner's tail settles.
export function preferenceWriter(
  write: (value: ProgressPreferences) => Promise<void>,
) {
  let tail = Promise.resolve()
  return {
    save(value: ProgressPreferences) {
      const snapshot = parseProgressPreferences(value)
      const request = tail.catch(() => undefined).then(() => write(snapshot))
      tail = request
      return request
    },
    settled: () => tail.catch(() => undefined),
  }
}
