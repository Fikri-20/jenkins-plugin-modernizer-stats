# Jenkins Plugin Modernizer Stats - POC

A proof-of-concept dashboard for visualizing Jenkins plugin modernization statistics.

## Features

- **Real-time data**: Fetches live data from `jenkins-infra/metadata-plugin-modernizer`
- **Ecosystem metrics**: Total plugins, migrations, success rates
- **Plugin overview**: Status badges, migration counts, PR tracking
- **Migration breakdown**: Visual breakdown by migration type

## Tech Stack

- **React 18** + TypeScript
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **GitHub API** for data fetching

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Header.tsx        # Navigation header
│   ├── Hero.tsx          # Hero section with key metrics
│   ├── MetricCard.tsx    # Reusable metric card component
│   ├── PluginTable.tsx   # Plugin list table
│   └── MigrationBreakdown.tsx  # Migration type breakdown
├── utils/
│   └── data.ts           # Data fetching and aggregation
├── types.ts              # TypeScript interfaces
├── App.tsx               # Main application
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## Data Source

This dashboard consumes metadata from:
- Repository: `jenkins-infra/metadata-plugin-modernizer`
- Format: JSON files in `<plugin>/modernization-metadata/`

## GSoC 2026

This POC demonstrates feasibility for the Jenkins GSoC 2026 project:
**Plugin Modernizer Stats Visualization**

### What This Proves

1. **Data fetching works**: Successfully connects to GitHub API
2. **Type safety**: Full TypeScript coverage for metadata schema
3. **Component architecture**: Reusable, production-ready components
4. **Responsive design**: Mobile-friendly layouts
5. **Performance**: Fast builds with Vite, minimal bundle size

### Next Steps for Full Implementation

- [ ] Add ECharts for data visualization
- [ ] Implement plugin detail pages
- [ ] Add filtering and search
- [ ] Implement data export (CSV/JSON)
- [ ] Add scheduled CI builds
- [ ] Deploy to stats.jenkins.io

## Author

**Ahmed Fikri** - GSoC 2026 Applicant

- GitHub: [@Fikri-20](https://github.com/Fikri-20)
- LinkedIn: [ahmed-fikri](https://linkedin.com/in/ahmed-fikri)