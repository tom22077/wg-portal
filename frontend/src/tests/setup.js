import { vi } from 'vitest'

// Mock Vue I18n $t function so tests don't fail
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useI18n: () => ({
      t: (key) => key, // returns key directly
    }),
  }
})

// Alternatively (simpler for this case):
globalThis.$t = (key) => key
