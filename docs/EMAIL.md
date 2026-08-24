# Email (personal Gmail OAuth)

Each US360 user connects **their own Gmail** with Google OAuth. Mail is sent with the **Gmail API** from that account.

US360 never asks for a Gmail password or App Password, never stores Google passwords, and never uses one shared mailbox for all users.

Access and refresh tokens stay on the server, encrypted with `TOKEN_ENCRYPTION_KEY`. They are never returned to the browser or written to git.

## What the user does

1. Settings → Email & notifications → **Connect Gmail**
2. Google consent (send mail on their behalf)
3. **Send Test Email** — Sent only if Gmail accepts the message
4. Optional: partner email on Profile, Automatic partner emails off by default

## Google Cloud

1. Google Cloud project → enable **Gmail API**
2. OAuth consent screen with:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/gmail.send`
3. OAuth client type **Web application** (the same client as Google sign-in is fine)

### Redirect URIs

Development:

```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/integrations/gmail/callback
```

Production (must match the live origin exactly):

```
https://YOUR-DOMAIN/api/auth/callback/google
https://YOUR-DOMAIN/api/integrations/gmail/callback
```

Also add the origins (`http://localhost:3000` and `https://YOUR-DOMAIN`) under Authorized JavaScript origins.

`gmail.send` is a sensitive Google scope. In testing mode, add Test users. Production with many users may require Google app verification.

## Vercel environment (server-side only)

Never prefix these with `NEXT_PUBLIC_`.

| Variable | Purpose |
| --- | --- |
| `AUTH_GOOGLE_ID` | OAuth client ID (sign-in + Gmail, unless overridden) |
| `AUTH_GOOGLE_SECRET` | OAuth client secret |
| `GMAIL_GOOGLE_ID` | Optional separate client ID for Gmail |
| `GMAIL_GOOGLE_SECRET` | Optional separate client secret |
| `GMAIL_REDIRECT_URI` | `https://YOUR-DOMAIN/api/integrations/gmail/callback` |
| `AUTH_URL` / `NEXT_PUBLIC_APP_URL` | Public origin used to build callback URLs |
| `TOKEN_ENCRYPTION_KEY` | Encrypts Gmail tokens at rest |
| `AUTH_SECRET` | Session signing |
| `CRON_SECRET` | Daily job runner so scheduled Gmail sends fire |

Local `.env` uses `http://localhost:3000` for `AUTH_URL` and `GMAIL_REDIRECT_URI`.

## Architecture

```
User → Connect Gmail → Google OAuth → encrypted tokens on that user row
     → reminder engine / cron → Gmail API → From: that user's Gmail
```

User A’s jobs never load User B’s tokens. From is the connected address; US360 will not claim a send unless Gmail returns a message id.

## What is emailed

| Reminder | Goes to | From |
| --- | --- | --- |
| Calendar / you reminders | Connected Gmail / account email | Connected Gmail |
| Partner notes | Partner Profile email | Connected Gmail, only if enabled or Send now |
| Reels, Instagram, Facebook, WhatsApp | Never auto-sent | — |

Until Gmail is connected, reminders still appear in-app and by web push.
