# Weather log

A full-stack weather app. Search any place for live weather and a 5-day forecast, then save a place with a date range to a shared SQLite database. Each saved record gets a map, YouTube videos, and exports in five formats.

I completed **both** assessments from the PM Accelerator AI Engineer Intern brief:

- **Tech Assessment 1 (frontend):** live weather, current location, 5-day forecast, icons, error handling, responsive layout.
- **Tech Assessment 2 (backend):** SQLite persistence with full CRUD, input validation, Google Maps and YouTube integrations, data export.


## About PM Accelerator

The Product Manager Accelerator Program is designed to support PM professionals through every stage of their careers. From students looking for entry-level jobs to Directors looking to take on a leadership role, our program has helped over hundreds of students fulfill their career aspirations.

Our Product Manager Accelerator community are ambitious and committed. Through our program they have learnt, honed and developed new PM and leadership skills, giving them a strong foundation for their future endeavors.

The same text shows in the app. Click "About PM Accelerator" in the footer.

## Features

**Live weather (Assessment 1)**
- Search by city, ZIP or postal code, landmark, address, or `lat,lon`. Typos still match (`Pari` finds Paris).
- "Use my location" reads the browser's geolocation.
- Current weather: temperature, feels-like, humidity, wind, condition, plus today's rain chance, UV index, and sunrise and sunset.
- 5-day forecast with daily low and high, condition icon, and rain chance. A bar shows each day's range against the week.
- SVG icons for ten conditions (clear, partly cloudy, cloudy, fog, drizzle, rain, snow, thunder, day and night).
- Readable errors for an unknown place, denied geolocation, and an unreachable API or server.

**Saved lookups (Assessment 2)**
- **Create:** location, start date, end date, and optional notes. The server stores the resolved place, coordinates, and daily weather for the range.
- **Read:** one shared list. Everyone sees every record. Select a record for its daily table, map, and videos.
- **Update:** change the location, dates, or notes. The server re-validates and fetches new weather when the location or dates change.
- **Delete:** with a confirm step.
- **Validation:** dates must be real, start must not be after end, the range is at most 31 days, it starts no earlier than 1940, and it ends no more than 16 days ahead. The location must resolve to a real place. Errors show next to the form.
- **Past, future, or both:** past dates come from the Open-Meteo archive API. Recent and future dates come from the forecast API. A range that crosses today is split and merged.

**Integrations**
- **Google Maps:** an embedded map and an "Open in Google Maps" link. It needs no key.
- **YouTube:** up to 4 videos per place from the YouTube Data API v3. Results are cached in memory to save the daily quota. With no key, or when the quota runs out, the app shows a "Search on YouTube" link.

**Export**
- JSON, CSV, XML, Markdown, and PDF.
- Export all records, or one record.
- CSV has one row per day. Cells are escaped, and text that starts with `=`, `+`, `-`, or `@` gets a leading quote so spreadsheets do not run it as a formula.

## Responsive design techniques

All in `client/src/`. Tailwind CSS v4.

- **Mobile-first breakpoints.** Base styles are for phones. `sm:` (640px) and `lg:` (1024px) add layout as the screen grows. `max-sm:` is used once, to reorder the forecast rows on phones (`LiveWeather.jsx`).
- **CSS Grid for page layout.**
  - Current weather and forecast sit side by side from `lg:` and stack below it (`grid lg:grid-cols-[5fr_7fr]`).
  - The saved-lookups section is a fixed 22rem form column plus a flexible detail column from `lg:`, and one column below it (`Saved.jsx`).
  - The forecast row is a named-track grid. It has 3 columns on phones and 4 from `sm:` (`LiveWeather.jsx`).
  - The facts block is 2 columns on phones and 3 from `sm:`.
  - The date fields are 1 column on phones and 2 from `sm:` (`QueryForm.jsx`).
