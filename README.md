# US360

**Remember better. Communicate better. Care better.**

US360 is a private AI-powered personal relationship assistant. It helps you remember what matters, understand a moment, and choose a thoughtful next step. It does **not** impersonate you, scrape Instagram, or send messages without your approval.

The central question of the product is: **What should I do right now?**

Sometimes the best answer is: *Nothing needed right now. You already showed care today.*

---

## Features

- Secure email/password authentication (optional Google OAuth)
- Relationship onboarding, memories, favorites, and important dates
- AI situation assistant, “Should I apologize?”, After-argument mode
- Before You Send tone review
- Message Studio with optional “Sound like me”
- Daily Love engine with morning and good-night cards
- Card Studio with premium themes, high-quality PNG download, and print-ready PDF
- Smart calendar from uploaded WhatsApp chat exports, with confirmation for uncertain dates
- WhatsApp Business Cloud API reminders (only when Meta credentials are configured)
- Reel Vault with official Instagram OAuth and **Open Instagram & Share** fallback
- Smart calendar and timezone-aware reminders
- Make Her Smile and gift ideas (free/low budget first)
- Better Partner weekly focus and relationship insights
- Privacy controls: export, delete memory, delete relationship data, delete account
- PWA, web push architecture, email notifications, scheduled jobs
- Admin health view (no relationship content)

---

## Architecture

Next.js App Router + TypeScript UI, Next.js Route Handlers for the API, PostgreSQL via Prisma, Auth.js sessions, an LLM provider abstraction (`src/ai`), and idempotent cron jobs (`src/jobs`).

```
src/
  app/            pages, layouts, API routes
  components/     design system
  features/       product flows
  ai/             provider, context, daily engine, cards
  integrations/   official Instagram OAuth only
  jobs/           scheduled, idempotent work
  lib/            auth, db, crypto, rate limit
  server/         session helpers
prisma/           schema and seed
tests/            unit tests
```

---

## Installation

```bash
docker compose up -d
cp .env.example .env
# set AUTH_SECRET (openssl rand -base64 32)
npm install
npx prisma migrate dev --name init
npm run db:seed   # optional demo user demo@us360.local / demo12345
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Docker, point `DATABASE_URL` at any PostgreSQL 16 instance.

---

## Environment variables

See `.env.example`. Required for a local run:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection |
| `AUTH_SECRET` | Session signing |
| `AI_API_KEY` | Optional. Without it, a safe local fallback still works |
| `CRON_SECRET` | Protects `/api/jobs/run` |
| `META_APP_ID` / `META_APP_SECRET` | Official Instagram OAuth |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_REMINDER_TEMPLATE` | Official WhatsApp Cloud API reminders |
| `TOKEN_ENCRYPTION_KEY` | Encrypts stored access tokens |
| `S3_*` | Optional object storage |
| `SMTP_*` | Optional email |
| `VAPID_*` | Web Push |

Never commit `.env` or API keys.

---

## Database

