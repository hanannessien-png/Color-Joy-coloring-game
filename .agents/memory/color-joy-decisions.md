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

**Why:** the user asked to settle all questions before building.
**How to apply:** follow these without re-asking; change only if the user says so.
