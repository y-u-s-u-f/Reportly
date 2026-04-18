# Reportly

A mobile-first civic issue reporting platform aligned with **UN SDG 11 — Sustainable Cities and Communities**. Citizens report city problems via photo, voice, and text; AI auto-routes each report to the correct city department.

## Stack

- **Frontend** — React + Vite, Tailwind CSS v4, Leaflet, Lucide icons
- **Backend** — Node.js + Express, Prisma ORM (PostgreSQL)
- **AI** — OpenAI GPT-4o (classification) and Whisper (voice transcription)
- **Maps** — Leaflet + OpenStreetMap (Nominatim for reverse geocoding, Leaflet.heat for the heatmap layer)

## Project layout

```
server/    Express API + Prisma schema
client/    Vite + React mobile-first PWA-style web app
```

## Setup

### 1. PostgreSQL

Create a database and put the URL in `server/.env`:

```bash
cp server/.env.example server/.env
# edit DATABASE_URL and OPENAI_API_KEY
```

### 2. Backend

```bash
cd server
npm install
npx prisma generate
npx prisma db push    # or: npx prisma migrate dev --name init
npm run dev           # API on http://localhost:3000
```

### 3. Frontend

```bash
cd client
npm install
npm run dev           # http://localhost:5173 (proxies /api -> :3000)
```

> Without `OPENAI_API_KEY`, classification falls back to a keyword heuristic and transcription returns a placeholder string — so the rest of the app still works for demo.

## API

| Method | Endpoint                 | Purpose                                          |
| ------ | ------------------------ | ------------------------------------------------ |
| POST   | `/api/reports`           | Submit a new report (multipart, photos[]: max 3) |
| GET    | `/api/reports`           | List all reports                                 |
| GET    | `/api/reports/nearby`    | `?lat=&lon=&issueType=` for duplicate check      |
| PATCH  | `/api/reports/:id/status`| Body `{status}` — or omit to cycle to next       |
| POST   | `/api/transcribe`        | multipart `audio` -> Whisper                     |
| POST   | `/api/classify`          | `{description, image?}` -> GPT-4o classification |

## Implemented features

1. **Camera photo capture** with `capture="environment"` and previews
2. **Voice dictation** via MediaRecorder → Whisper, auto-fills description
3. **Auto GPS** capture + Nominatim reverse geocode + inline Leaflet preview
4. **Auto-routing** to one of 7 departments via GPT-4o
5. **Text fallback** — always-editable textarea
6. **Up to 3 photo attachments** with thumbnails + remove buttons
7. **AI classification confirmation card** with color-coded severity badge
11. **Duplicate detection** within 100 m using Haversine — increments `affectedCount`
13. **Real-time status tracking** (received → assigned → in_progress → resolved) with animated step bar
14. **Browser push notifications** triggered by status changes
16. **History log** with thumbnails, badges, status bar, relative timestamps
17. **Public map view** of open reports with severity-colored pins, popups, legend
19. **Affected count** displayed on map popup and dashboard cards
26. **Heatmap toggle** using Leaflet.heat (loaded from CDN)
33. **Offline mode** — queues failed submissions in `localStorage`, auto-retries on reconnect

## Notes

- All OpenAI API calls happen server-side; the API key never reaches the browser.
- `prefers-reduced-motion` is respected globally.
- Touch targets are at least 44×44 px; primary breakpoint is 375 px.
- For the offline retry to work in dev, kill the server and submit a report — it'll queue. Bring the server back up and the queue flushes automatically.

## Deploy — split: Vercel (client) + Render (server)

### 1. Push to GitHub

```bash
git add -A
git commit -m "Prep for split deploy"
git push origin main   # create the GitHub repo first if you haven't
```

### 2. Deploy the API on Render (uses [render.yaml](render.yaml))

1. Sign in at https://render.com, then **New → Blueprint**.
2. Pick this repo. Render reads `render.yaml` and provisions:
   - A free Postgres database (`reportly-db`)
   - A free web service (`reportly-api`) wired to that DB
3. When prompted, fill the two `sync: false` env vars:
   - `ADMIN_PASSWORD` → e.g. `system123`
   - `OPENAI_API_KEY` → your key
4. First build runs `prisma db push` automatically.
5. Note the resulting URL, e.g. `https://reportly-api.onrender.com`.

> **Free-tier caveats**: the web service sleeps after 15 min idle (~30 s cold start), and uploaded photos live only on the running instance — they vanish on restart. To keep photos, upgrade to a paid plan and add a `disk:` block to [render.yaml](render.yaml) mounted at `server/uploads`.

### 3. Deploy the client on Vercel (uses [client/vercel.json](client/vercel.json))

1. Sign in at https://vercel.com → **Add New → Project** → import this repo.
2. Set **Root Directory** to `client`.
3. Framework auto-detects as Vite. Build command and output dir come from `vercel.json`.
4. Add an env var:
   - `VITE_API_URL` → your Render URL from step 2 (e.g. `https://reportly-api.onrender.com`).
5. Deploy.

### 4. Lock CORS (optional but recommended)

CORS currently allows all origins. To restrict to your Vercel URL only, edit [server/src/index.js](server/src/index.js):

```js
app.use(cors({ origin: process.env.FRONTEND_URL || true }));
```

…then add `FRONTEND_URL=https://your-vercel-app.vercel.app` to the Render env.
