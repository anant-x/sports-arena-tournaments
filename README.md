<div align="center">

<img src="public/assets/sports-arena-logo-v2.png" alt="Sports Arena Tournaments" width="180" />

# Sports Arena Tournaments

A full-stack tournament discovery, registration, live-score, payment, and administration platform built with Next.js.

[Live site](https://cricket-tournament-snowy.vercel.app) · [Tournaments](https://cricket-tournament-snowy.vercel.app/tournaments) · [Live scores](https://cricket-tournament-snowy.vercel.app/live)

</div>

## Overview

Sports Arena supports cricket, badminton, tennis, football, and turf events. Players can browse tournaments, create an account, register, pay an advance, follow fixtures and results, and manage saved registrations. Organizers get an authenticated console for records, scoreboards, standings, content, and CSV exports.

## Features

### Players and teams

- Multi-sport tournament catalog with filters and detail pages
- Rules, dates, venue maps, fees, prizes, slots, and registration deadlines
- Account signup, login, profile management, and saved registrations
- Individual and team registration flows
- Razorpay checkout, UPI details, and demo-payment fallback
- Fixtures, live scorecards, results, points tables, and leaderboards
- Team pages, gallery, announcements, WhatsApp links, and support chatbot
- Privacy, terms, refund, contact, and password-recovery pages

### Organizers

- Password-protected `/admin` console
- Registration, payment, player, and tournament record tables
- Live scorecard, standings, fixtures, announcements, and gallery management
- Database status and summary views
- CSV exports and administrative activity logs

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 App Router |
| UI | React 18 and Tailwind CSS |
| Database | PostgreSQL through the `postgres` client |
| Authentication | Password hashing with database-backed sessions |
| Payments | Razorpay Orders API and UPI presentation |
| Hosting | Vercel |

## Local Development

### Requirements

- Node.js 18 or later
- npm
- PostgreSQL for persistent accounts, registrations, payments, and admin data

### Install and run

```bash
git clone https://github.com/anant-x/sports-arena-tournaments.git
cd sports-arena-tournaments
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without `DATABASE_URL`, the application can display the bundled tournament catalog and use selected demo fallbacks, but durable authentication and records require PostgreSQL.

## Environment Variables

### Core server configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Production | PostgreSQL connection string |
| `ADMIN_PASSWORD` | Admin console | Admin login password |
| `ADMIN_SESSION_SECRET` | Recommended | Secret used to protect admin sessions |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical public URL for sharing and metadata |

### Razorpay

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Live payments | Public Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Live payments | Server-only Razorpay secret |

When Razorpay keys are missing, the order route returns a demo payment so the registration flow can still be exercised.

### Public organizer details

```dotenv
NEXT_PUBLIC_ORGANIZER_NAME=
NEXT_PUBLIC_ORGANIZER_PHONE=
NEXT_PUBLIC_ORGANIZER_EMAIL=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_INSTAGRAM_HANDLE=
NEXT_PUBLIC_INSTAGRAM_URL=
NEXT_PUBLIC_PAYMENT_UPI_ID=
NEXT_PUBLIC_PAYMENT_PAYEE_NAME=
NEXT_PUBLIC_PAYMENT_QR_IMAGE=/assets/phonepe-upi-qr.png
```

Do not commit database credentials, admin secrets, or Razorpay secrets.

## Tournament Data

The bundled tournament catalog lives in:

```text
data/tournament.json
```

Add a tournament to the `tournaments` array with a unique `slug`. When PostgreSQL is configured, the application can synchronize catalog entries and creates required tables automatically through its repository layer.

## Database Model

The application manages tables for:

- tournaments, users, sessions, registrations, and payments
- match updates, standings, and player statistics
- site content, notifications, and admin action logs

Database indexes and compatibility columns are created by `lib/db.js` when the schema is initialized.

## Important Routes

| Route | Purpose |
| --- | --- |
| `/tournaments` | Tournament catalog |
| `/tournaments/[slug]` | Tournament details |
| `/register/[slug]` | Tournament registration |
| `/payment` | Razorpay or UPI payment flow |
| `/live` | Live scoreboard |
| `/fixtures`, `/results`, `/points-table` | Competition tracking |
| `/profile`, `/my-tournament` | Player account and registrations |
| `/admin/login` | Organizer authentication |
| `/admin` | Organizer dashboard |

## Project Structure

```text
.
├── app/                    # Pages and API routes
├── components/             # Public and admin UI
├── data/tournament.json    # Bundled tournament catalog
├── lib/                    # Database, sessions, security, and domain logic
├── public/assets/          # Logos, team artwork, posters, and QR image
├── routes/                 # Supporting Node route modules
├── middleware.js           # Admin route protection
├── database.js             # Legacy/local database support
└── vercel.json             # Deployment configuration
```

## Build and Deploy

```bash
npm run build
npx vercel --prod
```

Configure production environment variables before deploying. Verify the admin login, database writes, payment webhooks or verification flow, public contact details, and legal pages before accepting real registrations.

## Security Checklist

- Use unique values for `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.
- Keep `DATABASE_URL` and `RAZORPAY_KEY_SECRET` server-only.
- Replace demo organizer, UPI, QR, and tournament details before launch.
- Test payment verification and refund handling with Razorpay test mode first.
- Review collected personal data and retention requirements before production use.

## License

The package metadata declares this project under the MIT License. Add a `LICENSE` file to publish the complete license terms with the repository.
