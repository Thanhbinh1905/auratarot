import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  createReadingSession,
  rotateDeckOrder,
  sealDeckOrder,
  getInterpretation,
  placeholderRiderWaiteDeck,
  spreads,
  type DrawnCard,
  type ReadingSession,
  type Spread,
  type SpreadId,
  type TarotCard,
} from './domain/tarot/index.ts'
import { createLocalSavedReadingStore, type SavedReadingSnapshot } from './persistence/savedReadings.ts'

type SurfaceId = 'home' | 'journal' | 'library' | 'preferences'
type ReadingStep = 'intro' | 'topic' | 'spread' | 'ritual' | 'reveal'
type RitualStage = 'shuffle' | 'cut' | 'draw' | 'reveal'
type ExportFormat = 'pdf' | 'image'
type MotionPreference = 'default' | 'reduced'
type MeaningLayer = 'summary' | 'deeper' | 'guidance'

interface ExportTarget {
  source: 'current' | 'saved'
  id: string
  savedAt?: string
  topic: string
  spreadTitle: string
  note?: string
  reading: ReadingSession
}

interface Surface {
  id: SurfaceId
  label: string
  eyebrow: string
  title: string
  description: string
}

interface TopicChoice {
  id: string
  label: string
}

const surfaces: Surface[] = [
  {
    id: 'home',
    label: 'Sanctuary',
    eyebrow: 'Warm candlelit sanctuary',
    title: 'Begin in a quiet place',
    description:
      'Settle into a calm local-first space for reflection. Your reading is generated privately on this device with locally installed card images.',
  },
  {
    id: 'journal',
    label: 'Journal',
    eyebrow: 'Local readings journal',
    title: 'Saved readings journal',
    description:
      'Saved readings stay on this device and browser. They may disappear if browser data is cleared.',
  },
  {
    id: 'library',
    label: 'Card Library',
    eyebrow: 'Beginner card study',
    title: 'Learn the cards gently',
    description:
      'A secondary study aid for browsing local card imagery, simple keywords, and basic upright or reversed reflection prompts.',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    eyebrow: 'Comfort controls',
    title: 'Shape the atmosphere',
    description:
      'Motion, privacy, and local data controls are stored only in this browser on this device.',
  },
]

const topicChoices: TopicChoice[] = [
  { id: 'love', label: 'Love' },
  { id: 'career', label: 'Career' },
  { id: 'personal-concern', label: 'Personal concern' },
  { id: 'future-guidance', label: 'Future guidance' },
  { id: 'self-growth', label: 'Self-growth' },
  { id: 'something-else', label: 'Something else' },
]

const spreadOptions: Spread[] = [
  spreads.dailyGuidance,
  spreads.crossroadsTimeline,
  spreads.crossroadsProblemSolving,
  spreads.decisionMaker,
]

const approvedJournalPrompts = [
  'What feels true?',
  'What should I ask next?',
  'Where can I show more empathy?',
  'What is one small action I can take?',
]

const storageLoadErrorMessage =
  'Saved readings could not be loaded. The local journal may be empty or browser storage may be unavailable.'
const motionPreferenceStorageKey = 'auratarot:motion-preference:v1'
const welcomeNoticeStorageKey = 'auratarot:welcome-privacy-dismissed:v1'
const welcomeNoticeDismissedValue = 'dismissed'
const journalNoteMaxLength = 2000
const focusableModalSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const libraryCards = placeholderRiderWaiteDeck.cards
const placeholderArtworkNote =
  'Card faces are loaded from the locally installed public/cards/rws-roses-lilies deck. Card backs remain a local CSS ritual pattern because no separate back asset was found.'
const cutPileOptions = [
  { id: 'left', label: 'Left pile', ratio: 0.28, description: 'Lift a small opening packet.' },
  { id: 'center', label: 'Center pile', ratio: 0.5, description: 'Split the deck near the middle.' },
  { id: 'right', label: 'Right pile', ratio: 0.72, description: 'Carry a deeper packet forward.' },
] as const
const fanPreviewCount = 18

interface ModalDialogProps {
  children: ReactNode
  className?: string
  labelledBy: string
  onEscape?: () => void
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableModalSelector)).filter((element) => {
    const style = window.getComputedStyle(element)
    return !element.hasAttribute('disabled') && style.display !== 'none' && style.visibility !== 'hidden'
  })
}

function ModalDialog({ children, className = '', labelledBy, onEscape }: ModalDialogProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const firstFocusable = dialog ? getFocusableElements(dialog)[0] : null
    ;(firstFocusable ?? dialog)?.focus()

    return () => {
      const previousFocus = previousFocusRef.current
      if (previousFocus?.isConnected) {
        previousFocus.focus()
        return
      }

      const fallback = document.querySelector<HTMLElement>('#sanctuary-content button, .app-shell button')
      fallback?.focus()
    }
  }, [])

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault()
      onEscape()
      return
    }

    if (event.key !== 'Tab') {
      return
    }

    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    const focusableElements = getFocusableElements(dialog)
    if (focusableElements.length === 0) {
      event.preventDefault()
      dialog.focus()
      return
    }

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault()
      lastFocusable?.focus()
      return
    }

    if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault()
      firstFocusable?.focus()
    }
  }

  return (
    <div className="modal-backdrop">
      <section
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={`modal-card${className ? ` ${className}` : ''}`}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        {children}
      </section>
    </div>
  )
}

function getPrimaryKeyword(card: TarotCard): string {
  return card.keywords[0] ?? 'reflection'
}

function getCardUprightMeaning(card: TarotCard): string {
  const primaryKeyword = getPrimaryKeyword(card)
  return `${card.name} points to ${primaryKeyword} in a direct, available way. Use this as a simple beginner prompt, not a fixed prediction.`
}

function getCardReversedMeaning(card: TarotCard): string {
  const primaryKeyword = getPrimaryKeyword(card)
  return `${card.name} reversed invites a slower look at ${primaryKeyword}. Pause, rebalance, and notice where the card's themes may feel blocked, quiet, or internal.`
}

function matchesCardSearch(card: TarotCard, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return true
  }

  const searchableText = [card.name, card.arcana, card.suit ?? '', card.rank ?? '', ...card.keywords]
    .join(' ')
    .toLowerCase()

  return searchableText.includes(normalizedQuery)
}

function CardFace({ card, className = '' }: { card: TarotCard; className?: string }) {
  if (card.asset.kind === 'local-card-image') {
    return (
      <img
        alt={card.asset.alt}
        className={`card-face-image${className ? ` ${className}` : ''}`}
        data-testid="local-card-image"
        loading="lazy"
        src={card.asset.src}
      />
    )
  }

  return (
    <span className={`placeholder-card-art${className ? ` ${className}` : ''}`} aria-label={card.asset.alt} role="img">
      <span>✦</span>
      <small>{card.arcana === 'major' ? 'Major Arcana' : card.suit}</small>
    </span>
  )
}

function loadInitialSavedReadings(): SavedReadingSnapshot[] {
  try {
    return createLocalSavedReadingStore().list()
  } catch {
    return []
  }
}

function loadInitialStorageMessage(): string {
  try {
    createLocalSavedReadingStore().list()
    return ''
  } catch {
    return storageLoadErrorMessage
  }
}

