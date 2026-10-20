# Backlog

Small, non-urgent tasks for this project. Harvest Season (`harvest-season`) does the `open` ones before Claude's weekly quota resets, each on its own `backlog/*` branch, never pushed — and waits for your approval to merge. Proposals (`proposed`) don't run until you say yes.

<!--
Format: one task per "##" section, one "- key: value" per line. Keys in English, values in any language.
status:     open · proposed · blocked · done · dropped
added:      YYYY-MM-DD
priority:   1 high · 2 normal · 3 low
complexity: low · medium · high   (picks the model — `models` in the settings; by default low→Sonnet, medium→Opus, high→Fable)
tokens:     rough estimate of total agent tokens incl. ~60k fixed overhead (low ≈ 100k, medium ≈ 200k, high ≈ 400k)
details:    what to do and what counts as done; name files/areas
result:     filled by the agent — date · branch · what changed (in the owner's language) · actual tokens
cleared:    set when the owner clears a done task from the widget's done list (date); the task stays here
-->

## בדיקות E2E לדפדפנים המובנים של פייסבוק/אינסטגרם
- status: open
- added: 2026-10-20
- priority: 2
- complexity: medium
- tokens: 200000
- details: להוסיף ל-qa/tests/e2e קובץ inapp.spec.js שמריץ את האתר (tools/serve.py דרך playwright.config.js) עם user-agent של Facebook in-app (FBAN/FBAV) ו-Instagram in-app (Instagram ...), viewport מובייל (iPhone + Android). לכל אחד: טעינת /, /קורס, /צור-קשר בלי שגיאות JS; באנר העוגיות מוצג ונסגר; תפריט ההמבורגר נפתח וניווט עובד; כפתור וואטסאפ מפנה ל-wa.me ו-tel: תקין; שליחת טופס צור-קשר מול endpoint מדומה (page.route על _functions/submitLead → {ok:true}) מציגה הודעת הצלחה; קישור #/ ישן מועבר. לחסום GA/Meta עם route.fulfill 204. אם נמצא באג — לתקן ב-_src/index.html / js/site.js / site-chrome.css ולהריץ python3 tools/build-pages.py. הושלם כש-cd qa && npx playwright test ירוק כולל הקובץ החדש ו-python3 tools/build-pages.py --check עובר.
- result:
