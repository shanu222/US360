# Full system setup (external services)

This is the master checklist to make US360 work in production. Follow it in order.

US360 is **not** a Firebase app and **does not use Resend**. Email is each person’s own Gmail (Google OAuth + Gmail API). Auth is Auth.js + PostgreSQL.

| People often ask about | US360 actually uses |
| --- | --- |
| Firebase Auth / Firestore | Auth.js + PostgreSQL |
| Firebase Cloud Messaging | Web Push with VAPID keys (optional) |
| Resend / SendGrid / one Gmail App Password for everyone | Per-user **Connect Gmail** |
| WhatsApp Business auto-send | Never. Import a chat ZIP; sending is Open WhatsApp |

In-app copy of this page: `/docs/setup`.

---

## How the live system fits together

```
Browser (Vercel)
  → Auth.js (email/password or Google sign-in)
  → PostgreSQL (profile, memories, jobs)
  → Optional OpenAI (assistant; app still works without it)
  → Cron → /api/jobs/run
       → Gmail API from THAT user’s connected Gmail
       → optional Web Push
  → WhatsApp / Instagram / Facebook: open the official app. Never auto-send.
```

---

## 1. Deploy on Vercel (required)

1. Import the GitHub repo into [Vercel](https://vercel.com/new).
2. Framework: Next.js. Build command is already `vercel-build` (Prisma generate + migrate deploy + Next build).
3. Node.js **24.x**.
4. After the first deploy, copy the production URL (example: `https://us-360-eta.vercel.app`).
5. Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to that exact HTTPS origin, then **redeploy**.

---

## 2. PostgreSQL (required)

1. Create a database: Vercel Postgres, Neon, or Supabase.
2. Attach it to the Vercel project.
3. Set:

```
DATABASE_URL=   pooled URL (add ?pgbouncer=true if the host uses PgBouncer)
DIRECT_URL=     direct / non-pooling URL (migrations)
```

Local Docker is fine for development (`docker compose up -d`).

---

## 3. Secrets (required)

Generate each with `openssl rand -base64 32`:

```
AUTH_SECRET=
TOKEN_ENCRYPTION_KEY=
CRON_SECRET=
```

- `AUTH_SECRET` signs sessions.
- `TOKEN_ENCRYPTION_KEY` encrypts Gmail (and other) OAuth tokens on the server.
- `CRON_SECRET` protects `/api/jobs/run`.

Never put secrets in `NEXT_PUBLIC_*`. Never commit `.env`.

---

## 4. Google Cloud — sign-in + Gmail (required for email)

Create or open a Google Cloud project.

1. Enable **Gmail API**.
2. Configure the OAuth consent screen. Scopes:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/gmail.send`
3. Create an OAuth client of type **Web application**.
4. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://YOUR-DOMAIN`
5. Authorized redirect URIs:

```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/integrations/gmail/callback
https://YOUR-DOMAIN/api/auth/callback/google
https://YOUR-DOMAIN/api/integrations/gmail/callback
```

6. Vercel environment variables (server-side only):

```
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_URL=https://YOUR-DOMAIN
NEXT_PUBLIC_APP_URL=https://YOUR-DOMAIN
GMAIL_REDIRECT_URI=https://YOUR-DOMAIN/api/integrations/gmail/callback
TOKEN_ENCRYPTION_KEY=
```

Optional separate Gmail client: `GMAIL_GOOGLE_ID` / `GMAIL_GOOGLE_SECRET`.

7. While the app is in Google **testing** mode, add every tester under OAuth consent → Test users. `gmail.send` is a sensitive scope.

8. In the product: Settings → **Connect Gmail** → Send Test Email. US360 only shows Sent if Gmail accepts the message.

Full Gmail notes: [EMAIL.md](./EMAIL.md) and `/docs/email`.

---

## 5. Cron (required for daily reminders)

`vercel.json` already schedules:

```
GET /api/jobs/run   0 12 * * *
```

Vercel sends `Authorization: Bearer $CRON_SECRET`. Set `CRON_SECRET` in Vercel.

Without cron, Connect Gmail still works for **Send Test Email** and manual sends. Daily/evening reminders will not fire on their own.

---

## 6. Optional — OpenAI (smarter assistant)

```
AI_PROVIDER=openai
AI_API_KEY=
AI_MODEL=gpt-4o-mini
```

Without this key, US360 still runs: cards, profile, calendar, and the rule engine keep working. The assistant shows a fallback when AI is unavailable.

---

## 7. Optional — Web Push (not Firebase)

```
npx web-push generate-vapid-keys
```

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@yourdomain
```

This is browser Web Push. Firebase Cloud Messaging is **not** required.

---

## 8. Optional — live restaurants / places

If unset, US360 uses the built-in Pakistan city catalog and labels results as catalog (not live-verified).

```
GOOGLE_PLACES_API_KEY=
FOURSQUARE_API_KEY=
```

Official APIs only. Never scrape. City on Profile is enough — no home address.

---

## 9. Optional — Instagram (official OAuth only)

```
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://YOUR-DOMAIN/api/integrations/instagram/callback
```

Profile still needs their Instagram username for **Open Instagram**. Reels and DMs are never auto-sent.

---

## 10. WhatsApp (no extra account required)

- Import a chat export ZIP for memory and calendar.
- Sending is always **Open WhatsApp** (`wa.me`). You tap send.
- Do not collect WhatsApp passwords. Do not use unofficial bots.

Cloud API variables in `.env.example` exist for experiments. US360 will **not** auto-send WhatsApp reminders.

---

## What not to set up

- **Resend / SendGrid / Mailgun as the product mailer** — not the architecture. Mail comes from each user’s Gmail.
- **One shared Gmail App Password / SMTP mailbox for all users** — disabled unless an operator sets `SMTP_ALLOW_SHARED_FALLBACK=true` (do not do this for the public product).
- **Firebase** — not used for auth, database, or push.
- **Instagram / WhatsApp / Facebook passwords** — never.

---

## User checklist after deploy

1. Register (male or female for you and your partner).
2. Fill Profile: tap chips or write — both work.
3. Settings → Connect Gmail → Send Test Email.
4. Turn on the reminder types you want.
5. Optional: add partner email on Profile; keep Automatic partner emails off until you want them.

---

## Related pages

- `/docs/email` — Gmail OAuth in detail
- `/docs/integrations` — Instagram / Facebook / WhatsApp policy
- `/docs/whatsapp` — chat import
- [EMAIL.md](./EMAIL.md)
- [INTEGRATIONS.md](./INTEGRATIONS.md)
