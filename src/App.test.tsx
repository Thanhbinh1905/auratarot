import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App.tsx'

const savedReadingsStorageKey = 'auratarot:saved-readings:v1'
const motionPreferenceStorageKey = 'auratarot:motion-preference:v1'
const welcomeNoticeStorageKey = 'auratarot:welcome-privacy-dismissed:v1'
let createObjectURLMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  createObjectURLMock = vi.fn(() => 'blob:auratarot-export')
  URL.createObjectURL = createObjectURLMock
  URL.revokeObjectURL = vi.fn()
})

async function completeDailyReading(note?: string) {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getByRole('button', { name: /start a reading/i }))
  await user.click(screen.getByRole('button', { name: /self-growth/i }))
  await user.type(screen.getByLabelText(/optional intention/i), '<img src=x onerror=alert(1)>')
  await user.click(screen.getByRole('button', { name: /continue to spreads/i }))
  await user.click(screen.getByRole('button', { name: /begin ritual/i }))
  await user.click(screen.getByRole('button', { name: /shuffle/i }))
  await user.click(screen.getByRole('button', { name: /cut/i }))
  await user.click(screen.getByRole('button', { name: /draw/i }))
  await user.click(screen.getByRole('button', { name: /reveal/i }))

  if (note) {
    await user.type(screen.getByLabelText(/journal note/i), note)
  }

  return user
}

describe('Reading ritual flow', () => {
  it('lets a user complete a Daily Guidance reading with custom intention and journal prompts', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start a reading/i }))
    await user.click(screen.getByRole('button', { name: /self-growth/i }))
    await user.type(screen.getByLabelText(/optional intention/i), 'Practice patience today')
    await user.click(screen.getByRole('button', { name: /continue to spreads/i }))
    await user.click(screen.getByRole('radio', { name: /daily guidance/i }))
    await user.click(screen.getByRole('button', { name: /begin ritual/i }))
    await user.click(screen.getByRole('button', { name: /shuffle/i }))
    await user.click(screen.getByRole('button', { name: /cut/i }))
    await user.click(screen.getByRole('button', { name: /draw/i }))
    await user.click(screen.getByRole('button', { name: /reveal/i }))

    expect(screen.getByRole('heading', { name: /your reading/i })).toBeInTheDocument()
    expect(screen.getByText('Self-growth')).toBeInTheDocument()
    expect(screen.getByText('Practice patience today')).toBeInTheDocument()
    expect(screen.getByText(/short summary/i)).toBeInTheDocument()
    expect(screen.getByText(/deeper meaning/i)).toBeInTheDocument()
    expect(screen.getByText(/practical next step/i)).toBeInTheDocument()
    expect(screen.getByText('What feels true?')).toBeInTheDocument()
    expect(screen.getByText('What should I ask next?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save reading/i })).toBeEnabled()
  })

  it('offers every approved topic and spread, including Decision Maker path defaults', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start a reading/i }))
    for (const topic of [
      'Love',
      'Career',
      'Personal concern',
      'Future guidance',
      'Self-growth',
      'Something else',
    ]) {
      expect(screen.getByRole('button', { name: topic })).toBeInTheDocument()
    }

    await user.click(screen.getByRole('button', { name: /continue to spreads/i }))
    expect(screen.getByRole('radio', { name: /daily guidance/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /crossroads timeline/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /crossroads problem-solving/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /decision maker/i })).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /decision maker/i }))
    expect(screen.getByLabelText(/path a name/i)).toHaveValue('Path A')
    expect(screen.getByLabelText(/path b name/i)).toHaveValue('Path B')
  })

  it('renders Decision Maker custom path names as text and draws unique cards with orientations', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start a reading/i }))
    await user.click(screen.getByRole('button', { name: /career/i }))
    await user.click(screen.getByRole('button', { name: /continue to spreads/i }))
    await user.click(screen.getByRole('radio', { name: /decision maker/i }))
    await user.clear(screen.getByLabelText(/path a name/i))
    await user.type(screen.getByLabelText(/path a name/i), 'Stay')
    await user.clear(screen.getByLabelText(/path b name/i))
    await user.type(screen.getByLabelText(/path b name/i), 'Change')
    await user.click(screen.getByRole('button', { name: /begin ritual/i }))
    await user.click(screen.getByRole('button', { name: /shuffle/i }))
    await user.click(screen.getByRole('button', { name: /cut/i }))
    await user.click(screen.getByRole('button', { name: /draw/i }))
    await user.click(screen.getByRole('button', { name: /reveal/i }))

    const cardArticles = screen.getAllByTestId('revealed-card')
    expect(cardArticles).toHaveLength(2)
    expect(screen.getByText('Stay')).toBeInTheDocument()
    expect(screen.getByText('Change')).toBeInTheDocument()
    const cardNames = cardArticles.map((article) => within(article).getByTestId('card-name').textContent)
    expect(new Set(cardNames).size).toBe(cardNames.length)
    for (const article of cardArticles) {
      expect(within(article).getByText(/upright|reversed/i)).toBeInTheDocument()
    }
  })

  it('keeps user-authored content escaped rather than rendering raw HTML', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /start a reading/i }))
    await user.click(screen.getByRole('button', { name: /something else/i }))
    await user.type(screen.getByLabelText(/optional intention/i), '<img src=x onerror=alert(1)>')
    await user.click(screen.getByRole('button', { name: /continue to spreads/i }))
    await user.click(screen.getByRole('button', { name: /begin ritual/i }))
    await user.click(screen.getByRole('button', { name: /shuffle/i }))
    await user.click(screen.getByRole('button', { name: /cut/i }))
    await user.click(screen.getByRole('button', { name: /draw/i }))
    await user.click(screen.getByRole('button', { name: /reveal/i }))

    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(document.querySelector('img[src="x"]')).toBeNull()
  })

  it('supports reduced motion and keyboard progression without animation-only blockers', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /preferences/i }))
    await user.click(screen.getByRole('button', { name: /reduced motion/i }))
    expect(screen.getByRole('button', { name: /reduced motion/i })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: /sanctuary/i }))
    screen.getByRole('button', { name: /start a reading/i }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { name: /choose your focus/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /continue to spreads/i }))
    await user.click(screen.getByRole('button', { name: /begin ritual/i }))
    expect(screen.getByRole('button', { name: /shuffle/i })).toBeEnabled()
  })
})