function loadInitialMotionPreference(): MotionPreference {
  try {
    return window.localStorage.getItem(motionPreferenceStorageKey) === 'reduced' ? 'reduced' : 'default'
  } catch {
    return 'default'
  }
}

function loadInitialWelcomeNoticeVisibility(): boolean {
  try {
    return window.localStorage.getItem(welcomeNoticeStorageKey) !== welcomeNoticeDismissedValue
  } catch {
    return true
  }
}

const ritualStages: { id: RitualStage; label: string; description: string }[] = [
  {
    id: 'shuffle',
    label: 'Shuffle',
    description: 'Breathe, mix the symbolic deck, and let the question soften.',
  },
  {
    id: 'cut',
    label: 'Cut',
    description: 'Pause at the threshold and choose a simple point of entry.',
  },
  {
    id: 'draw',
    label: 'Draw',
    description: 'Draw the cards for the selected spread with no duplicates.',
  },
  {
    id: 'reveal',
    label: 'Reveal',
    description: 'Turn the cards over and read them as reflective guidance.',
  },
]

function readableSeed(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-') || 'quiet-focus'
}

function spreadTone(spread: Spread): string {
  switch (spread.id) {
    case 'daily-guidance':
      return 'One card for a gentle daily anchor.'
    case 'crossroads-timeline':
      return 'A three-card map for past, present, and a possible near-future direction.'
    case 'crossroads-problem-solving':
      return 'A three-card map for challenge, support, and a grounded next step.'
    case 'decision-maker':
      return 'A two-path reflection for comparing options without treating either as destiny.'
  }
}

function displaySpreadTitle(spread: Spread): string {
  return spread.title.replace(':', '')
}

function positionLabel(reading: ReadingSession, draw: DrawnCard): string {
  if (reading.spread.id !== 'decision-maker') {
    return draw.position.label
  }

  if (draw.position.id === 'path-a') {
    return reading.pathNames?.[0] ?? 'Path A'
  }

  if (draw.position.id === 'path-b') {
    return reading.pathNames?.[1] ?? 'Path B'
  }

  return draw.position.label
}

function formatSavedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown save time'
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatExportTimestamp(value?: string): string {
  if (!value) {
    return new Date().toLocaleString()
  }

  return formatSavedAt(value)
}

function wrapExportText(value: string, maxLength = 82): string[] {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return ['']
  }

  const words = normalized.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxLength && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }

  if (current) {
    lines.push(current)
  }

  return lines
}