- **Flexbox for rows and wrapping.** The search form is a column on phones and a row from `sm:`. Export buttons use `flex-wrap`. The footer stacks on phones and spreads out from `sm:`.
- **Fluid containers.** The page uses `max-w-6xl` with `w-full` and responsive padding (`px-4 sm:px-6`). The About dialog is `w-[min(92vw,34rem)]`. The page height uses `min-h-dvh` so mobile browser toolbars do not break the footer.
- **Wide tables scroll, not squash.** The daily weather table sits in `overflow-x-auto` with a `min-w` (`QueryDetail.jsx`).
- **No wrapping of short values.** `whitespace-nowrap` keeps values such as `06:33–16:46` on one line.
- **Touch-friendly targets.** Buttons and inputs are at least 44px tall (`min-h-11`). Small buttons drop to 36px only from `sm:`, where a mouse is likely. List rows are at least 56px tall. Inputs use 16px text, which stops iOS from zooming on focus.
- **Viewport meta tag** and `scroll-into-view` on phones: selecting a saved record scrolls to its detail panel, which sits below the list on narrow screens.

## Tech stack

| Part | Choice |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 (plain JavaScript) |
| Backend | Node.js, Express 5 |
| Database | SQLite through the built-in `node:sqlite` module. No native build step. |
| PDF export | PDFKit |
| Weather and places | Open-Meteo (forecast, archive, geocoding), OpenStreetMap Nominatim |
| Map | Google Maps embed |
| Videos | YouTube Data API v3 |

Node.js **22.13 or newer** is required for `node:sqlite` without flags. Built and tested on Node 26.

## Repository structure

```
.
├── package.json          backend dependencies and root scripts
├── .env.example
├── server/
│   ├── index.js          Express app, error handler
│   ├── db.js             SQLite connection and schema
│   ├── validate.js       date and text validation, HttpError
│   ├── routes/           weather.js, queries.js, extras.js, export.js
│   └── services/         weather.js (geocoding, forecast, ranges), extras.js, export.js
└── client/
    ├── package.json      frontend dependencies
    ├── vite.config.js    dev proxy: /api -> localhost:3001
    └── src/              React components
```

**Dependency manifests:** `package.json` (backend) and `client/package.json` (frontend). `npm install` at the root installs both, because the root `postinstall` script runs `npm install --prefix client`.

## Setup and run

You need Node.js 22.13 or newer.

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. The API runs on port 3001, and Vite proxies `/api` to it.

To get video results, add a free YouTube Data API v3 key to `.env` (steps are in `.env.example`). Everything else works without any key.

| Command | What it does |
|---|---|
| `npm run dev` | Starts the API and the Vite dev server together |
| `npm run build` | Builds the frontend into `client/dist/` |
| `npm start` | Starts the API only |

The database file is created at `server/data/weather.db` on first run. Delete it to reset the data.

## API

All responses are JSON unless noted. Errors look like `{ "error": "message" }`.

| Method and path | Purpose | Success |
|---|---|---|
| `GET /api/weather?q=<place>` or `?lat=&lon=` | Current weather and 5-day forecast | 200 |
| `GET /api/queries` | List all saved lookups | 200 |
| `POST /api/queries` | Create. Body: `location`, `start_date`, `end_date`, optional `notes` | 201 |
| `GET /api/queries/:id` | Read one lookup | 200 |
| `PUT /api/queries/:id` | Update any of `location`, `start_date`, `end_date`, `notes` | 200 |
| `DELETE /api/queries/:id` | Delete one lookup | 204 |
| `GET /api/queries/:id/extras` | Map data and YouTube videos for a saved lookup | 200 |
| `GET /api/extras?q=<place>` or `?lat=&lon=` | Map data and YouTube videos for any place | 200 |
| `GET /api/export?format=json\|csv\|xml\|md\|pdf` | Download all lookups. Add `&id=<id>` for one. | 200, file download |

Error codes: `400` for invalid input, `404` for an unknown place or id, `502` when Open-Meteo or Nominatim fails.

Dates use `YYYY-MM-DD`.

## Data sources and limits

- Open-Meteo is free and needs no key. Nominatim allows 1 request per second, so the server spaces its calls.
- The YouTube Data API gives 10,000 quota units a day. One search costs 100 units. The in-memory cache keeps repeat lookups free until the server restarts.
- The map embed URL (`maps.google.com/maps?q=...&output=embed`) is not an official API. Google could change it.
