import { expect, test } from '@playwright/test'

test('built app completes a local reading ritual', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Start a Reading' }).click()
  await expect(page.getByRole('main', { name: /Dedicated ritual reading surface/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary sections' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Love' }).click()
  await page.getByRole('button', { name: 'Continue to spreads' }).click()
  await page.getByRole('radio', { name: /Daily Guidance/ }).click()
  await page.getByRole('button', { name: 'Begin ritual' }).click()
  await expect(page.getByRole('heading', { name: 'Ritual tarot table' })).toBeVisible()
  await page.getByRole('button', { name: 'Shuffle' }).click()
  await page.getByRole('button', { name: 'Center pile' }).click()
  await page.getByRole('button', { name: 'Select face-down card 1' }).click()
  await page.getByRole('button', { name: 'Draw selected cards' }).click()
  await expect(page.getByRole('button', { name: /Reveal card 1/ })).toBeVisible()
  await page.getByRole('button', { name: /Reveal card 1/ }).click()
  await page.getByRole('button', { name: 'Reveal deeper meaning' }).click()
  await page.getByRole('button', { name: 'Reveal practical guidance' }).click()

  await expect(page.getByRole('heading', { name: 'Your reading' })).toBeVisible()
  await expect(page.getByText('Short summary')).toBeVisible()
  await page.getByLabel('Journal note (optional)').fill('A private smoke-test note')
  await page.getByRole('button', { name: 'Save reading' }).click()
  await expect(page.getByText(/Reading saved to this browser/)).toBeVisible()
  await page.getByRole('button', { name: 'Journal' }).click()
  await expect(page.getByRole('heading', { name: 'Saved readings journal' })).toBeVisible()
  await expect(page.getByText('A private smoke-test note')).toBeVisible()
})

test('built app supports card library browse and search with local artwork only', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Start a Reading' })).toBeVisible()
  await page.getByRole('button', { name: 'Card Library' }).click()

  await expect(page.getByRole('heading', { name: 'Learn the cards gently' })).toBeVisible()
  await expect(page.getByText(/locally installed public\/cards\/rws-roses-lilies deck/)).toBeVisible()

  await page.getByLabel('Search cards by name or keyword').fill('focused action')
  await expect(page.getByRole('button', { name: /The Magician/ })).toBeVisible()
  await page.getByRole('button', { name: /The Magician/ }).click()
  await expect(page.getByRole('heading', { name: 'The Magician' })).toBeVisible()
  await expect(page.getByTestId('local-card-image')).toHaveAttribute('src', /\/cards\/rws-roses-lilies\/the-magician\.jpg$/)
  await expect(page.getByRole('heading', { name: 'Upright meaning' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reversed meaning' })).toBeVisible()

  await page.getByLabel('Search cards by name or keyword').fill('<img src=x onerror=alert(1)>')
  await expect(page.getByText(/<img src=x onerror=alert\(1\)>/)).toBeVisible()
  await expect(page.locator('img[src="x"]')).toHaveCount(0)
})