describe('App shell', () => {
  it('shows a short first-time local privacy note and persists dismissal', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    expect(screen.getByRole('status', { name: /privacy note/i })).toHaveTextContent(
      /readings and notes stay on this device and browser/i,
    )
    await user.click(screen.getByRole('button', { name: /dismiss privacy note/i }))
    expect(localStorage.getItem(welcomeNoticeStorageKey)).toBe('dismissed')
    expect(screen.queryByRole('status', { name: /privacy note/i })).not.toBeInTheDocument()

    unmount()
    render(<App />)
    expect(screen.queryByRole('status', { name: /privacy note/i })).not.toBeInTheDocument()
  })

  it('persists the reduced motion preference across remounts', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.click(screen.getByRole('button', { name: /preferences/i }))
    await user.click(screen.getByRole('button', { name: /reduced motion/i }))
    expect(localStorage.getItem(motionPreferenceStorageKey)).toBe('reduced')
    expect(screen.getByRole('button', { name: /reduced motion/i })).toHaveAttribute('aria-pressed', 'true')

    unmount()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /preferences/i }))
    expect(screen.getByRole('button', { name: /reduced motion/i })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: /default motion/i }))
    expect(localStorage.getItem(motionPreferenceStorageKey)).toBe('default')
    expect(screen.getByRole('button', { name: /default motion/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('explains local-only storage limits, data controls, and conservative PWA posture in preferences', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /preferences/i }))

    expect(screen.getByText(/saved readings and notes are stored only in this browser on this device/i)).toBeInTheDocument()
    expect(screen.getAllByText(/may disappear if browser data is cleared/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /clear app-owned local data/i })).toBeInTheDocument()
    expect(screen.getByText(/no service worker cache is registered/i)).toBeInTheDocument()
    expect(screen.getByText(/no analytics, telemetry, remote fonts, cloud sync, or AI calls/i)).toBeInTheDocument()
  })

  it('does not register a service worker or analytics network calls during app startup', () => {
    const register = vi.fn()
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    })
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    render(<App />)

    expect(register).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('exposes accessible navigation for secondary placeholder surfaces', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /journal/i }))
    expect(screen.getByRole('heading', { level: 1, name: /saved readings journal/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /card library/i }))
    expect(screen.getByRole('heading', { level: 1, name: /learn the cards gently/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /preferences/i }))
    expect(screen.getByRole('heading', { level: 1, name: /shape the atmosphere/i })).toBeInTheDocument()
  })
})

