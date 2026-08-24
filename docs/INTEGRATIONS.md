# Official platform integrations

US360 never uses passwords, scraping, or browser bots for Instagram, Facebook, or WhatsApp.

**Auto-send is email only.** Reminders can go to addresses already saved (account email and her Profile email) when SMTP is configured. Instagram, Facebook, WhatsApp, and Reels always stay **open-and-send**. The app will not show **Sent** unless the provider confirms delivery.

## Email

See [EMAIL.md](./EMAIL.md) and `/docs/email`.

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- Verified sender
- Settings: Email reminders + Events
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
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
META_APP_ID=
META_APP_SECRET=
```
