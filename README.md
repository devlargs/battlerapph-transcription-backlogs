# battlerapph-transcription-backlogs

A small SvelteKit + TypeScript app that renders a table of BattleRap PH collections and how many
records are completed vs. incomplete, snapshotted over time by a GitHub Actions workflow.

## Data

`scripts/fetch-stats.mjs` fetches `https://api.battlerapph.com/api/stats/all` and appends:

```json
{ "fetched": "MM/DD/YYYY hh:mm", "data": { "em": { "c": 1, "i": 439 }, "...": {} } }
```

to the newest chunk in `data/json/`. Each chunk holds at most **100** snapshots; when `0001.json`
fills up the script creates `0002.json`, and so on. `data/json/manifest.json` records each chunk and
its entry count so the app can jump straight to the chunk holding the snapshot being viewed —
only that one file is downloaded, not the whole history.

Timestamps are in **Asia/Manila** (`TIME_ZONE` in the script).

Collection keys: `em` Emcees · `lg` Leagues · `lc` Locations · `ev` Events · `bt` Battles · `vr` Verses.

## Automation

`.github/workflows/fetch-stats.yml` runs hourly (`0 * * * *`) while the cadence is being observed —
the intended steady state is every 12 hours (`0 */12 * * *`, 08:00 and 20:00 Asia/Manila) — and on
manual dispatch,
then commits any change under `data/json/`. It needs **Settings → Actions → General → Workflow
permissions → Read and write permissions** enabled on the repo.

Scheduled runs only fire from the default branch, and GitHub delays or drops them under load — use
the **Run workflow** button on the Actions tab to confirm it works immediately.

## Commands

```bash
npm install
npm run dev          # dev server
npm run fetch:stats  # append a snapshot locally
npm run build        # static build into build/
npm run check        # svelte-check
```

The app is a static build (`@sveltejs/adapter-static`). Snapshots are bundled at build time, so a
new commit of data needs a rebuild/redeploy to appear on a deployed site. For a GitHub Pages project
site, build with `BASE_PATH=/battlerapph-transcription-backlogs`.
