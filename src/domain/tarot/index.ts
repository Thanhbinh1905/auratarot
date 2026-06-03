export type TarotOrientation = 'upright' | 'reversed'
export type Arcana = 'major' | 'minor'
export type TarotSuit = 'wands' | 'cups' | 'swords' | 'pentacles'
export type AssetLicenseStatus = 'placeholder'
export type SpreadId =
  | 'daily-guidance'
  | 'crossroads-timeline'
  | 'crossroads-problem-solving'
  | 'decision-maker'

export interface PlaceholderAssetMetadata {
  id: string
  kind: 'symbolic-placeholder'
  src: string
  alt: string
  licenseStatus: AssetLicenseStatus
  provenance: 'generated-symbolic-reference'
}

export interface TarotCard {
  id: string
  name: string
  arcana: Arcana
  suit?: TarotSuit
  rank?: string
  number?: number
  keywords: string[]
  asset: PlaceholderAssetMetadata
}

export interface Deck {
  id: string
  name: string
  description: string
  cards: TarotCard[]
  assetPolicy: {
    licenseStatus: AssetLicenseStatus
    note: string
  }
}

export interface SpreadPosition {
  id: string
  label: string
  guidance: string
}

export interface Spread {
  id: SpreadId
  title: string
  style: 'daily' | 'timeline' | 'problem-solving' | 'decision'
  positions: SpreadPosition[]
  defaultPathNames?: readonly [string, string]
}

export interface DrawnCard {
  card: TarotCard
  position: SpreadPosition
  orientation: TarotOrientation
}

export interface ReadingSession {
  id: string
  spread: Spread
  topic?: string
  pathNames?: readonly [string, string]
  seed: string
  drawnCards: DrawnCard[]
}

export interface Interpretation {
  cardId: string
  orientation: TarotOrientation
  positionId: string
  summary: string
  deeperMeaning: string
  nextStep: string
  journalPrompts: string[]
}

interface CreateReadingSessionInput {
  spreadId: SpreadId
  seed: string
  topic?: string
  pathNames?: readonly [string, string]
  deck?: Deck
}

const majorArcana: readonly { name: string; keyword: string }[] = [
  { name: 'The Fool', keyword: 'fresh starts' },
  { name: 'The Magician', keyword: 'focused action' },
  { name: 'The High Priestess', keyword: 'inner knowing' },
  { name: 'The Empress', keyword: 'nurturing growth' },
  { name: 'The Emperor', keyword: 'healthy structure' },
  { name: 'The Hierophant', keyword: 'shared wisdom' },
  { name: 'The Lovers', keyword: 'values and choice' },
  { name: 'The Chariot', keyword: 'steady direction' },
  { name: 'Strength', keyword: 'gentle courage' },
  { name: 'The Hermit', keyword: 'reflection' },
  { name: 'Wheel of Fortune', keyword: 'changing cycles' },
  { name: 'Justice', keyword: 'fair assessment' },
  { name: 'The Hanged Man', keyword: 'new perspective' },
  { name: 'Death', keyword: 'necessary transition' },
  { name: 'Temperance', keyword: 'integration' },
  { name: 'The Devil', keyword: 'unhelpful attachment' },
  { name: 'The Tower', keyword: 'honest disruption' },
  { name: 'The Star', keyword: 'renewed hope' },
  { name: 'The Moon', keyword: 'uncertainty' },
  { name: 'The Sun', keyword: 'clarity and warmth' },
  { name: 'Judgement', keyword: 'self-review' },
  { name: 'The World', keyword: 'completion' },
]

const suitThemes: Record<TarotSuit, string> = {
  wands: 'energy and initiative',
  cups: 'feelings and relationships',
  swords: 'thoughts and communication',
  pentacles: 'resources and daily life',
}

const suitLabels: Record<TarotSuit, string> = {
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pentacles',
}

const rankThemes: readonly { rank: string; label: string; keyword: string }[] = [
  { rank: 'ace', label: 'Ace', keyword: 'seed potential' },
  { rank: 'two', label: 'Two', keyword: 'choice and balance' },
  { rank: 'three', label: 'Three', keyword: 'early growth' },
  { rank: 'four', label: 'Four', keyword: 'stability' },
  { rank: 'five', label: 'Five', keyword: 'friction' },
  { rank: 'six', label: 'Six', keyword: 'adjustment' },
  { rank: 'seven', label: 'Seven', keyword: 'assessment' },
  { rank: 'eight', label: 'Eight', keyword: 'movement' },
  { rank: 'nine', label: 'Nine', keyword: 'integration' },
  { rank: 'ten', label: 'Ten', keyword: 'culmination' },
  { rank: 'page', label: 'Page', keyword: 'learning' },
  { rank: 'knight', label: 'Knight', keyword: 'active pursuit' },
  { rank: 'queen', label: 'Queen', keyword: 'mature receptivity' },
  { rank: 'king', label: 'King', keyword: 'steady leadership' },
]

const suitOrder: readonly TarotSuit[] = ['wands', 'cups', 'swords', 'pentacles']

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function placeholderAsset(cardId: string, name: string): PlaceholderAssetMetadata {
  return {
    id: `asset-${cardId}`,
    kind: 'symbolic-placeholder',
    src: `placeholder://tarot/${cardId}`,
    alt: `Symbolic placeholder for ${name}`,
    licenseStatus: 'placeholder',
    provenance: 'generated-symbolic-reference',
  }
}

