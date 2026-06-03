# PRODUCT REQUIREMENT DOCUMENT (PRD)

## Project: AuraTarot Platform

---

## 1. Executive Summary & Vision

**AuraTarot** is an immersive, elegant, and instant-access digital tarot reading platform. Designed as a modern, meditative sanctuary, it allows users to seek daily guidance, reflect on life choices, and maintain a private journal of their spiritual journey.

The core philosophy of AuraTarot is **frictionless privacy**. There are no accounts to create, no passwords to remember, and no paywalls. The application functions entirely on the user's local device, ensuring their deeply personal readings and journal entries remain completely private and under their control.

---

## 2. User Experience & Core Philosophy

- **Instant Entry:** Users are not blocked by onboarding sequences or registration forms. The homepage immediately introduces them to the ritual.
- **Absolute Privacy:** Because tarot reflections are deeply personal, the platform operates under a strict privacy-first model. A clear notice informs users that their data is stored safely on their own device and is never transmitted to an external server.
- **Tactile Realism:** The digital experience mimics the physical act of handling a tarot deck—shuffling, cutting, fanning, and flipping cards—to ground the user in the ritual.

---

## 3. Detailed Feature Specifications

### A. The Landing Page & Spread Selection

- **The Atmosphere:** A beautiful, dark-themed interface utilizing midnight blues, deep charcoal blacks, and elegant gold accents. The typography is modern yet classic, setting a grounded, mystical tone.
- **Spread Selector:** Users can immediately choose from three distinct reading types depending on their current emotional or situational needs.

### B. The Reading Ritual (Core Interaction)

- **The Shuffle:** A single, intuitive action allows the user to initiate a fluid visual shuffling animation of the deck, building anticipation.
- **The Fan & Selection:** The deck beautifully fans across the screen. Users interact directly with the deck to select the specific cards they feel drawn to.
- **The Deal:** Selected cards travel smoothly into their designated positions on the digital table, dealt face-down.
- **The 3D Reveal:** Users tap each card individually to flip it over. The reveal features a smooth, realistic 3D flipping animation, exposing the card face.
- **Orientation Logic:** Cards have a randomized 50/50 chance of appearing **Upright** or **Reversed**, directly impacting the visual orientation and the corresponding interpretation.

### C. Supported Spreads

- **Daily Guidance (1 Card):** A quick single-card draw designed for a morning routine or a snapshot of the day's energetic theme.
- **The Crossroads (3 Cards):** A classic layout representing **Past, Present, and Future** or **Situation, Obstacle, and Advice**.
- **The Decision Maker (2 Cards):** A comparative layout displaying **Path A** on the left and **Path B** on the right to help users weigh choices.

### D. Card Interpretations & Contextual Insights

- **Rider-Waite-Smith Visuals:** The platform exclusively uses the iconic, universally recognized 1910 Rider-Waite-Smith tarot artwork.
- **Layered Meanings:** Clicking a revealed card opens a refined side panel or modal detailing:
- Core keywords (e.g., _New beginnings, innocence, spontaneity_ for The Fool).
- A beautifully written, deep narrative interpretation tailored to whether the card is upright or reversed.
- Specific advice based on the card’s position in the chosen spread.

### E. The Private Tarot Journal

- **On-Screen Reflection:** Directly beneath their active reading, users are provided with an elegant text journal box to type out personal reflections, feelings, or real-world connections.
- **The "Save to Journal" Action:** Saving a reading logs the date, the specific spread used, the exact cards pulled (including their orientation), and the user's written notes into their local device history.
- **The Dashboard Archive:** A dedicated history tab allows users to browse their past readings in reverse-chronological order. Users can revisit their growth over time or delete specific entries to clear space.

### F. Exporting & Sharing

- **Downloadable Summaries:** Because readings are stored locally and cannot be shared via web links, a "Download Reading" feature allows users to export their entire spread layout and text interpretation as a beautifully formatted PDF or image to save permanently or text to a friend.

---

## 4. Non-Functional & Design Requirements

- **Mobile-First Responsiveness:** The complex layouts of card spreads must scale elegantly down to smartphone screens, ensuring cards are easily tappable and text remains completely legible.
- **Fluid Motion Design:** Shuffling, fanning, and flipping animations must feel organic, lightweight, and smooth, ensuring they enhance the meditative experience rather than causing visual clutter or lagging.
- **Data Persistence:** If a user closes their browser window and returns a week later, their journal history and past readings must remain intact on that device until they explicitly choose to clear their browser data.
