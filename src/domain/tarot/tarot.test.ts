import { describe, expect, it } from 'vitest'
import {
  createReadingSession,
  getInterpretation,
  placeholderRiderWaiteDeck,
  spreads,
} from './index'

describe('tarot domain', () => {
  it('defines a unique 78-card placeholder deck with no real artwork', () => {
    const ids = placeholderRiderWaiteDeck.cards.map((card) => card.id)
    const assets: { kind: string; licenseStatus: string; src: string }[] = placeholderRiderWaiteDeck.cards.map(
      (card) => card.asset,
    )

    expect(placeholderRiderWaiteDeck.cards).toHaveLength(78)
    expect(new Set(ids).size).toBe(ids.length)
    expect(placeholderRiderWaiteDeck.assetPolicy.licenseStatus).toBe('placeholder')
    expect(assets.every((asset) => asset.licenseStatus === 'placeholder')).toBe(true)
    expect(assets.every((asset) => asset.kind === 'symbolic-placeholder')).toBe(true)
    expect(assets.every((asset) => asset.src.startsWith('placeholder://'))).toBe(true)
    expect(assets.some((asset) => /\.png$|\.jpe?g$|\.webp$/i.exec(asset.src))).toBe(false)
  })

  it('maps approved spread definitions to stable positions', () => {
    expect(spreads.dailyGuidance.positions.map((position) => position.id)).toEqual(['guidance'])
    expect(spreads.crossroadsTimeline.positions.map((position) => position.id)).toEqual([
      'past',
      'present',
      'near-future',
    ])
    expect(spreads.crossroadsProblemSolving.positions.map((position) => position.id)).toEqual([
      'challenge',
      'support',
      'next-step',
    ])
    expect(spreads.decisionMaker.positions.map((position) => position.id)).toEqual([
      'path-a',
      'path-b',
    ])
  })

  it('draws deterministic readings without duplicate cards', () => {
    const first = createReadingSession({
      spreadId: 'crossroads-timeline',
      seed: 'auratarot-test-seed',
      topic: 'career',
    })
    const second = createReadingSession({
      spreadId: 'crossroads-timeline',
      seed: 'auratarot-test-seed',
      topic: 'career',
    })

    expect(first.drawnCards).toEqual(second.drawnCards)
    expect(new Set(first.drawnCards.map((draw) => draw.card.id)).size).toBe(first.drawnCards.length)
    expect(first.drawnCards.map((draw) => draw.position.id)).toEqual(['past', 'present', 'near-future'])
  })

  it('supports decision maker path defaults and rejects undersized decks', () => {
    const reading = createReadingSession({ spreadId: 'decision-maker', seed: 'decision-defaults' })

    expect(reading.pathNames).toEqual(['Path A', 'Path B'])
    expect(reading.drawnCards).toHaveLength(2)
    expect(() =>
      createReadingSession({
        spreadId: 'crossroads-problem-solving',
        seed: 'too-small',
        deck: { ...placeholderRiderWaiteDeck, cards: placeholderRiderWaiteDeck.cards.slice(0, 2) },
      }),
    ).toThrow('Deck does not contain enough cards')
  })

  it('represents upright and reversed orientation through deterministic seeds', () => {
    const orientations = new Set(
      Array.from({ length: 40 }, (_, index) =>
        createReadingSession({ spreadId: 'daily-guidance', seed: `orientation-${String(index)}` }).drawnCards[0]
          ?.orientation,
      ),
    )

    expect(orientations).toContain('upright')
    expect(orientations).toContain('reversed')
  })

  it('returns warm practical interpretation layers without firm predictions', () => {
    const reading = createReadingSession({ spreadId: 'daily-guidance', seed: 'meaning-shape' })
    const drawnCard = reading.drawnCards[0]

    expect(drawnCard).toBeDefined()
    if (!drawnCard) {
      throw new Error('Expected a drawn card for daily guidance')
    }
    const interpretation = getInterpretation(drawnCard)

    expect(interpretation.summary.length).toBeGreaterThan(10)
    expect(interpretation.deeperMeaning.length).toBeGreaterThan(10)
    expect(interpretation.nextStep.length).toBeGreaterThan(10)
    expect(interpretation.journalPrompts.length).toBeGreaterThanOrEqual(2)
    expect(`${interpretation.summary} ${interpretation.deeperMeaning} ${interpretation.nextStep}`).not.toMatch(
      /will definitely|guaranteed|destined|certainly happen/i,
    )
  })
})
