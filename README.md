# BASK Reality

Real estate website (buy, rent, lease, sell, mortgage) with a live admin panel.
Frontend: React, Vite, React Router, Framer Motion. Backend: Node.js with no extra frameworks.

## Run

```
npm install
npm run dev      # API on :5174 + website on http://localhost:5173
npm run build    # production build of the website in dist/
```

## Live data

- Listings, agents, inquiries, users and settings are stored by the API in `server/data/db.json`.
- Every change is pushed to all open browsers instantly over Server-Sent Events (`/api/events`).
- Mortgage rates: Freddie Mac weekly survey via FRED (`server/rates.js`), refreshed every Thursday.
- Currency exchange rates: ExchangeRate-API open access (`src/utils/rates.js`), refreshed daily.
- Maps: Google Maps embed for each listing's address.

## Structure

- `server/`: API (`index.js`), JSON database (`db.js`), mortgage rates, image-link reader
- `src/pages`: public pages (home, buy, rent, lease, listing detail, sell, mortgage, agents, guides, about, contact, saved, auth, legal)
- `src/pages/admin`: admin panel (dashboard, listings, agents, inquiries, users, settings)
- `src/components`: layouts and shared UI (3D tilt card, reveal, page transition, image manager, amenity picker, map)
- `src/context/StoreContext.jsx`: loads data from the API and listens for live updates
- `src/styles/global.css`: design tokens and responsive styles

## Admin

Sign in at `/login`. The default admin is `admin@baskreality.com` / `admin123`.
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables to change them before going live.
