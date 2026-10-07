# UnzaConnectme (MERN)

Students search and map campus venues. Admins manage venues, map pins, campuses and venue types,
and see what students are searching for.

## Run it

Needs Node 18+ and MongoDB (local, or a free Atlas cluster).

```bash
# 1. API
cd server
cp .env.example .env     # then edit: JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI
npm install
npm run seed             # creates your admin + sample data (sample data only if DB is empty)
npm run dev              # http://localhost:5001

# 2. Web app (new terminal)
cd client
npm install
npm run dev              # http://localhost:5173
```

- Students: http://localhost:5173
- Admin: http://localhost:5173/admin (sign in with ADMIN_EMAIL / ADMIN_PASSWORD)

`npm run seed -- --reset` wipes venues, campuses and types and reloads the samples.
The sample venues and campus map centres are placeholders: fix them in the admin panel.

## What the admin panel does

- **Dashboard**: live / pending / hidden counts, venues with no map pin, venue opens,
  searches in the last 30 days, top searches, searches that found nothing, most opened venues,
  venues by type and campus.
- **Venues**: add, edit, delete, hide/show, approve student suggestions. Drop the map pin by
  clicking the map instead of typing coordinates.
- **Settings**: add or rename campuses (with map centre) and manage venue types.

## How suggestions work

Students can suggest a venue from the public site and place its pin on a map (or use their phone's
location). It is saved as "Needs review" and stays invisible until an admin checks the details and the
pin, then approves it.

## Map labels

Each venue can have a short code (e.g. CL2) that shows on its map pin. If you leave it blank, one is
generated from the name ("Computer Lab 2" becomes CL2). Tap a pin to see the full name.

## Before going live

- Use a long random `JWT_SECRET` and a strong admin password. The server refuses to start otherwise.
- Serve over HTTPS and restrict CORS to your site's domain (see `server/server.js`).
- Rate limiting is in memory, per server. Move it to a shared store if you run several instances.
- Map tiles come from the public OpenStreetMap server, which is fine for a small app. For heavy
  traffic, use a tile provider.
- The crest is the University's mark. Get approval from UNZA before publishing this as an official app.
