# Benefit Illustration App (MERN)

This repo contains:
- `server/`: Node.js (Express) API with JWT authentication and a benefit illustration projection engine.
- `client/`: Vite + React UI with Register/Login and an Illustration generator (JWT-gated).

## Prerequisites
- Node.js installed
- MongoDB running (local/Docker/Atlas)

## Server (API)

### Configure environment
Create `server/.env` (copy from `server/.env.example`):

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/benefit_illustration
JWT_SECRET=replace_with_a_long_random_secret
```

### Install + run
```powershell
cd server
npm install
npm run dev
```

Health check: `GET /health`

### Authentication (JWT)
- `POST /api/auth/register`
  - Body: `{ email, password, mobile?, dob? }`
  - Mobile/DOB are stored **masked** in DB (see `server/src/models/User.js`).
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ token, user }`

Use `Authorization: Bearer <token>` for protected endpoints.

### Benefit Illustration API
Protected endpoint:
- `POST /api/illustration/project`

Body:
```json
{
  "dob": "1995-01-01",
  "gender": "M",
  "sumAssured": 5000000,
  "premium": 10000,
  "frequency": "Yearly",
  "pt": 18,
  "ppt": 10,
  "bonusRatesByYear": [0.01, 0.01, 0.012, "..."]
}
```

Validations (strict):
- **PPT** must be **5–10**, **PT** must be **10–20**
- **Premium** must be **10,000–50,000**
- **PT > PPT**
- **SA >= max(10 * Premium, 5,000,000)**
- **Age** uses **completed birthday** logic and must be **23–56**

Calculation rules:
- Bonus Amount (per year) = `SA * bonusRate[year]`
- Total Benefit is paid **only in final year (Year = PT)** as `SA + cumulativeBonuses`
- Net Cashflow = `benefit - premiumPaid`
- PV column uses constant IRR = **8.4%**

Implementation: `server/src/routes/illustration.routes.js` (controller + calculation utility combined).

## Client (React)

### Configure environment
Create `client/.env` (copy from `client/.env.example`):

```env
VITE_API_BASE_URL=http://localhost:4000
```

### Install + run
```powershell
cd client
npm install
npm run dev
```

### UI flow
- Register/Login page stores JWT in `localStorage` (`bi_token`).
- Illustration generation is **disabled** until a user is logged in.

Files:
- Auth UI: `client/src/components/AuthPage.tsx`
- Input + table: `client/src/components/PolicyInputForm.tsx`, `client/src/components/IllustrationTable.tsx`
- API base URL helper: `client/src/lib/api.ts`

## Updating bonus rates
The API expects `bonusRatesByYear` (length >= PT). In the UI, update the constant rate-card in:
- `client/src/components/PolicyInputForm.tsx`

## Scaling strategy (high level)
For 1,000,000+ records:
- Use API as **producer** to enqueue jobs into **Redis/BullMQ** (store pointers, not payloads).
- Use horizontally scaled **workers** as **consumers**.
- For CPU-bound projections, use **Node Worker Threads** within workers.
- Stream inputs (DB cursors), write outputs in bulk, and paginate results for clients.

## UI Screenshots
<img width="1683" height="743" alt="Screenshot 2026-04-21 001729" src="https://github.com/user-attachments/assets/9a89867b-9b8b-4998-8d60-4b0c40da2121" />

<img width="1683" height="743" alt="Screenshot 2026-04-21 001729" src="https://github.com/user-attachments/assets/5651a3f8-452c-4a88-bee7-516d1d61a0c2" />

<img width="1667" height="858" alt="Screenshot 2026-04-21 001834" src="https://github.com/user-attachments/assets/9822af02-4ea3-4e44-97b9-7026741fb46c" />

<img width="1672" height="803" alt="Screenshot 2026-04-21 001856" src="https://github.com/user-attachments/assets/49313f51-2256-4991-be78-846b41d4816a" />


