# Crystal Park API

Minimal two-week MVP backend for the Crystal Park interactive availability map.

## Stack
- Node.js
- Express
- Neon PostgreSQL
- JWT admin authentication
- bcrypt password hashing

## What it does
- Publicly returns the 56 Crystal Park units.
- Accepts unit-interest enquiries.
- Allows an authenticated admin to change a unit to:
  - `available`
  - `under_offer`
  - `sold`
- Allows an authenticated admin to view enquiries.

An enquiry **does not automatically reserve a unit**. Seeff/admin controls the official status.

## 1. Neon setup

Create a Neon project and copy its pooled PostgreSQL connection string.

In the Neon SQL Editor, run:

`sql/schema.sql`

## 2. Local setup

Copy:

`.env.example` → `.env`

Then fill in:
- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ALLOWED_ORIGINS`

Install:

```bash
npm install
```

Seed the 56 units and first admin:

```bash
npm run seed
```

Start:

```bash
npm run dev
```

Test:

`GET http://localhost:3000/api/health`

## Public API

### GET /api/units
Returns all units.

### GET /api/units/:unitNumber
Returns one unit.

### POST /api/enquiries

Example:

```json
{
  "unitNumber": 27,
  "name": "Example Buyer",
  "phone": "0820000000",
  "email": "buyer@example.com",
  "message": "Please contact me about this unit."
}
```

## Admin API

### POST /api/admin/login

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

Store the returned token in the admin session and send it as:

`Authorization: Bearer TOKEN`

### PATCH /api/admin/units/27

```json
{
  "status": "under_offer"
}
```

or:

```json
{
  "status": "available",
  "price": 1195000
}
```

### GET /api/admin/enquiries

Requires the Bearer token.

## Frontend connection

In the availability app, replace the localStorage inventory source with:

```js
const API_URL = "http://localhost:3000";

async function loadUnits() {
  const response = await fetch(`${API_URL}/api/units`);
  if (!response.ok) throw new Error("Could not load units");
  return response.json();
}
```

For production, change `API_URL` to the Render service URL.

## Render

Create a Render Web Service using this project.

Build command:

`npm install`

Start command:

`npm start`

Add the same environment variables from `.env` in Render's Environment settings.

Set `ALLOWED_ORIGINS` to your final Vercel domain, for example:

`https://your-crystal-park-site.vercel.app`

Never commit `.env`.