function buildCards(): TarotCard[] {
  const majors = majorArcana.map((card, number) => {
    const id = `major-${slug(card.name)}`
    return {
      id,
      name: card.name,
      arcana: 'major' as const,
      number,
      keywords: [card.keyword, 'reflection', 'personal growth'],
      asset: placeholderAsset(id, card.name),
    }
  })

  const minors = suitOrder.flatMap((suit) =>
    rankThemes.map((rankTheme) => {
      const name = `${rankTheme.label} of ${suitLabels[suit]}`
      const id = `minor-${suit}-${rankTheme.rank}`
      return {
        id,
        name,
        arcana: 'minor' as const,
        suit,
        rank: rankTheme.rank,
        keywords: [rankTheme.keyword, suitThemes[suit], 'practical awareness'],
        asset: placeholderAsset(id, name),
      }
    }),
  )

  return [...majors, ...minors]
}

export const placeholderRiderWaiteDeck: Deck = {
  id: 'placeholder-rws-symbolic-v1',
  name: 'Placeholder Rider-Waite-Smith Structured Deck',
  description:
    'A complete 78-card tarot identity set with symbolic placeholder asset references only; no real artwork is bundled.',
  cards: buildCards(),
  assetPolicy: {
    licenseStatus: 'placeholder',
    note: 'Real Rider-Waite-Smith assets remain gated by PRE-001; these references are symbolic placeholders.',
  },
}

export const spreads = {
  dailyGuidance: {
    id: 'daily-guidance',
    title: 'Daily Guidance',
    style: 'daily',
    positions: [{ id: 'guidance', label: 'Guidance', guidance: 'A practical theme to carry through today.' }],
  },
  crossroadsTimeline: {
    id: 'crossroads-timeline',
    title: 'Crossroads: Timeline',
    style: 'timeline',
    positions: [
      { id: 'past', label: 'Past', guidance: 'What is still shaping the situation.' },
      { id: 'present', label: 'Present', guidance: 'What is asking for attention now.' },
      { id: 'near-future', label: 'Near Future', guidance: 'A possible direction to prepare for.' },
    ],
  },
  crossroadsProblemSolving: {
    id: 'crossroads-problem-solving',
    title: 'Crossroads: Problem-solving',
    style: 'problem-solving',
    positions: [
      { id: 'challenge', label: 'Challenge', guidance: 'The tension or obstacle to name clearly.' },
      { id: 'support', label: 'Support', guidance: 'A strength or resource you can lean on.' },
      { id: 'next-step', label: 'Next Step', guidance: 'A grounded action to consider.' },
    ],
  },
  decisionMaker: {
    id: 'decision-maker',
    title: 'Decision Maker',
    style: 'decision',
    defaultPathNames: ['Path A', 'Path B'],
    positions: [
      { id: 'path-a', label: 'Path A', guidance: 'What this option may ask you to work with.' },
      { id: 'path-b', label: 'Path B', guidance: 'What this option may ask you to work with.' },
    ],
  },
} satisfies Record<string, Spread>

const spreadById: Record<SpreadId, Spread> = Object.fromEntries(
  Object.values(spreads).map((spread) => [spread.id, spread]),
) as Record<SpreadId, Spread>

function seedToUint32(seed: string): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createSeededRandom(seed: string): () => number {
  let state = seedToUint32(seed)
  return () => {
    state += 0x6d2b79f5
    let next = state
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffleDeck(cards: readonly TarotCard[], random: () => number): TarotCard[] {
  const shuffled = [...cards]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index]
    const swap = shuffled[swapIndex]
    if (!current || !swap) {
      continue
    }
    shuffled[index] = swap
    shuffled[swapIndex] = current
  }
  return shuffled
}

export function createReadingSession(input: CreateReadingSessionInput): ReadingSession {
  const spread = spreadById[input.spreadId]
  const deck = input.deck ?? placeholderRiderWaiteDeck

  if (deck.cards.length < spread.positions.length) {
    throw new Error('Deck does not contain enough cards for this spread')
  }

  const cardRandom = createSeededRandom(`${input.seed}:cards`)
  const orientationRandom = createSeededRandom(`${input.seed}:orientation`)
  const shuffled = shuffleDeck(deck.cards, cardRandom)
  const drawnCards = spread.positions.map((position, index) => {
    const card = shuffled[index]
    if (!card) {
      throw new Error(`Missing drawn card for position ${position.id}`)
    }
    return {
      card,
      position,
      orientation: orientationRandom() < 0.5 ? 'upright' : 'reversed',
    }
  })

  return {
    id: `reading-${slug(input.spreadId)}-${seedToUint32(input.seed).toString(16)}`,
    spread,
    topic: input.topic,
    pathNames: input.pathNames ?? spread.defaultPathNames,
    seed: input.seed,
    drawnCards,
  }
}

function orientationPhrase(orientation: TarotOrientation): string {
  return orientation === 'upright'
    ? 'in a direct and available way'
    : 'with a quieter, more internal invitation to pause and rebalance'
}

export function getInterpretation(drawnCard: DrawnCard): Interpretation {
  const primaryKeyword = drawnCard.card.keywords[0] ?? 'reflection'
  const positionLabel = drawnCard.position.label.toLowerCase()
  const orientation = orientationPhrase(drawnCard.orientation)

  return {
    cardId: drawnCard.card.id,
    orientation: drawnCard.orientation,
    positionId: drawnCard.position.id,
    summary: `${drawnCard.card.name} brings ${primaryKeyword} to the ${positionLabel} position ${orientation}.`,
    deeperMeaning: `This card suggests noticing patterns around ${drawnCard.card.keywords.join(
      ', ',
    )}. Treat it as reflective guidance rather than a fixed prediction, and let the position question shape what feels useful.`,
    nextStep: `Choose one small, grounded action that honors ${primaryKeyword}; keep it practical enough to try today and gentle enough to revise if new information appears.`,
    journalPrompts: [
      `Where do I notice ${primaryKeyword} in this situation?`,
      `What is one caring next step connected to ${drawnCard.position.guidance.toLowerCase()}`,
    ],
  }
}
