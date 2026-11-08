import type { Catalogue } from "@conjugadora/verb-catalogue"
import {
  defaultPreferences,
  restorePreferences,
  validPreferences,
} from "./preferences.ts"
import type { PracticePreferences } from "./preferences.ts"
export interface PreferenceRepository {
  read: () => Promise<unknown>
  write: (payload: unknown) => Promise<void>
}
export function preferencePayload(value: PracticePreferences) {
  const {
    mode,
    verbIds,
    categories,
    persons,
    length,
    accentPolicy,
    verbSet,
    tenseSet,
    personSet,
  } = value
  return {
    schemaVersion: 1,
    preferences: {
      mode,
      verbIds: [...verbIds],
      categories: [...categories],
      persons: [...persons],
      length,
      accentPolicy,
      verbSet,
      tenseSet,
      personSet,
    },
  }
}
export async function loadAccountPreferences(
  repository: PreferenceRepository,
  catalogue: Catalogue,
) {
  const payload = await repository.read()
  // An account with no row starts from approved defaults, not local guest data.
  return payload === null
    ? { preferences: defaultPreferences(catalogue), notice: null }
    : restorePreferences(JSON.stringify(payload), catalogue)
}
export async function saveAccountPreferences(
  repository: PreferenceRepository,
  preferences: PracticePreferences,
): Promise<string | null> {
  if (!validPreferences(preferences))
    return "Choose a valid question count and at least one available verb, tense, and person."
  try {
    await repository.write(preferencePayload(preferences))
    return null
  } catch (reason: unknown) {
    return reason instanceof Error
      ? reason.message
      : "Could not save account preferences. Retry before continuing."
  }
}