describe('Card meaning library', () => {
  it('lets users browse and select a card while keeping the library secondary to the reading flow', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('button', { name: /start a reading/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /card library/i }))

    expect(screen.queryByRole('button', { name: /start a reading/i })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /learn the cards gently/i })).toBeInTheDocument()
    expect(screen.getByText(/study aid only/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /the fool/i })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: /the magician/i }))

    expect(screen.getByRole('heading', { name: /the magician/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /keywords/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /upright meaning/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /reversed meaning/i })).toBeInTheDocument()
    expect(screen.getByText(/placeholder symbolic card/i)).toBeInTheDocument()
    expect(screen.getByText(/no real Rider-Waite-Smith artwork is bundled/i)).toBeInTheDocument()
  })

  it('filters cards by name and keyword with a friendly empty state', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /card library/i }))
    const searchInput = screen.getByLabelText(/search cards by name or keyword/i)

    await user.type(searchInput, 'focused action')
    expect(screen.getByRole('button', { name: /the magician/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /the fool/i })).not.toBeInTheDocument()

    await user.clear(searchInput)
    await user.type(searchInput, 'zz-not-a-card')
    expect(screen.getByText(/no cards match “zz-not-a-card”/i)).toBeInTheDocument()
  })

  it('renders XSS-like search text safely and does not load real artwork', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(<App />)

    await user.click(screen.getByRole('button', { name: /card library/i }))
    await user.type(screen.getByLabelText(/search cards by name or keyword/i), '<img src=x onerror=alert(1)>')

    expect(screen.getByText(/<img src=x onerror=alert\(1\)>/i)).toBeInTheDocument()
    expect(document.querySelector('img[src="x"]')).toBeNull()
    expect(screen.getByTestId('library-placeholder-art')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('Saved readings journal', () => {
  it('manually saves a completed reading with an optional note and restores it after remount', async () => {
    const user = await completeDailyReading('Remember to breathe before replying.')

    await user.click(screen.getByRole('button', { name: /save reading/i }))
    expect(await screen.findByText(/reading saved to this browser/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /journal/i }))
    expect(screen.getAllByText(/saved readings stay on this device and browser/i).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /self-growth/i }))
    expect(screen.getByRole('heading', { name: /saved reading detail/i })).toBeInTheDocument()
    expect(screen.getByText('Remember to breathe before replying.')).toBeInTheDocument()

    render(<App />)
    const journalButtons = screen.getAllByRole('button', { name: /journal/i })
    const lastJournalButton = journalButtons[journalButtons.length - 1]
    if (!lastJournalButton) {
      throw new Error('Expected a rendered Journal navigation button')
    }
    await user.click(lastJournalButton)
    expect(screen.getAllByText(/saved readings stay on this device and browser/i).length).toBeGreaterThan(0)
  })

  it('requires confirmation before deleting and removes only the selected entry', async () => {
    const user = userEvent.setup()
    const first = {
      id: 'saved-first',
      savedAt: '2026-06-03T10:00:00.000Z',
      topic: 'First topic',
      spreadTitle: 'Daily Guidance',
      note: 'First note',
      reading: {
        id: 'reading-first',
        spread: { id: 'daily-guidance', title: 'Daily Guidance', style: 'daily', positions: [] },
        seed: 'first',
        drawnCards: [],
      },
    }
    const second = { ...first, id: 'saved-second', topic: 'Second topic', note: 'Second note' }
    localStorage.setItem(savedReadingsStorageKey, JSON.stringify([first, second]))
    render(<App />)

    await user.click(screen.getByRole('button', { name: /journal/i }))
    await user.click(screen.getByRole('button', { name: /first topic/i }))
    await user.click(screen.getByRole('button', { name: /delete saved reading/i }))
    expect(screen.getByRole('dialog', { name: /delete saved reading/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByText('First note')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /delete saved reading/i }))
    await user.click(screen.getByRole('button', { name: /yes, delete/i }))
    await waitFor(() => expect(screen.queryByText('First note')).not.toBeInTheDocument())
    expect(screen.getByText(/second topic/i)).toBeInTheDocument()
  })

  it('warns before leaving an unsaved completed reading with a note draft', async () => {
    const user = await completeDailyReading('Unsaved private note')

    await user.click(screen.getByRole('button', { name: /journal/i }))
    expect(screen.getByRole('dialog', { name: /leave without saving/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /stay/i }))
    expect(screen.getByRole('heading', { name: /your reading/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /journal/i }))
    await user.click(screen.getByRole('button', { name: /leave without saving/i }))
    expect(screen.getByRole('heading', { level: 1, name: /saved readings journal/i })).toBeInTheDocument()
  })

  it('renders user-authored saved note as text and handles corrupt storage safely', async () => {
    const user = userEvent.setup()
    localStorage.setItem(savedReadingsStorageKey, 'not-json')
    render(<App />)

    await user.click(screen.getByRole('button', { name: /journal/i }))
    expect(screen.getByText(/saved readings could not be loaded/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /sanctuary/i }))
    await user.click(screen.getByRole('button', { name: /start a reading/i }))
    await user.click(screen.getByRole('button', { name: /continue to spreads/i }))
    await user.click(screen.getByRole('button', { name: /begin ritual/i }))
    await user.click(screen.getByRole('button', { name: /shuffle/i }))
    await user.click(screen.getByRole('button', { name: /cut/i }))
    await user.click(screen.getByRole('button', { name: /draw/i }))
    await user.click(screen.getByRole('button', { name: /reveal/i }))
    await user.type(screen.getByLabelText(/journal note/i), '<script>alert(1)</script>')
    await user.click(screen.getByRole('button', { name: /save reading/i }))
    await user.click(screen.getByRole('button', { name: /journal/i }))
    await user.click(screen.getByRole('button', { name: /love/i }))

    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()
  })

  it('can clear app-owned local data after confirmation', async () => {
    const user = userEvent.setup()
    localStorage.setItem(savedReadingsStorageKey, JSON.stringify([{ id: 'saved-one', savedAt: new Date().toISOString(), topic: 'Love', spreadTitle: 'Daily Guidance', reading: { id: 'r', spread: { id: 'daily-guidance', title: 'Daily Guidance', style: 'daily', positions: [] }, seed: 's', drawnCards: [] } }]))
    render(<App />)

    await user.click(screen.getByRole('button', { name: /journal/i }))
    await user.click(screen.getByRole('button', { name: /clear app-owned local data/i }))
    expect(screen.getByRole('dialog', { name: /clear app-owned local data/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /yes, clear local data/i }))
    expect(screen.getByText(/no saved readings yet/i)).toBeInTheDocument()
  })

  it('shows user-safe copy when storage is unavailable', async () => {
    const user = await completeDailyReading('Cannot save this')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota unavailable')
    })

    await user.click(screen.getByRole('button', { name: /save reading/i }))

    expect(await screen.findByText(/could not save this reading/i)).toBeInTheDocument()
  })

  it('caps journal note length with user-safe guidance before saving or exporting', async () => {
    await completeDailyReading()
    const noteInput = screen.getByLabelText(/journal note/i)

    fireEvent.change(noteInput, { target: { value: 'a'.repeat(2_050) } })

    expect(noteInput).toHaveAttribute('maxLength', '2000')
    expect(noteInput).toHaveValue('a'.repeat(2_000))
    expect(screen.getByText(/journal notes are limited to 2000 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/2000 of 2000 characters used/i)).toBeInTheDocument()
  })
})

