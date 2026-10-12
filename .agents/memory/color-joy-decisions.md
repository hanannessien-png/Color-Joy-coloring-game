---
name: Color Joy product decisions
description: User-confirmed scope and settings for the Color Joy coloring game (Expo app) agreed before the build
---

Decisions confirmed by the user on 2026-10-12, before milestone 1:

- Platform: Android only (do not plan iOS work).
- Package id: com.colorjoy.app (user said they don't care, agent picked it).
- Ads/kids: neutral age gate on first launch. Under 13 → child-directed treatment, G rating, no personalized ads; adults → normal UMP consent.
- Free brush: always free over the whole image (not clipped to regions).
- No "remove ads" in-app purchase.
- About 20% of images locked; unlock with coins OR a rewarded ad.
- Background music (calm, with toggle) in addition to sound effects.
- Short first-run tutorial (3-4 screens).
- Ad frequency: app open max once / 4 min and not on the very first launch; interstitial every 3 completed images with 2 min minimum gap; rewarded max 10/day. Keep all in one config file.
- User tests ONLY in the web preview (not Expo Go). Everything must work on react-native-web; AdMob must be stubbed/no-op on web and in Expo Go.
- Workflow: build in the 6 milestones from the original request and stop for the user to test after each one.

Added by the user after milestone 1 (2026-10-12):
- It must feel like a COMPLETE GAME, not a gallery: title/start screen first, then a levels map, progression ("انت مش باني لعبه كامله"). User was annoyed it looked like a plain gallery.
- Show a reference picture with the correct target colors the player should use.
- Competitor features wanted (all 4): paint-by-number helpers (highlight same-number regions, hint, drag-to-fill), timelapse replay of the finished picture, coin boosters (bomb + magic wand), frames/stickers before sharing + crayon/watercolor texture fills.
- Agent's design: levels = paint-by-number (wrong color doesn't fill, counts a mistake; stars from mistakes/hints; coins per star); gallery = free coloring with any color. Level fills are stored separately from free-mode fills.

**Why:** the user asked to settle all questions before building.
**How to apply:** follow these without re-asking; change only if the user says so.

## Game structure (user demanded a "complete game", 2026-10-12)
- Flow: title screen → levels map → paint-by-number level; Free Coloring gallery is a secondary mode.
- Level fills are stored separately from free-coloring fills for the same picture, so finishing a level never touches the free version.
- Wrong color in a level never fills; it counts a mistake. Stars: 0 mistakes=3, ≤3=2, else 1 (hints count double). Coins = 10/star, replay pays only the improvement.
- The reference ("how it should look") picture must always be reachable — user explicitly asked for it.
  **Why:** the user said the earlier build "isn't a complete game" and wanted to see the target colors.

## AdMob (user supplied their real IDs, 2026-10-12)
- The real unit IDs are used only in release builds; dev builds always use Google TestIds. All caps live in one ads config file.
- Caps: app-open at most every 4 min and never during the first-ever session; interstitial every 3 finished pictures with at least 2 min between them, shown only when leaving the completion card; rewarded max 10/day ("x2 coins" on the level card); banners only on the levels map and gallery, never in the editor.
- The SDK is required lazily: none on web, none in Expo Go. Preview rewarded grants the reward directly so the flow can be tested.
- The neutral age gate is a full-screen overlay. Ages 13 and under (year-based, conservative) get child-directed, under-age-of-consent, G-rated, non-personalized ads with no UMP. Adults get UMP gatherConsent, then PG.
- Storage, SYSTEM_ALERT_WINDOW and other unused permissions are blocked in app.json (Families policy).
  **Why:** a kids-oriented app on Google Play Families; the user tests only in the web preview.