function buildExportLines(target: ExportTarget, includeNote: boolean): string[] {
  const lines = [
    'AuraTarot Reading Export',
    `Generated locally: ${new Date().toLocaleString()}`,
    `Reading time: ${formatExportTimestamp(target.savedAt)}`,
    `Topic: ${target.topic}`,
    `Spread: ${target.spreadTitle}`,
    `Journal note: ${includeNote && target.note ? 'included' : 'excluded or unavailable'}`,
    '',
    'Cards',
  ]

  for (const draw of target.reading.drawnCards) {
    const interpretation = getInterpretation(draw)
    lines.push(`${positionLabel(target.reading, draw)} — ${draw.card.name} (${draw.orientation})`)
    lines.push(`Summary: ${interpretation.summary}`)
    lines.push(`Next step: ${interpretation.nextStep}`)
  }

  if (includeNote && target.note) {
    lines.push('', 'Journal note')
    lines.push(...wrapExportText(target.note, 76))
  }

  lines.push('', 'Privacy reminder: this file was generated in your browser. Review it before sharing.')
  return lines
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildExportSvg(target: ExportTarget, includeNote: boolean): string {
  const wrappedLines = buildExportLines(target, includeNote).flatMap((line) => wrapExportText(line, 72))
  const width = 1200
  const height = Math.max(900, 180 + wrappedLines.length * 34)
  const textLines = wrappedLines
    .map((line, index) => `<text x="72" y="${String(110 + index * 34)}" font-size="24" fill="#fff7e8">${escapeSvgText(line)}</text>`)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}" viewBox="0 0 ${String(width)} ${String(height)}"><rect width="100%" height="100%" fill="#170d12"/><circle cx="1030" cy="120" r="150" fill="#f5a85c" opacity="0.16"/><text x="72" y="62" font-size="34" font-weight="700" fill="#ffd18a">AuraTarot private export</text>${textLines}</svg>`
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildExportPdf(target: ExportTarget, includeNote: boolean): Blob {
  const lines = buildExportLines(target, includeNote).flatMap((line) => wrapExportText(line, 88))
  const pageLineLimit = 58
  const pageLines = Array.from({ length: Math.ceil(lines.length / pageLineLimit) }, (_, index) =>
    lines.slice(index * pageLineLimit, (index + 1) * pageLineLimit),
  )
  const fontObjectId = 3 + pageLines.length
  const contentObjectStartId = fontObjectId + 1
  const pageObjectIds = pageLines.map((_, index) => 3 + index)
  const contentObjects = pageLines.map((page, index) => {
    const pageContent = [
      'BT',
      '/F1 11 Tf',
      '50 790 Td',
      ...page.flatMap((line, lineIndex) => [lineIndex === 0 ? '' : '0 -13 Td', `(${escapePdfText(line)}) Tj`]).filter(Boolean),
      'ET',
    ].join('\n')
    return `${String(contentObjectStartId + index)} 0 obj << /Length ${String(pageContent.length)} >> stream\n${pageContent}\nendstream endobj`
  })
  const pageObjects = pageObjectIds.map((pageObjectId, index) =>
    `${String(pageObjectId)} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${String(fontObjectId)} 0 R >> >> /Contents ${String(contentObjectStartId + index)} 0 R >> endobj`,
  )
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    `2 0 obj << /Type /Pages /Kids [${pageObjectIds.map((id) => `${String(id)} 0 R`).join(' ')}] /Count ${String(pageObjectIds.length)} >> endobj`,
    ...pageObjects,
    `${String(fontObjectId)} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`,
    ...contentObjects,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const object of objects) {
    offsets.push(pdf.length)
    pdf += `${object}\n`
  }
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${String(objects.length + 1)}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer << /Size ${String(objects.length + 1)} /Root 1 0 R >>\nstartxref\n${String(xrefOffset)}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

function buildExportImage(target: ExportTarget, includeNote: boolean): Blob {
  return new Blob([buildExportSvg(target, includeNote)], { type: 'image/svg+xml;charset=utf-8' })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  link.click()
  URL.revokeObjectURL(url)
}

export function App() {
  const [activeSurface, setActiveSurface] = useState<SurfaceId>('home')
  const [motionPreference, setMotionPreferenceState] = useState<MotionPreference>(loadInitialMotionPreference)
  const [showWelcomeNotice, setShowWelcomeNotice] = useState(loadInitialWelcomeNoticeVisibility)
  const [readingStep, setReadingStep] = useState<ReadingStep>('intro')
  const [isRitualSurfaceOpen, setIsRitualSurfaceOpen] = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState('love')
  const [intention, setIntention] = useState('')
  const [selectedSpreadId, setSelectedSpreadId] = useState<SpreadId>('daily-guidance')
  const [pathAName, setPathAName] = useState('Path A')
  const [pathBName, setPathBName] = useState('Path B')
  const [completedRitualStages, setCompletedRitualStages] = useState<RitualStage[]>([])
  const [sealedDeckOrder, setSealedDeckOrder] = useState<TarotCard[] | null>(null)
  const [cutDeckOrder, setCutDeckOrder] = useState<TarotCard[] | null>(null)
  const [selectedFanCardIds, setSelectedFanCardIds] = useState<string[]>([])
  const [revealedCardIds, setRevealedCardIds] = useState<string[]>([])
  const [visibleMeaningLayers, setVisibleMeaningLayers] = useState<MeaningLayer[]>(['summary'])
  const [reading, setReading] = useState<ReadingSession | null>(null)
  const [journalDraft, setJournalDraft] = useState('')
  const [savedReadings, setSavedReadings] = useState<SavedReadingSnapshot[]>(loadInitialSavedReadings)
  const [selectedSavedReadingId, setSelectedSavedReadingId] = useState<string | null>(null)
  const [storageMessage, setStorageMessage] = useState(loadInitialStorageMessage)
  const [pendingSurface, setPendingSurface] = useState<SurfaceId | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [hasSavedCurrentReading, setHasSavedCurrentReading] = useState(false)
  const [exportTarget, setExportTarget] = useState<ExportTarget | null>(null)
  const [includeExportNote, setIncludeExportNote] = useState(true)
  const [exportMessage, setExportMessage] = useState('')
  const [librarySearch, setLibrarySearch] = useState('')
  const [selectedLibraryCardId, setSelectedLibraryCardId] = useState(libraryCards[0]?.id ?? '')
  const startButtonRef = useRef<HTMLButtonElement>(null)
  const savedReadingStore = useMemo(() => createLocalSavedReadingStore(), [])

  const selectedSurface = useMemo(
    () => surfaces.find((surface) => surface.id === activeSurface) ?? surfaces[0],
    [activeSurface],
  )

  const selectedTopic = topicChoices.find((topic) => topic.id === selectedTopicId) ?? topicChoices[0]
  const selectedSpread = spreadOptions.find((spread) => spread.id === selectedSpreadId) ?? spreadOptions[0]
  const canShowPathNames = selectedSpreadId === 'decision-maker'
  const topicSummary = selectedTopic?.label ?? 'Love'
  const trimmedIntention = intention.trim()
  const pathNames = [pathAName.trim() || 'Path A', pathBName.trim() || 'Path B'] as const
  const ritualSeed = `${selectedSpreadId}:${selectedTopicId}:${readableSeed(trimmedIntention)}:${pathNames.join('|')}`
  const requiredDrawCount = selectedSpread.positions.length
  const nextRitualStage = ritualStages.find((stage) => !completedRitualStages.includes(stage.id))
  const tableDeckOrder = cutDeckOrder ?? sealedDeckOrder ?? placeholderRiderWaiteDeck.cards
  const fanCards = tableDeckOrder.slice(0, Math.max(fanPreviewCount, requiredDrawCount))
  const selectedSavedReading = savedReadings.find((entry) => entry.id === selectedSavedReadingId) ?? null
  const allRequiredCardsRevealed = reading
    ? reading.drawnCards.length === requiredDrawCount && reading.drawnCards.every((draw) => revealedCardIds.includes(draw.card.id))
    : false
  const hasUnsavedCompletedReading = readingStep === 'reveal' && reading !== null && allRequiredCardsRevealed && !hasSavedCurrentReading
  const shouldWarnBeforeLeaving = hasUnsavedCompletedReading || (readingStep === 'reveal' && allRequiredCardsRevealed && !hasSavedCurrentReading && journalDraft.trim().length > 0)
  const normalizedLibrarySearch = librarySearch.trim().toLowerCase()
  const filteredLibraryCards = useMemo(
    () => libraryCards.filter((card) => matchesCardSearch(card, normalizedLibrarySearch)),
    [normalizedLibrarySearch],
  )
  const selectedLibraryCard = libraryCards.find((card) => card.id === selectedLibraryCardId)
    ?? filteredLibraryCards[0]
    ?? libraryCards[0]
  const reducedMotion = motionPreference === 'reduced'
  const hasReadingInProgress = readingStep !== 'intro'
  const isDedicatedRitualSurface = activeSurface === 'home' && isRitualSurfaceOpen && hasReadingInProgress

  function setMotionPreference(next: MotionPreference) {
    setMotionPreferenceState(next)
    try {
      window.localStorage.setItem(motionPreferenceStorageKey, next)
      setStorageMessage(`Motion preference set to ${next === 'reduced' ? 'Reduced Motion' : 'Default Motion'} in this browser.`)
    } catch {
      setStorageMessage('Motion preference changed for this session, but browser storage is unavailable.')
    }
  }

  function dismissWelcomeNotice() {
    setShowWelcomeNotice(false)
    try {
      window.localStorage.setItem(welcomeNoticeStorageKey, welcomeNoticeDismissedValue)
    } catch {
      // Dismiss for this session if localStorage is unavailable.
    }
  }

  function resetReadingFlow() {
    setReadingStep('topic')
    setIsRitualSurfaceOpen(true)
    setCompletedRitualStages([])
    setSealedDeckOrder(null)
    setCutDeckOrder(null)
    setSelectedFanCardIds([])
    setRevealedCardIds([])
    setVisibleMeaningLayers(['summary'])
    setReading(null)
    setJournalDraft('')
    setHasSavedCurrentReading(false)
    setActiveSurface('home')
  }

  function beginRitual() {
    setCompletedRitualStages([])
    setSealedDeckOrder(null)
    setCutDeckOrder(null)
    setSelectedFanCardIds([])
    setRevealedCardIds([])
    setVisibleMeaningLayers(['summary'])
    setReading(null)
    setJournalDraft('')
    setHasSavedCurrentReading(false)
    setReadingStep('ritual')
  }

  function navigateToSurface(surfaceId: SurfaceId, force = false) {
    if (!force && activeSurface === 'home' && surfaceId !== 'home' && shouldWarnBeforeLeaving) {
      setPendingSurface(surfaceId)
      return
    }

    setIsRitualSurfaceOpen(false)
    setActiveSurface(surfaceId)
    if (surfaceId !== 'home') {
      setReadingStep('intro')
    }
  }

  function exitRitualSurface() {
    setIsRitualSurfaceOpen(false)
    setActiveSurface('home')
    startButtonRef.current?.focus()
  }

  function resumeRitualSurface() {
    setActiveSurface('home')
    setIsRitualSurfaceOpen(true)
  }

  function buildSavedReadingSnapshot(currentReading: ReadingSession): SavedReadingSnapshot {
    const note = journalDraft.trim()
    const topic = currentReading.topic ?? topicSummary
    return {
      id: `saved-${currentReading.id}-${Date.now().toString(36)}`,
      savedAt: new Date().toISOString(),
      topic,
      spreadTitle: displaySpreadTitle(currentReading.spread),
      note: note.length > 0 ? note : undefined,
      reading: currentReading,
    }
  }

  function saveCurrentReading() {
    if (!reading) {
      return
    }

    try {
      const next = savedReadingStore.save(buildSavedReadingSnapshot(reading))
      setSavedReadings(next)
      setHasSavedCurrentReading(true)
      setStorageMessage('Reading saved to this browser. It stays local to this device and may be cleared with browser data.')
    } catch {
      setStorageMessage('Could not save this reading. Browser storage may be full, blocked, or unavailable on this device.')
    }
  }

  function openExportPreview(target: ExportTarget) {
    setExportTarget(target)
    setIncludeExportNote(true)
    setExportMessage('')
  }

  function openCurrentExportPreview() {
    if (!reading) {
      return
    }

    openExportPreview({
      source: 'current',
      id: reading.id,
      topic: reading.topic ?? `${topicSummary}${trimmedIntention ? `: ${trimmedIntention}` : ''}`,
      spreadTitle: displaySpreadTitle(reading.spread),
      note: journalDraft.trim() || undefined,
      reading,
    })
  }

  function handleJournalDraftChange(value: string) {
    setJournalDraft(value.slice(0, journalNoteMaxLength))
  }

  function generateExport(format: ExportFormat) {
    if (!exportTarget) {
      return
    }

    try {
      const safeId = exportTarget.id.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()
      const shouldIncludeNote = includeExportNote && Boolean(exportTarget.note)
      const blob = format === 'pdf'
        ? buildExportPdf(exportTarget, shouldIncludeNote)
        : buildExportImage(exportTarget, shouldIncludeNote)
      downloadBlob(blob, `auratarot-${safeId}.${format === 'pdf' ? 'pdf' : 'svg'}`)
      setExportMessage(`Created a local ${format === 'pdf' ? 'PDF' : 'image'} export. Review the downloaded file before sharing.`)
    } catch {
      setExportMessage('Could not create the export file in this browser. You can close this preview and try again, or copy the preview text manually.')
    }
  }

  function confirmDeleteSavedReading() {
    if (!deleteTargetId) {
      return
    }

    try {
      const next = savedReadingStore.remove(deleteTargetId)
      setSavedReadings(next)
      setSelectedSavedReadingId((current) => (current === deleteTargetId ? null : current))
      setStorageMessage('Saved reading deleted from this browser only.')
    } catch {
      setStorageMessage('Could not delete the saved reading. Browser storage may be unavailable.')
    } finally {
      setDeleteTargetId(null)
    }
  }

  function confirmClearLocalData() {
    try {
      setSavedReadings(savedReadingStore.clear())
      setSelectedSavedReadingId(null)
      window.localStorage.removeItem(motionPreferenceStorageKey)
      window.localStorage.removeItem(welcomeNoticeStorageKey)
      setMotionPreferenceState('default')
      setStorageMessage('App-owned saved readings and preferences were cleared from this browser.')
    } catch {
      setStorageMessage('Could not clear app-owned local data. Browser storage may be unavailable.')
    } finally {
      setShowClearConfirm(false)
    }
  }

  function completeRitualStage(stage: RitualStage) {
    if (stage !== nextRitualStage?.id) {
      return
    }

    if (stage === 'shuffle') {
      setSealedDeckOrder((current) => current ?? sealDeckOrder(ritualSeed))
      setCutDeckOrder(null)
      setSelectedFanCardIds([])
      setCompletedRitualStages((current) => (current.includes(stage) ? current : [...current, stage]))
      return
    }

    if (stage === 'draw') {
      const deckOrder = cutDeckOrder ?? sealedDeckOrder
      if (!deckOrder || selectedFanCardIds.length < requiredDrawCount) {
        return
      }

      const nextReading = createReadingSession({
        spreadId: selectedSpreadId,
        topic: `${topicSummary}${trimmedIntention ? `: ${trimmedIntention}` : ''}`,
        seed: ritualSeed,
        deckOrder,
        selectedCardIds: selectedFanCardIds,
        pathNames: selectedSpreadId === 'decision-maker' ? pathNames : undefined,
      })
      setReading(nextReading)
      setRevealedCardIds([])
      setVisibleMeaningLayers(['summary'])
      setCompletedRitualStages((current) => (current.includes(stage) ? current : [...current, stage]))
      setReadingStep('reveal')
      return
    }

    setCompletedRitualStages((current) => [...current, stage])
  }

  function chooseCutPile(ratio: number) {
    if (nextRitualStage?.id !== 'cut' || !sealedDeckOrder) {
      return
    }

    const cutIndex = Math.max(1, Math.min(sealedDeckOrder.length - 1, Math.round(sealedDeckOrder.length * ratio)))
    setCutDeckOrder(rotateDeckOrder(sealedDeckOrder, cutIndex))
    setSelectedFanCardIds([])
    setCompletedRitualStages((current) => (current.includes('cut') ? current : [...current, 'cut']))
  }

  function toggleFanCard(cardId: string) {
    if (nextRitualStage?.id !== 'draw') {
      return
    }

    setSelectedFanCardIds((current) => {
      if (current.includes(cardId)) {
        return current.filter((id) => id !== cardId)
      }

      if (current.length >= requiredDrawCount) {
        return current
      }

      return [...current, cardId]
    })
  }

  function revealNextMeaningLayer() {
    setVisibleMeaningLayers((current) => {
      if (!current.includes('deeper')) {
        return [...current, 'deeper']
      }

      if (!current.includes('guidance')) {
        return [...current, 'guidance']
      }

      return current
    })
  }

  function revealDrawnCard(cardId: string) {
    setRevealedCardIds((current) => (current.includes(cardId) ? current : [...current, cardId]))
  }

  function renderSavedReadingDetail(entry: SavedReadingSnapshot) {
    return (
      <section className="journal-detail" aria-labelledby="saved-reading-detail-title">
        <p className="eyebrow">Saved {formatSavedAt(entry.savedAt)}</p>
        <h2 id="saved-reading-detail-title">Saved reading detail</h2>
        <div className="reading-summary" aria-label="Saved reading summary">
          <span>{entry.topic}</span>
          <span>{entry.spreadTitle}</span>
        </div>
        {entry.note ? (
          <div className="saved-note">
            <h3>Journal note</h3>
            <p>{entry.note}</p>
          </div>
        ) : (
          <p className="cta-note">No journal note was saved with this reading.</p>
        )}
        {entry.reading.drawnCards.length > 0 ? (
          <div className="revealed-grid">
            {entry.reading.drawnCards.map((draw) => {
              const interpretation = getInterpretation(draw)
              return (
                <article className="revealed-card" key={`${entry.id}-${draw.position.id}-${draw.card.id}`}>
                  <p className="position-label">{positionLabel(entry.reading, draw)}</p>
                  <h3>{draw.card.name}</h3>
                  <p className="orientation-pill">{draw.orientation}</p>
                  <p>{interpretation.summary}</p>
                </article>
              )
            })}
          </div>
        ) : null}
        <div className="button-row">
          <button className="secondary-button" onClick={() => {
            openExportPreview({
              source: 'saved',
              id: entry.id,
              savedAt: entry.savedAt,
              topic: entry.topic,
              spreadTitle: entry.spreadTitle,
              note: entry.note,
              reading: entry.reading,
            })
          }} type="button">
            Export saved reading
          </button>
          <button className="secondary-button" onClick={() => {
            setSelectedSavedReadingId(null)
          }} type="button">
            Back to journal list
          </button>
          <button className="danger-button" onClick={() => {
            setDeleteTargetId(entry.id)
          }} type="button">
            Delete saved reading
          </button>
        </div>
      </section>
    )
  }

  function renderJournalContent() {
    return (
      <section className="ritual-card journal-panel" aria-labelledby="journal-panel-title">
        <p className="eyebrow">Local-only journal</p>
        <h2 id="journal-panel-title">Saved readings stay on this device and browser</h2>
        <p className="ritual-copy">
          AuraTarot does not send saved readings to a backend, analytics service, AI service, or cloud sync. Entries may disappear if browser data is cleared.
        </p>
        {storageMessage ? <p className="status-message" role="status">{storageMessage}</p> : null}
        {selectedSavedReading ? renderSavedReadingDetail(selectedSavedReading) : (
          <>
            {savedReadings.length === 0 ? (
              <div className="empty-state">
                <h3>No saved readings yet</h3>
                <p>Complete a reading, add an optional journal note, and use Save Reading to keep it in this browser.</p>
              </div>
            ) : (
              <ul className="journal-list" aria-label="Saved readings">
                {savedReadings.map((entry) => (
                  <li key={entry.id}>
                    <button className="journal-entry-button" onClick={() => {
                      setSelectedSavedReadingId(entry.id)
                    }} type="button">
                      <strong>{entry.topic}</strong>
                      <span>{entry.spreadTitle} · {formatSavedAt(entry.savedAt)}</span>
                      {entry.note ? <small>{entry.note}</small> : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button className="danger-button" onClick={() => {
              setShowClearConfirm(true)
            }} type="button">
              Clear app-owned local data
            </button>
          </>
        )}
      </section>
    )
  }

  function renderLibraryContent() {
    if (!selectedLibraryCard) {
      return null
    }

    return (
      <section className="ritual-card library-panel" aria-labelledby="library-panel-title">
        <p className="eyebrow">Study aid only</p>
        <h2 id="library-panel-title">Browse simple card meanings</h2>
        <p className="ritual-copy">
          This library uses the same local tarot data and installed card images as readings. The copy is intentionally basic for MVP learning and does not add remote card data, AI meanings, or predictions.
        </p>
        <label className="field-label" htmlFor="card-library-search">
          Search cards by name or keyword
        </label>
        <input
          className="text-input"
          id="card-library-search"
          maxLength={120}
          onChange={(event) => {
            setLibrarySearch(event.target.value)
          }}
          placeholder="Try The Fool, cups, focused action, reflection..."
          type="search"
          value={librarySearch}
        />
        <div className="library-layout">
          <section className="library-results" aria-labelledby="library-results-title">
            <div className="library-results-heading">
              <h3 id="library-results-title">Cards</h3>
              <p aria-live="polite">{filteredLibraryCards.length} of {libraryCards.length} cards shown</p>
            </div>
            {filteredLibraryCards.length > 0 ? (
              <ul className="library-card-list" aria-label="Matching tarot cards">
                {filteredLibraryCards.map((card) => (
                  <li key={card.id}>
                    <button
                      aria-pressed={selectedLibraryCard.id === card.id}
                      className="library-card-button"
                      onClick={() => {
                        setSelectedLibraryCardId(card.id)
                      }}
                      type="button"
                    >
                      <strong>{card.name}</strong>
                      <span>{card.keywords.join(', ')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state" role="status">
                <h3>No cards match “{librarySearch}”</h3>
                <p>Try a card name like The Fool or a keyword like reflection, cups, or focused action.</p>
              </div>
            )}
          </section>
          <article className="library-detail" aria-labelledby="library-card-title">
            <CardFace card={selectedLibraryCard} className="library-art" />
            <div className="artwork-note">
              <strong>Artwork provenance</strong>
              <p>{placeholderArtworkNote}</p>
              <p>{placeholderRiderWaiteDeck.assetPolicy.note}</p>
            </div>
            <p className="position-label">{selectedLibraryCard.arcana === 'major' ? 'Major Arcana' : `Minor Arcana · ${selectedLibraryCard.suit ?? 'tarot'}`}</p>
            <h3 id="library-card-title">{selectedLibraryCard.name}</h3>
            <section aria-labelledby="library-keywords-title">
              <h4 id="library-keywords-title">Keywords</h4>
              <ul className="keyword-chip-list">
                {selectedLibraryCard.keywords.map((keyword) => (
                  <li key={keyword}>{keyword}</li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="upright-meaning-title">
              <h4 id="upright-meaning-title">Upright meaning</h4>
              <p>{getCardUprightMeaning(selectedLibraryCard)}</p>
            </section>
            <section aria-labelledby="reversed-meaning-title">
              <h4 id="reversed-meaning-title">Reversed meaning</h4>
              <p>{getCardReversedMeaning(selectedLibraryCard)}</p>
            </section>
          </article>
        </div>
      </section>
    )
  }

  function renderHomeContent() {
    if (hasReadingInProgress && !isRitualSurfaceOpen) {
      return (
        <div className="hero-actions" aria-label="Reading entry points">
          <button className="primary-cta" onClick={resumeRitualSurface} ref={startButtonRef} type="button">
            Resume Reading
          </button>
          <p className="cta-note" id="reading-local-note">
            Your current reading state is still held locally in this browser session.
          </p>
        </div>
      )
    }

    if (readingStep === 'topic') {
      return (
        <section className="ritual-card" aria-labelledby="topic-step-title">
          <p className="eyebrow">Step 1 of 4</p>
          <h2 id="topic-step-title">Choose your focus</h2>
          <p className="ritual-copy">
            Select a topic chip, then add an optional intention in your own words. This text stays in the browser state only.
          </p>
          <div className="chip-grid" aria-label="Suggested topics">
            {topicChoices.map((topic) => (
              <button
                aria-pressed={selectedTopicId === topic.id}
                className="choice-chip"
                key={topic.id}
                onClick={() => {
                  setSelectedTopicId(topic.id)
                }}
                type="button"
              >
                {topic.label}
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor="intention-input">
            Optional intention
          </label>
          <textarea
            className="text-field"
            id="intention-input"
            maxLength={320}
            onChange={(event) => {
              setIntention(event.target.value)
            }}
            placeholder="Example: Help me respond with steadiness."
            rows={4}
            value={intention}
          />
          <button className="primary-cta" onClick={() => {
            setReadingStep('spread')
          }} type="button">
            Continue to spreads
          </button>
        </section>
      )
    }

    if (readingStep === 'spread') {
      return (
        <section className="ritual-card" aria-labelledby="spread-step-title">
          <p className="eyebrow">Step 2 of 4</p>
          <h2 id="spread-step-title">Choose a spread</h2>
          <p className="ritual-copy">Crossroads maps offer different lenses; none are firm predictions.</p>
          <fieldset className="spread-fieldset">
            <legend className="sr-only">Available spreads</legend>
            {spreadOptions.map((spread) => (
              <label className="spread-option" key={spread.id}>
                <input
                  checked={selectedSpreadId === spread.id}
                  name="spread"
                  onChange={() => {
                    setSelectedSpreadId(spread.id)
                  }}
                  type="radio"
                  value={spread.id}
                />
                <span>
                  <strong>{displaySpreadTitle(spread)}</strong>
                  <small>{spreadTone(spread)}</small>
                </span>
              </label>
            ))}
          </fieldset>
          {canShowPathNames ? (
            <div className="path-name-grid">
              <label className="field-label" htmlFor="path-a-name">
                Path A name
                <input
                  className="text-input"
                  id="path-a-name"
                  maxLength={80}
                  onChange={(event) => {
                    setPathAName(event.target.value)
                  }}
                  value={pathAName}
                />
              </label>
              <label className="field-label" htmlFor="path-b-name">
                Path B name
                <input
                  className="text-input"
                  id="path-b-name"
                  maxLength={80}
                  onChange={(event) => {
                    setPathBName(event.target.value)
                  }}
                  value={pathBName}
                />
              </label>
            </div>
          ) : null}
          <div className="button-row">
            <button className="secondary-button" onClick={() => {
              setReadingStep('topic')
            }} type="button">
              Back
            </button>
            <button className="primary-cta" onClick={beginRitual} type="button">
              Begin ritual
            </button>
          </div>
        </section>
      )
    }

    if (readingStep === 'ritual') {
      return (
        <section className="ritual-card ritual-stage-card" aria-labelledby="ritual-step-title">
          <p className="eyebrow">Step 3 of 4</p>
          <h2 id="ritual-step-title">Ritual tarot table</h2>
          <p className="ritual-copy">
            Shuffle seals the local deck order once. Cut rotates that fixed order, draw chooses face-down cards, and reveal turns over only those cards.
          </p>
          <div className="tarot-table" data-reduced-motion={reducedMotion} data-stage={nextRitualStage?.id ?? 'complete'}>
            <div className="table-glow" aria-hidden="true" />
            <div className="deck-zone" aria-label="Visible sealed tarot deck">
              <div className="deck-stack" data-sealed={Boolean(sealedDeckOrder)}>
                {Array.from({ length: 7 }, (_, index) => (
                  <span className="deck-card-layer" key={index} style={{ '--layer-index': index } as CSSProperties} />
                ))}
                <span className="deck-back-symbol" aria-hidden="true">✦</span>
              </div>
              <p>{sealedDeckOrder ? `Reading set: ${String(tableDeckOrder.length)} cards fixed locally` : 'Unsealed placeholder deck'}</p>
            </div>

            {nextRitualStage?.id === 'cut' ? (
              <div className="cut-piles" aria-label="Choose a cut pile">
                {cutPileOptions.map((pile) => (
                  <button className="cut-pile" key={pile.id} onClick={() => { chooseCutPile(pile.ratio) }} type="button">
                    <span className="pile-cards" aria-hidden="true" />
                    <strong>{pile.label}</strong>
                    <small>{pile.description}</small>
                  </button>
                ))}
              </div>
            ) : null}

            {nextRitualStage?.id === 'draw' ? (
              <div className="fan-zone" aria-labelledby="fan-zone-title">
                <h3 id="fan-zone-title">Select {requiredDrawCount} face-down card{requiredDrawCount === 1 ? '' : 's'}</h3>
                <div className="card-fan" aria-label="Face-down tarot fan" style={{ '--fan-total': fanCards.length } as CSSProperties}>
                  {fanCards.map((card, index) => {
                    const isSelected = selectedFanCardIds.includes(card.id)
                    return (
                      <button
                        aria-label={`${isSelected ? 'Deselect' : 'Select'} face-down card ${index < 9 ? String(index + 1) : `number ${String(index + 1)}`}`}
                        aria-pressed={isSelected}
                        className="fan-card-button"
                        key={card.id}
                        onClick={() => { toggleFanCard(card.id) }}
                        style={{
                          '--fan-index': index,
                          '--fan-total': fanCards.length,
                          '--fan-offset': index - (fanCards.length - 1) / 2,
                          '--fan-depth': Math.abs(index - (fanCards.length - 1) / 2),
                        } as CSSProperties}
                        type="button"
                      >
                        <span className="card-back-mini" aria-hidden="true">✦</span>
                      </button>
                    )
                  })}
                </div>
                <button
                  className="primary-cta compact"
                  disabled={selectedFanCardIds.length !== requiredDrawCount}
                  onClick={() => { completeRitualStage('draw') }}
                  type="button"
                >
                  Draw selected cards
                </button>
              </div>
            ) : null}

            {reading && nextRitualStage?.id === 'reveal' ? (
              <div className="face-down-spread" aria-label="Selected cards remain face down until reveal">
                {reading.drawnCards.map((draw, index) => (
                  <article className="spread-slot face-down dealt-slot" key={`${draw.position.id}-${draw.card.id}`} style={{ '--deal-index': index } as CSSProperties}>
                    <div className="card-back-large" aria-label={`Face-down card for ${positionLabel(reading, draw)}`} role="img">✦</div>
                    <p className="position-label">{positionLabel(reading, draw)}</p>
                    <small>Card {String(index + 1)} is selected and hidden.</small>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
          <ol className="ritual-timeline" aria-label="Ritual progress">
            {ritualStages.map((stage) => {
              const isDone = completedRitualStages.includes(stage.id)
              const isNext = nextRitualStage?.id === stage.id
              const isManualStage = stage.id === 'cut' || stage.id === 'draw' || stage.id === 'reveal'
              return (
                <li className="ritual-stage" data-active={isNext} data-complete={isDone} key={stage.id}>
                  <span className="stage-orb" aria-hidden="true">✦</span>
                  <div>
                    <strong>{stage.label}</strong>
                    <p>{stage.description}</p>
                  </div>
                  <button
                    className="secondary-button"
                    disabled={!isNext || isManualStage}
                    onClick={() => {
                      completeRitualStage(stage.id)
                    }}
                    type="button"
                  >
                    {stage.id === 'reveal' ? 'Use card buttons' : isManualStage ? 'Use table' : stage.label}
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="cta-note" role="status">
            {nextRitualStage ? `Next: ${nextRitualStage.label}` : 'Ready to reveal.'}
          </p>
        </section>
      )
    }

    if (readingStep === 'reveal' && reading) {
      return (
        <section className="ritual-card reading-result" aria-labelledby="reading-result-title">
          <p className="eyebrow">Step 4 of 4</p>
          <h2 id="reading-result-title">Your reading</h2>
          <div className="reading-summary" aria-label="Reading summary">
            <span>{topicSummary}</span>
            {trimmedIntention ? <span>{trimmedIntention}</span> : null}
            <span>{displaySpreadTitle(reading.spread)}</span>
          </div>
          <div className="revealed-grid" aria-label="Reveal cards one at a time">
            {reading.drawnCards.map((draw, index) => {
              const interpretation = getInterpretation(draw)
              const isRevealed = revealedCardIds.includes(draw.card.id)
              return (
                <article
                  className={`revealed-card ritual-revealed-card${isRevealed ? ' is-card-revealed' : ' face-down dealt-slot'}`}
                  data-testid={isRevealed ? 'revealed-card' : 'face-down-reading-card'}
                  key={`${draw.position.id}-${draw.card.id}`}
                  style={{ '--deal-index': index } as CSSProperties}
                >
                  <button
                    aria-label={isRevealed
                      ? `Revealed card ${String(index + 1)} for ${positionLabel(reading, draw)}: ${draw.card.name}`
                      : `Reveal card ${String(index + 1)} for ${positionLabel(reading, draw)}`}
                    aria-pressed={isRevealed}
                    className="reveal-card-button"
                    disabled={isRevealed}
                    onClick={() => { revealDrawnCard(draw.card.id) }}
                    type="button"
                  >
                    <span className={`flip-card${isRevealed ? ' is-revealed' : ''}`}>
                      <span className="card-back-large flip-face flip-back" aria-hidden="true">✦</span>
                      <CardFace card={draw.card} className="flip-face flip-front" />
                    </span>
                  </button>
                  <p className="position-label">{positionLabel(reading, draw)}</p>
                  {isRevealed ? (
                    <>
                      <h3 data-testid="card-name">{draw.card.name}</h3>
                      <p className="orientation-pill">{draw.orientation}</p>
                      <p className="keyword-line">Keywords: {draw.card.keywords.join(', ')}</p>
                      <h4>Short summary</h4>
                      <p>{interpretation.summary}</p>
                    </>
                  ) : (
                    <p className="cta-note">Face down. Activate this card to reveal its fixed identity.</p>
                  )}
                  {isRevealed && visibleMeaningLayers.includes('deeper') ? (
                    <section className="meaning-layer" aria-label={`${draw.card.name} deeper meaning`}>
                      <h4>Deeper meaning</h4>
                      <p>{interpretation.deeperMeaning}</p>
                    </section>
                  ) : null}
                  {isRevealed && visibleMeaningLayers.includes('guidance') ? (
                    <section className="meaning-layer" aria-label={`${draw.card.name} practical guidance`}>
                      <h4>Practical next step</h4>
                      <p>{interpretation.nextStep}</p>
                    </section>
                  ) : null}
                </article>
              )
            })}
          </div>
          <p className="cta-note" role="status">
            {allRequiredCardsRevealed
              ? 'All selected cards are revealed. The reading is complete.'
              : `Reveal ${String(requiredDrawCount - revealedCardIds.length)} more card${requiredDrawCount - revealedCardIds.length === 1 ? '' : 's'} to complete the reading.`}
          </p>
          {allRequiredCardsRevealed && visibleMeaningLayers.length < 3 ? (
            <button className="primary-cta compact" onClick={revealNextMeaningLayer} type="button">
              Reveal {visibleMeaningLayers.includes('deeper') ? 'practical guidance' : 'deeper meaning'}
            </button>
          ) : null}
          {allRequiredCardsRevealed ? <div className="journal-draft" aria-labelledby="journal-draft-title">
            <h3 id="journal-draft-title">Journal draft</h3>
            <p>Use these prompts now. Save is manual and local-only; export remains a later placeholder.</p>
            <ul>
              {approvedJournalPrompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
            <label className="field-label" htmlFor="journal-draft-input">
              Journal note (optional)
            </label>
            <textarea
              aria-describedby="journal-draft-limit"
              className="text-field"
              id="journal-draft-input"
              maxLength={journalNoteMaxLength}
              onChange={(event) => {
                handleJournalDraftChange(event.target.value)
              }}
              placeholder="Write privately for this session. Save manually to keep it in this browser."
              rows={5}
              value={journalDraft}
            />
            <p className="cta-note" id="journal-draft-limit">
              Journal notes are limited to {journalNoteMaxLength} characters. {journalDraft.length} of {journalNoteMaxLength} characters used.
            </p>
            <div className="button-row">
              <button className="secondary-button" onClick={saveCurrentReading} type="button">
                Save reading
              </button>
              <button className="secondary-button" onClick={openCurrentExportPreview} type="button">
                Export reading
              </button>
              <button className="primary-cta compact" onClick={resetReadingFlow} type="button">
                Begin another reading
              </button>
            </div>
            {storageMessage ? <p className="status-message" role="status">{storageMessage}</p> : null}
          </div> : null}
        </section>
      )
    }

    return (
      <div className="hero-actions" aria-label="Reading entry points">
        <button className="primary-cta" onClick={hasReadingInProgress ? resumeRitualSurface : resetReadingFlow} ref={startButtonRef} type="button">
          {hasReadingInProgress ? 'Resume Reading' : 'Start a Reading'}
        </button>
        <p className="cta-note" id="reading-local-note">
          No account, backend, analytics, or AI service is used for this local ritual.
        </p>
      </div>
    )
  }

  function renderExportPreviewModal() {
    if (!exportTarget) {
      return null
    }

    const hasNote = Boolean(exportTarget.note)
    const shouldShowNote = hasNote && includeExportNote

    return (
      <ModalDialog className="export-modal" labelledBy="export-preview-title" onEscape={() => {
        setExportTarget(null)
        setExportMessage('')
      }}>
          <p className="eyebrow">Client-side only</p>
          <h2 id="export-preview-title">Export preview</h2>
          <p className="privacy-reminder">
            Gentle privacy reminder: this export may include your topic, question, and journal note. Nothing is uploaded; the file is generated in this browser only.
          </p>
          <div className="export-note-control" aria-live="polite">
            <strong>{shouldShowNote ? 'Journal note included' : 'Journal note excluded'}</strong>
            <span>{hasNote ? 'The journal note is included by default. You can remove it before downloading.' : 'No journal note is available for this export.'}</span>
            {hasNote ? (
              <button className="secondary-button" onClick={() => {
                setIncludeExportNote((current) => !current)
              }} type="button">
                {includeExportNote ? 'Exclude journal note' : 'Include journal note'}
              </button>
            ) : null}
          </div>
          <div className="export-preview-card" aria-label="Export content preview">
            <p className="eyebrow">Preview content</p>
            <h3>{exportTarget.topic}</h3>
            <p>{exportTarget.spreadTitle} · {formatExportTimestamp(exportTarget.savedAt)}</p>
            <div className="revealed-grid compact-grid">
              {exportTarget.reading.drawnCards.map((draw) => {
                const interpretation = getInterpretation(draw)
                return (
                  <article className="revealed-card" key={`${exportTarget.id}-${draw.position.id}-${draw.card.id}`}>
                    <p className="position-label">{positionLabel(exportTarget.reading, draw)}</p>
                    <h4>{draw.card.name}</h4>
                    <p className="orientation-pill">{draw.orientation}</p>
                    <p>{interpretation.summary}</p>
                  </article>
                )
              })}
            </div>
            {shouldShowNote ? (
              <div className="saved-note export-note" data-testid="export-preview-note">
                <h4>Journal note included in export</h4>
                <p>{exportTarget.note}</p>
              </div>
            ) : (
              <p className="cta-note">Journal note will not be included in the generated file.</p>
            )}
          </div>
          {exportMessage ? <p className="status-message" role="status">{exportMessage}</p> : null}
          <div className="button-row">
            <button className="primary-cta compact" onClick={() => {
              generateExport('pdf')
            }} type="button">
              Download PDF
            </button>
            <button className="secondary-button" onClick={() => {
              generateExport('image')
            }} type="button">
              Download image
            </button>
            <button className="secondary-button" onClick={() => {
              setExportTarget(null)
              setExportMessage('')
            }} type="button">
              Close export preview
            </button>
          </div>
      </ModalDialog>
    )
  }

  function renderDedicatedRitualSurface() {
    const isTableActive = readingStep === 'ritual' || readingStep === 'reveal'

    return (
      <main className={`ritual-page${isTableActive ? ' is-table-active' : ''}`} id="sanctuary-content" aria-label="Dedicated ritual reading surface">
        <header className="ritual-page-header">
          <a className="skip-link" href="#ritual-surface-content">
            Skip to ritual content
          </a>
          <div className="brand-lockup" aria-label="AuraTarot ritual surface">
            <span className="brand-mark" aria-hidden="true">
              ✦
            </span>
            <div>
              <p className="brand-kicker">AuraTarot</p>
              <p className="brand-subtitle">Dedicated local ritual surface</p>
            </div>
          </div>
          <div className="ritual-page-actions" aria-label="Ritual surface exits">
            <button className="secondary-button" onClick={() => { navigateToSurface('journal') }} type="button">
              Journal
            </button>
            <button className="secondary-button" onClick={exitRitualSurface} type="button">
              Exit to sanctuary
            </button>
          </div>
        </header>

        <section className="ritual-page-stage" id="ritual-surface-content" aria-labelledby="ritual-page-title">
          <div className="ritual-page-intro">
            <p className="eyebrow">Full-page reading table</p>
            <h1 id="ritual-page-title">Your private ritual is open</h1>
            <p className="lede">
              Deck, spread, reveal, save, and export stay in this uninterrupted surface. Use Exit to sanctuary to step away without clearing the current reading state.
            </p>
          </div>
          {renderHomeContent()}
        </section>
      </main>
    )
  }

  return (
      <div className={`app-shell${isDedicatedRitualSurface ? ' is-ritual-shell' : ''}`} data-reduced-motion={reducedMotion}>
      {isDedicatedRitualSurface ? renderDedicatedRitualSurface() : (
        <>
      <header className="site-header">
        <a className="skip-link" href="#sanctuary-content">
          Skip to sanctuary content
        </a>
        <div className="brand-lockup" aria-label="AuraTarot home">
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>
          <div>
            <p className="brand-kicker">AuraTarot</p>
            <p className="brand-subtitle">Private reflection, locally held</p>
          </div>
        </div>
        <nav className="primary-nav" aria-label="Primary sections">
          {surfaces.map((surface) => (
            <button
              aria-current={activeSurface === surface.id ? 'page' : undefined}
              className="nav-button"
              key={surface.id}
              onClick={() => {
                navigateToSurface(surface.id)
              }}
              type="button"
            >
              {surface.label}
            </button>
          ))}
        </nav>
      </header>

      {showWelcomeNotice ? (
        <section className="welcome-notice" role="status" aria-label="Privacy note">
          <div>
            <strong>Private by default</strong>
            <p>
              Readings and notes stay on this device and browser. There are no accounts, analytics, AI calls, or cloud sync, and local data may disappear if browser data is cleared.
            </p>
          </div>
          <button className="secondary-button" onClick={dismissWelcomeNotice} type="button">
            Dismiss privacy note
          </button>
        </section>
      ) : null}

      <main className="sanctuary-layout" id="sanctuary-content">
        <section className="hero-card" aria-labelledby="app-title">
          <p className="eyebrow">{selectedSurface.eyebrow}</p>
          <h1 id="app-title">{selectedSurface.title}</h1>
          <p className="lede">{selectedSurface.description}</p>

          {activeSurface === 'home' ? renderHomeContent() : null}
          {activeSurface === 'journal' ? renderJournalContent() : null}
          {activeSurface === 'library' ? renderLibraryContent() : null}
        </section>

        <aside className="surface-panel" aria-labelledby="surface-panel-title">
          <p className="eyebrow">Current surface</p>
          <h2 id="surface-panel-title">{selectedSurface.label}</h2>
          <p>{selectedSurface.description}</p>

          {activeSurface === 'preferences' ? (
            <div className="preferences-stack">
              <div className="preference-card">
                <div>
                  <h3>Motion preference</h3>
                  <p id="motion-control-description">
                    Choose Default Motion or Reduced Motion. This preference is saved only in this browser.
                  </p>
                </div>
                <div className="button-row" aria-describedby="motion-control-description" aria-label="Motion preference" role="group">
                  <button
                    aria-pressed={motionPreference === 'default'}
                    className="motion-toggle"
                    onClick={() => {
                      setMotionPreference('default')
                    }}
                    type="button"
                  >
                    Default Motion
                  </button>
                  <button
                    aria-pressed={motionPreference === 'reduced'}
                    className="motion-toggle"
                    onClick={() => {
                      setMotionPreference('reduced')
                    }}
                    type="button"
                  >
                    Reduced Motion
                  </button>
                </div>
              </div>

              <section className="preference-card" aria-labelledby="privacy-preferences-title">
                <div>
                  <h3 id="privacy-preferences-title">Privacy and local data</h3>
                  <p>
                    Saved readings and notes are stored only in this browser on this device. They may disappear if browser data is cleared, and they are not protected by accounts or passwords.
                  </p>
                  <p>
                    No analytics, telemetry, remote fonts, cloud sync, or AI calls are used in this v1 app.
                  </p>
                  {storageMessage ? <p className="status-message" role="status">{storageMessage}</p> : null}
                </div>
                <button className="danger-button" onClick={() => {
                  setShowClearConfirm(true)
                }} type="button">
                  Clear app-owned local data
                </button>
              </section>

              <section className="preference-card" aria-labelledby="pwa-posture-title">
                <div>
                  <h3 id="pwa-posture-title">Install and cache posture</h3>
                  <p>
                    AuraTarot includes conservative static app metadata and placeholder icons for install surfaces. No service worker cache is registered in this build, so saved readings, journal notes, exports, and generated reading content are not cached by a PWA worker.
                  </p>
                </div>
              </section>
            </div>
          ) : (
            <ul className="placeholder-list" aria-label="Local reading safeguards">
              <li>No network transmission for reading generation.</li>
              <li>Card faces load from local installed files only; no remote artwork requests.</li>
              <li>Journal saves and exports stay local to this browser; review files before sharing.</li>
            </ul>
          )}
        </aside>
      </main>
        </>
      )}
      {pendingSurface ? (
        <ModalDialog labelledBy="leave-dialog-title" onEscape={() => {
          setPendingSurface(null)
        }}>
            <h2 id="leave-dialog-title">Leave without saving?</h2>
            <p>Your completed reading or journal note has not been saved. Save it first if you want it to remain in this browser.</p>
            <div className="button-row">
              <button className="secondary-button" onClick={() => {
                setPendingSurface(null)
              }} type="button">
                Stay
              </button>
              <button className="danger-button" onClick={() => {
                const next = pendingSurface
                setPendingSurface(null)
                navigateToSurface(next, true)
              }} type="button">
                Leave without saving
              </button>
            </div>
        </ModalDialog>
      ) : null}
      {deleteTargetId ? (
        <ModalDialog labelledBy="delete-dialog-title" onEscape={() => {
          setDeleteTargetId(null)
        }}>
            <h2 id="delete-dialog-title">Delete saved reading?</h2>
            <p>This removes only the selected saved reading from this browser. Other saved readings are preserved.</p>
            <div className="button-row">
              <button className="secondary-button" onClick={() => {
                setDeleteTargetId(null)
              }} type="button">
                Cancel
              </button>
              <button className="danger-button" onClick={confirmDeleteSavedReading} type="button">
                Yes, delete
              </button>
            </div>
        </ModalDialog>
      ) : null}
      {showClearConfirm ? (
        <ModalDialog labelledBy="clear-dialog-title" onEscape={() => {
          setShowClearConfirm(false)
        }}>
            <h2 id="clear-dialog-title">Clear app-owned local data?</h2>
            <p>This clears AuraTarot saved readings and preferences from this browser only. It does not affect anything outside AuraTarot app-owned local storage keys.</p>
            <div className="button-row">
              <button className="secondary-button" onClick={() => {
                setShowClearConfirm(false)
              }} type="button">
                Cancel
              </button>
              <button className="danger-button" onClick={confirmClearLocalData} type="button">
                Yes, clear local data
              </button>
            </div>
        </ModalDialog>
      ) : null}
      {renderExportPreviewModal()}
    </div>
  )
}
