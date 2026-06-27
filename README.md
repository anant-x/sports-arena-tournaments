# Sports Arena Tournaments

A Next.js tournament hosting app deployed on Vercel.

Live site:

https://cricket-tournament-snowy.vercel.app

## Features

- Multi-tournament catalog for cricket, badminton, tennis, football, and turf events
- Tournament detail pages with rules, fees, advance amount, prizes, fixtures, and slots
- TPL 2026 teams, fixtures, results, and points table
- Signup/login pages that save player details in browser local storage
- Postgres-backed signup/login, profile, registration, tournament catalog, and payment records
- Admin dashboard at `/admin` with record tables and CSV export
- Admin scorecard and points table update system
- Profile page with saved details and saved registrations
- Full registration forms for every tournament
- Razorpay and UPI payment options with verification records
- WhatsApp registration/support links, maps, trust sections, testimonials, and legal pages

## Data

All tournament data lives in:

```bash
data/tournament.json
```

To add a tournament, add an item to the `tournaments` array with a unique `slug`.

## Database

Production records use a managed Postgres database through `DATABASE_URL`.

Tables are created automatically by the Next.js API routes:

- `tournaments`
- `users`
- `registrations`
- `payments`

Set these Vercel environment variables:

```bash
npx vercel env add DATABASE_URL production
npx vercel env add ADMIN_PASSWORD production
npx vercel --prod
```

Open the admin dashboard:

```text
https://cricket-tournament-snowy.vercel.app/admin
```

Use the `ADMIN_PASSWORD` value to view records and export CSV files.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Deploy

```bash
npm run build
npx vercel --prod
```

## Razorpay

Real payments require Razorpay API keys in Vercel:

```bash
npx vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID production
npx vercel env add RAZORPAY_KEY_SECRET production
npx vercel --prod
```

Without those keys, the payment route runs in demo mode so the registration flow can still be tested.

## Contact, WhatsApp, and UPI

Set real public organizer details in Vercel:

```bash
npx vercel env add NEXT_PUBLIC_ORGANIZER_NAME production
npx vercel env add NEXT_PUBLIC_ORGANIZER_PHONE production
npx vercel env add NEXT_PUBLIC_ORGANIZER_EMAIL production
npx vercel env add NEXT_PUBLIC_WHATSAPP_NUMBER production
npx vercel env add NEXT_PUBLIC_PAYMENT_UPI_ID production
npx vercel env add NEXT_PUBLIC_PAYMENT_PAYEE_NAME production
npx vercel --prod
```

Public pages added:

- `/live`
- `/privacy`
- `/terms`
- `/refund-policy`
- `/forgot-password`