describe('Modal focus management', () => {
  it('traps and restores focus for the export preview dialog', async () => {
    const user = await completeDailyReading('Focus note')
    const exportButton = screen.getByRole('button', { name: /export reading/i })

    await user.click(exportButton)

    const dialog = screen.getByRole('dialog', { name: /export preview/i })
    expect(within(dialog).getByRole('button', { name: /exclude journal note/i })).toHaveFocus()

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(within(dialog).getByRole('button', { name: /close export preview/i })).toHaveFocus()

    await user.tab()
    expect(within(dialog).getByRole('button', { name: /exclude journal note/i })).toHaveFocus()

    await user.click(within(dialog).getByRole('button', { name: /close export preview/i }))
    expect(exportButton).toHaveFocus()
  })

  it('traps and restores focus for the unsaved-leave dialog', async () => {
    const user = await completeDailyReading('Unsaved private note')
    const journalButton = screen.getByRole('button', { name: /journal/i })

    await user.click(journalButton)

    const dialog = screen.getByRole('dialog', { name: /leave without saving/i })
    expect(within(dialog).getByRole('button', { name: /stay/i })).toHaveFocus()

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(within(dialog).getByRole('button', { name: /leave without saving/i })).toHaveFocus()

    await user.tab()
    expect(within(dialog).getByRole('button', { name: /stay/i })).toHaveFocus()

    await user.click(within(dialog).getByRole('button', { name: /stay/i }))
    expect(journalButton).toHaveFocus()
  })

  it('traps and restores focus for the delete confirmation dialog', async () => {
    const user = userEvent.setup()
    localStorage.setItem(savedReadingsStorageKey, JSON.stringify([{
      id: 'saved-focus-delete',
      savedAt: '2026-06-03T10:00:00.000Z',
      topic: 'Delete focus topic',
      spreadTitle: 'Daily Guidance',
      note: 'Delete focus note',
      reading: { id: 'reading-focus-delete', spread: { id: 'daily-guidance', title: 'Daily Guidance', style: 'daily', positions: [] }, seed: 'focus', drawnCards: [] },
    }]))
    render(<App />)

    await user.click(screen.getByRole('button', { name: /journal/i }))
    await user.click(screen.getByRole('button', { name: /delete focus topic/i }))
    const deleteTrigger = screen.getByRole('button', { name: /delete saved reading/i })
    await user.click(deleteTrigger)

    const dialog = screen.getByRole('dialog', { name: /delete saved reading/i })
    expect(within(dialog).getByRole('button', { name: /cancel/i })).toHaveFocus()

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(within(dialog).getByRole('button', { name: /yes, delete/i })).toHaveFocus()

    await user.tab()
    expect(within(dialog).getByRole('button', { name: /cancel/i })).toHaveFocus()

    await user.click(within(dialog).getByRole('button', { name: /cancel/i }))
    expect(deleteTrigger).toHaveFocus()
  })

  it('traps and restores focus for the clear local data confirmation dialog', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /journal/i }))
    const clearTrigger = screen.getByRole('button', { name: /clear app-owned local data/i })
    await user.click(clearTrigger)

    const dialog = screen.getByRole('dialog', { name: /clear app-owned local data/i })
    expect(within(dialog).getByRole('button', { name: /cancel/i })).toHaveFocus()

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(within(dialog).getByRole('button', { name: /yes, clear local data/i })).toHaveFocus()

    await user.tab()
    expect(within(dialog).getByRole('button', { name: /cancel/i })).toHaveFocus()

    await user.click(within(dialog).getByRole('button', { name: /cancel/i }))
    expect(clearTrigger).toHaveFocus()
  })
})

