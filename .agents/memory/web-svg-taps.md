---
name: Web SVG taps under gesture-handler
description: Why SVG region taps on react-native-web must go through an RNGH Tap gesture + elementFromPoint instead of onPress/onClick
---

On web, react-native-gesture-handler calls setPointerCapture on the GestureDetector's view, so DOM clicks never reach child SVG paths. react-native-svg's web onPress also leaks RN responder props onto the DOM (console warnings).

**Rule:** on web, detect taps with a Gesture.Tap raced against pinch/pan, then resolve the region with document.elementFromPoint on DOM ids set on the paths. On native, keep Path onPress plus the post-pan tap guard.

**Why:** the first build used onPress and later onClick; neither filled anything in the browser test.
**How to apply:** any new tappable SVG inside a GestureDetector (paint-by-number, brush mode, etc.) must follow the same pattern.
