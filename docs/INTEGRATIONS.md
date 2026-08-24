# Official platform integrations

US360 sends only through official APIs. It never uses passwords, scraping, or browser bots.

Until credentials exist, identifiers on Profile still let the app **open** Instagram, Facebook, WhatsApp, or email with the caption ready. It will not show **Sent** unless the provider confirms delivery.

## Instagram

- Meta Developer account
- Instagram professional/business account where required
- OAuth: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
- Permissions: `instagram_basic` and content publish only if Meta approved them
- Access tokens; webhooks if you enable posting

Consumer Instagram DMs cannot be sent by third-party apps. Fallback: **Open Instagram**.

## Facebook

- Meta Developer account
- Page configuration where required
- OAuth and Page permissions / access tokens

Personal profile messages are not automated. Fallback: **Open Facebook**.

## WhatsApp

See [WHATSAPP.md](./WHATSAPP.md). Needs Cloud API token, phone number ID, and an **approved template** for business-initiated messages. Otherwise **Open WhatsApp** (`wa.me`).

## Email

- `SMTP_HOST`, `SMTP_FROM`, and provider credentials
- Verified sender

## Environment

```
META_APP_ID=
META_APP_SECRET=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_REMINDER_TEMPLATE=
SMTP_HOST=
SMTP_FROM=
```
