# Jenkins Plugin Modernizer Stats — POC

A proof-of-concept dashboard for the GSoC 2026 project **Plugin Modernizer Stats Visualization**.

**Live demo:** https://fikri-20.github.io/jenkins-plugin-modernizer-stats/

## What it shows

Real data from [jenkins-infra/metadata-plugin-modernizer](https://github.com/jenkins-infra/metadata-plugin-modernizer) — 429 plugins, 1244 migrations, 18 recipes.

- **Dashboard** — ecosystem summary cards, migration status donut, failures-by-recipe bar chart, plugin health distribution, critical plugins list
- **Plugin List** — searchable, sortable, filterable table of all 429 plugins with status badges, tags, and success rate bars
- **Plugin Detail** — per-plugin migration timeline with PR links, diff stats, tags, and collapsible CI check-run results

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Apache ECharts · React Router v6

## Run locally

```bash
npm install

# Fetch real data from metadata repo
GITHUB_TOKEN=your_token node scripts/ingest.mjs

# Or fetch a subset for quick dev iteration
GITHUB_TOKEN=your_token node scripts/ingest.mjs --limit 50

# Start dev server
npm run dev
```

## How data is fetched

`scripts/ingest.mjs` uses the GitHub Trees API (1 request) to list all plugin directories, then fetches each plugin's `reports/aggregated_migrations.json` via `raw.githubusercontent.com` (no rate limit). Output goes to `public/data/` as pre-aggregated JSON the React app reads at build time.

CI runs the full ingest daily at 06:00 UTC and redeploys to GitHub Pages automatically.

## Author

**Ahmed Fikri** — GSoC 2026 Applicant
- GitHub: [@Fikri-20](https://github.com/Fikri-20)
- LinkedIn: [ahmed-fikri](https://linkedin.com/in/ahmed-fikri)
