# Hydro Lens — Frontend

React + Vite + TypeScript + Tailwind CSS web dashboard for **Hydro Lens**, a portable optical microplastics screening system.

## Features

- **Analyze** — upload a microscope image (or pick a demo reference) and view the full screening results: annotated detections, size distribution chart, particle table, concentration estimate, and JSON report.
- **Calibration** — run the FFT stage-micrometer wizard or set the µm/pixel factor manually, then validate against reference polymer beads and activate the calibration record.
- **Diagnostics** — model card, class breakdown, system limitations, and lab-flag notes.
- **Authentication** — in-app login gate (client-side demo).

## Development

```bash
npm install
npm run dev        # starts Vite on http://localhost:5173 (proxies /api to :8000)
```

The dev server proxies `/api/*` to the FastAPI backend on `http://localhost:8000`.

## Production build

```bash
npm run build       # outputs to dist/ (served by api/main.py in the repo root)
npm run lint        # oxlint
```

## Structure

```
frontend/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx / App.tsx
│   ├── api/            # typed API client for the FastAPI backend
│   ├── components/     # Layout, charts, dropzone, cards, stepper, intro animation
│   ├── context/        # AuthProvider
│   ├── hooks/          # useAnalysis, useCalibration, useAuth
│   └── pages/          # Analyze, Calibration, Diagnostics, Login
└── public/             # favicon, icons, logo
```