describe('Privacy-aware export', () => {
  it('opens an export preview for a completed reading with the note included and visibly removable by default', async () => {
    const user = await completeDailyReading('Include this private note by default.')

    await user.click(screen.getByRole('button', { name: /export reading/i }))

    const dialog = screen.getByRole('dialog', { name: /export preview/i })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getAllByText(/journal note included/i).length).toBeGreaterThan(0)
    expect(within(dialog).getByText(/export may include your topic, question, and journal note/i)).toBeInTheDocument()
    expect(within(dialog).getByText('Include this private note by default.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /exclude journal note/i }))
    expect(within(dialog).getByText(/journal note excluded/i)).toBeInTheDocument()
    expect(within(dialog).queryByText('Include this private note by default.')).not.toBeInTheDocument()
  })

  it('exports completed readings as client-side PDF and image downloads without network calls', async () => {
    const user = await completeDailyReading('Local export note')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(vi.fn())
    await user.click(screen.getByRole('button', { name: /export reading/i }))
    await user.click(screen.getByRole('button', { name: /download pdf/i }))
    await user.click(screen.getByRole('button', { name: /download image/i }))

    expect(createObjectURLMock).toHaveBeenCalledTimes(2)
    expect(clickSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('renders XSS-like export text safely and keeps long notes in text content', async () => {
    const longNote = `<script>alert(1)</script> ${'a grounded reminder '.repeat(40)}`
    const user = await completeDailyReading(longNote)

    await user.click(screen.getByRole('button', { name: /export reading/i }))

    const exportNote = screen.getByTestId('export-preview-note')
    expect(within(exportNote).getByText((content) => content.includes('<script>alert(1)</script>'))).toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()
    expect(exportNote).toHaveTextContent(/a grounded reminder/)
  })

  it('opens export preview from saved reading detail and excludes deleted readings', async () => {
    const user = await completeDailyReading('Saved note for export')
    await user.click(screen.getByRole('button', { name: /save reading/i }))
    await user.click(screen.getByRole('button', { name: /journal/i }))
    await user.click(screen.getByRole('button', { name: /self-growth/i }))

    await user.click(screen.getByRole('button', { name: /export saved reading/i }))
    const dialog = screen.getByRole('dialog', { name: /export preview/i })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('Saved note for export')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /close export preview/i }))

    await user.click(screen.getByRole('button', { name: /delete saved reading/i }))
    await user.click(screen.getByRole('button', { name: /yes, delete/i }))

    expect(screen.queryByRole('button', { name: /export saved reading/i })).not.toBeInTheDocument()
  })

  it('shows a recoverable failure message when client-side download creation fails', async () => {
    const user = await completeDailyReading('Recoverable export note')
    createObjectURLMock.mockImplementationOnce(() => {
      throw new Error('blob creation failed')
    })

    await user.click(screen.getByRole('button', { name: /export reading/i }))
    await user.click(screen.getByRole('button', { name: /download pdf/i }))

    expect(screen.getByText(/could not create the export file/i)).toBeInTheDocument()
  })
})
