import type { ReadingSession } from '../domain/tarot/index.ts'

export const savedReadingsStorageKey = 'auratarot:saved-readings:v1'

export interface SavedReadingSnapshot {
  id: string
  savedAt: string
  topic: string
  spreadTitle: string
  note?: string
  reading: ReadingSession
}

export interface SavedReadingStore {
  list(): SavedReadingSnapshot[]
  save(snapshot: SavedReadingSnapshot): SavedReadingSnapshot[]
  remove(id: string): SavedReadingSnapshot[]
  clear(): SavedReadingSnapshot[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSavedReadingSnapshot(value: unknown): value is SavedReadingSnapshot {
  if (!isObject(value) || !isObject(value.reading)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.savedAt === 'string' &&
    typeof value.topic === 'string' &&
    typeof value.spreadTitle === 'string' &&
    (typeof value.note === 'string' || value.note === undefined) &&
    typeof value.reading.id === 'string' &&
    typeof value.reading.seed === 'string'
  )
}

export function createLocalSavedReadingStore(storage: Storage = window.localStorage): SavedReadingStore {
  function list(): SavedReadingSnapshot[] {
    const raw = storage.getItem(savedReadingsStorageKey)
    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      throw new Error('Saved readings storage is not a list')
    }

    if (!parsed.every(isSavedReadingSnapshot)) {
      throw new Error('Saved readings storage contains invalid entries')
    }

    return parsed.sort((left, right) => right.savedAt.localeCompare(left.savedAt))
  }

  function persist(next: SavedReadingSnapshot[]): SavedReadingSnapshot[] {
    storage.setItem(savedReadingsStorageKey, JSON.stringify(next))
    return next
  }

  return {
    list,
    save(snapshot) {
      let existing: SavedReadingSnapshot[]
      try {
        existing = list()
      } catch {
        existing = []
      }
      const withoutDuplicate = existing.filter((entry) => entry.id !== snapshot.id)
      return persist([snapshot, ...withoutDuplicate])
    },
    remove(id) {
      return persist(list().filter((entry) => entry.id !== id))
    },
    clear() {
      storage.removeItem(savedReadingsStorageKey)
      return []
    },
  }
}