```bash
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

---

## Development

```bash
npm run dev
npm run typecheck
npm run lint
npm test
```

---

## Production build

```bash
npm run build
npm run start
```

Set `NEXT_PUBLIC_APP_URL` and `AUTH_URL` to your HTTPS origin. Use a managed PostgreSQL database.

### Deploy on Vercel

1. Import [https://github.com/shanu222/US360](https://github.com/shanu222/US360) in [Vercel](https://vercel.com/new).
2. Create a Postgres database (Vercel Postgres, Neon, or Supabase) and attach it to the project.
3. Set these **required** environment variables:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Pooled Postgres URL (add `?pgbouncer=true` if the host uses PgBouncer) |
| `DIRECT_URL` | Direct / non-pooling Postgres URL (used for migrations) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://your-domain.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Same production URL |
| `CRON_SECRET` | Another long random secret |
| `TOKEN_ENCRYPTION_KEY` | Long random secret for stored OAuth tokens |

Optional: `AI_API_KEY`, Google OAuth, SMTP, VAPID, Meta/Instagram.

4. Deploy. The project uses **Node.js 24.x**. The `vercel-build` script generates the Prisma client, runs `prisma migrate deploy`, then builds Next.js.
5. After the first deploy, set `AUTH_URL` / `NEXT_PUBLIC_APP_URL` to the real production domain if it changed, and redeploy.

Vercel Cron calls `/api/jobs/run` once per day (Hobby-compatible). On Pro you can run it more often. Vercel sends `Authorization: Bearer $CRON_SECRET`.

---

## AI configuration

`AI_PROVIDER=openai` and `AI_API_KEY` enable OpenAI. Swap providers by implementing `LLMProvider` in `src/ai/providers`. Daily per-user limits are enforced in `src/ai/provider.ts`. Context sent to the model is minimized and gated by Settings.

If the provider is unavailable, the UI shows **AI is temporarily unavailable** and still allows manual writing, cards, and calendar.

---

## Image generation

Cards prefer **generated/CSS backgrounds + HTML typography**. Optional `IMAGE_API_KEY` can produce still-life backgrounds. Text is never baked into a low-quality image.

---

## Notifications

- In-app notifications
- **Email reminders** via real SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`) to addresses saved in the system (account email and her Profile email)
- Web Push via VAPID keys (`npx web-push generate-vapid-keys`)

WhatsApp, Instagram, Facebook, and Reels are **never auto-sent**. Quiet hours, frequency, and category toggles live in Settings. All schedules use the **user timezone**.

See [docs/EMAIL.md](docs/EMAIL.md) and `/docs/email` for the external mail steps.

---

## Instagram integration

Official Meta/Instagram OAuth only. US360 never asks for or stores Instagram passwords, never scrapes, and never automates the Instagram UI.

Reels and DMs are never auto-sent. Actions fall back to **Open Instagram & Share**.

---

## WhatsApp

Calendar events are extracted from an uploaded WhatsApp **chat export**, not from a live WhatsApp login:

**Export → parse messages → detect dates & events → calendar → upcoming reminders → email / in-app / push**

The app never asks for a personal WhatsApp password and never uses browser bots. Sending on WhatsApp is always **Open WhatsApp**. Automatic reminders go to **email** only.

See [docs/EMAIL.md](docs/EMAIL.md) for SMTP setup and [docs/WHATSAPP.md](docs/WHATSAPP.md) for chat-import notes.

---

## Testing

```bash
npm test
```

Coverage includes recommendation restraint, duplicate card fingerprints, timezone handling, Instagram fallback, token encryption, rate limiting, password hashing, and AI context size.

---

## Security

- Password hashing (bcrypt)
- JWT sessions via Auth.js
- CSRF protection on Auth.js cookie flows
- Rate limiting on register and AI routes
- Zod validation
- Parameterized Prisma queries
- Secure headers in `next.config.ts`
- Encrypted integration tokens
- Admin panel gated by `ADMIN_EMAILS`

---

## Troubleshooting

| Issue | What to try |
| --- | --- |
| Prisma cannot connect | Start Docker Postgres or fix `DATABASE_URL` |
| Auth errors | Set a long `AUTH_SECRET` and matching `AUTH_URL` |
| AI always uses fallback | Set `AI_API_KEY` |
| Instagram button errors | Configure Meta app credentials, or use Open & Share |
| WhatsApp reminders never send | Set Cloud API token, phone number ID, and an **approved** template; opt in under Settings |
| Jobs do nothing | `POST /api/jobs/run` with `Authorization: Bearer CRON_SECRET` |
| PWA not installing | Serve over HTTPS (localhost is fine in Chrome) |

---

## Product principle

US360 should feel like a thoughtful assistant that helps you become more attentive. It should not feel like an automation bot sending meaningless messages all day.
