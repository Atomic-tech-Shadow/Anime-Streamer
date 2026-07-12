---
name: Imported project — artifact registered in .replit but its workflow was never created
description: An artifact listed under [[artifacts]] in .replit can still have zero running workflow, causing the whole app to silently fail instead of an obvious crash.
---

On a freshly imported pnpm-workspace multi-artifact project, `.replit`'s `[[artifacts]]` section listed
`api-server` and `mockup-sandbox` as registered artifacts, but `[workflows]` only defined a workflow for
the frontend (`atomic-flix`, an Expo app). `listWorkflows()` showed just one workflow; `WorkflowsRestart`
on the expected managed name (`artifacts/api-server: API Server`) failed with "doesn't exist".

**Symptom:** the user reported one specific feature (a manga/scan reader) as "full of bugs". In reality
the entire app's data layer was down — every screen that depended on the API-server proxy failed silently
(fetches errored or hung), and the bug report was just describing whichever screen the user happened to
poke at. The frontend itself (Expo/Metro) was running fine, which made it look like only that feature was
broken.

**How to apply:** When investigating a vague "lots of bugs" complaint in a multi-artifact project, first
run `listWorkflows()` and compare against every artifact's `.replit-artifact/artifact.toml` service(s) and
against `.replit`'s `[[artifacts]]` list. If a declared artifact/service has no corresponding running
workflow, that's very likely the real root cause, not the specific feature the user mentioned.

**Fix applied:** added a workflow via `verifyAndReplaceDotReplit` (temp-file diff, not a direct edit) that
runs `PORT=8080 pnpm --filter @workspace/api-server run dev`, added as an `API Server` workflow and wired
into the `Project` parallel workflow alongside the existing frontend task. Restarted it and confirmed the
proxy endpoints (`/api/anime-proxy/...`) return real data end-to-end.

**Note:** `mockup-sandbox` was left unregistered/unstarted since it's a design-canvas tool, not part of
the user-facing mobile app, and wasn't needed for this fix — flag it if canvas mockups are needed later.
