# Settings Page Redesign

## Summary

The `/settings` page was redesigned from a tabbed interface into a single-page,
card-based dashboard — similar to how Android's Settings app presents a home
screen of categories that you tap into. All 6 existing settings sections keep
their exact original functionality; only the page's layout/navigation shell
changed.

## Before

A left-hand nav of 6 plain text tabs (Account, Profile Visibility, Job
Preferences, Notifications, Security, Data & Privacy). Only the active tab's
section was mounted at a time; switching tabs swapped which component
rendered. No deep-linking, no overview of what each section contained.

## After

- A header ("Settings" + description) followed by an **overview grid** of 6
  clickable cards — one per section — each showing a colored icon badge,
  title, one-line description, and a short list of the settings/features
  inside it.
- **All 6 sections are always rendered** below the grid, in the same order as
  before, each in its own untouched `SectionCard`.
- Clicking an overview card **smooth-scrolls** to that section and applies a
  temporary highlight ring (~1.8s) so the user can immediately see what they
  clicked into.
- **Deep-linking**: `/settings#security` (etc.) lands on and highlights that
  section automatically. Uses `history.replaceState` only (never
  `pushState`), so it doesn't clutter browser back-history.
- A **"↑ Back to Settings overview"** link after the last section scrolls
  back to the top of the grid.
- Responsive: 1 column on mobile, 2 on tablet, 3 on desktop.

## What changed vs. what didn't

**Rewritten**: `src/app/(app)/settings/SettingsPageClient.jsx` only.

**Untouched — zero functional regression risk**:
- All 6 section components (`AccountSection.jsx`, `VisibilitySection.jsx`,
  `JobPreferencesSection.jsx`, `NotificationsSection.jsx`,
  `SecuritySection.jsx`, `DataPrivacySection.jsx`) — every toggle, form,
  avatar upload, sign-out action, and export/delete-account flow keeps its
  original API calls and behavior.
- Both hooks (`useSettingsForm.js`, `useInstantPreferences.js`).
- The shared `SectionCard` component.
- `src/app/(app)/settings/page.js` and all `/api/settings/*` routes.

## Verification performed

- `npm run lint`, `npm run test` (271 passing), `npm run build` — all clean.
- Live-tested via an authenticated session:
  - Overview grid renders all 6 cards correctly.
  - Clicking a card scrolls to and highlights the right section (confirmed
    via direct DOM state inspection, not just visually).
  - Deep-link hash (`#privacy`, etc.) triggers the same highlight on a fresh
    page load.
  - "Back to overview" link works.
  - Existing functionality spot-checked untouched: toggled and reverted a
    Visibility switch, opened Account edit mode, confirmed Security sign-out
    buttons and the Data & Privacy delete-account dialog still open/close
    correctly.
  - Verified responsive layout via screenshots at mobile (390px), tablet
    (820px), and desktop (1400px) widths — no horizontal overflow, correct
    1/2/3-column reflow.
- No console errors introduced by this change (pre-existing OpenPanel
  analytics `401`s are unrelated and present on other pages too).
