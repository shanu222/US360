# Official platform integrations

US360 never uses passwords, scraping, or browser bots for Instagram, Facebook, or WhatsApp.

**Auto-send is Gmail only.** Each user connects their own Gmail. Instagram, Facebook, WhatsApp, and Reels always stay **open-and-send**. The app will not show **Sent** unless Gmail confirms acceptance.

## Email

See [EMAIL.md](./EMAIL.md) and `/docs/email`.

- Google OAuth + Gmail API (`gmail.send`)
- Encrypted per-user refresh tokens
- Settings: Connect Gmail + reminder toggles
- Cron: `/api/jobs/run`

## Instagram

Identifiers on Profile let the app **open Instagram** with a caption ready. Consumer DMs are not sent by third-party apps. Reels are never auto-posted.

- Meta Developer account
- OAuth: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`

## Facebook

Personal profile messages are not automated. Fallback: **Open Facebook**.

## WhatsApp

Chat **import** still uses an export ZIP. Sending a reminder or Reel through WhatsApp is always **Open WhatsApp** (`wa.me`). See [WHATSAPP.md](./WHATSAPP.md) if you still want Cloud API credentials for other experiments — US360 will not auto-send on WhatsApp.

## Environment

```
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
GMAIL_REDIRECT_URI=
TOKEN_ENCRYPTION_KEY=
META_APP_ID=
META_APP_SECRET=
```
