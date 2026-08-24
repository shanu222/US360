# Email reminders (SMTP)

US360 can send **calendar reminders and prepared notes by email** to addresses already saved in the system:

- your account email
- her email on Profile (`partner_email`)

WhatsApp, Instagram, Facebook, and Reels are **never auto-sent**. Those stay open-and-send.

The app will not show **Sent** unless the mail server accepts the message.

## External setup

Do these outside the US360 UI, then paste values into the host environment (Vercel → Project → Settings → Environment Variables, or a local `.env`).

1. Choose a mail provider (Gmail with an App Password, Outlook, Resend, SendGrid, Amazon SES, or any SMTP host).
2. Create or verify a **From** address the provider allows you to send as.
3. Copy the SMTP host (for Gmail: `smtp.gmail.com`).
4. Copy the SMTP port: `587` (STARTTLS) or `465` (SSL).
5. Copy the SMTP username (usually the mailbox address).
6. Copy the SMTP password. For Gmail you must use a 16-character **App Password**, not your normal Google password (Google Account → Security → 2-Step Verification → App passwords).
7. Set these variables:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=US360 <you@gmail.com>
```

8. Redeploy (Vercel) or restart `npm run dev` so the process picks up the new variables.
9. In US360, sign in and confirm your account email is correct.
10. On **Profile**, add her email if partner reminders should go to her.
11. On **Settings**, turn on **Email reminders to saved addresses** and **Events**.
12. Send **Send test email**. If it arrives, calendar jobs can mail reminders. If it fails, the product will not claim it was sent.
13. Keep the daily cron (`CRON_SECRET` + `/api/jobs/run`) enabled so scheduled reminder emails actually fire.

## Gmail

- Enable 2-Step Verification.
- Create an App Password for “Mail”.
- `SMTP_FROM` should use the same Gmail address (or a Google-verified alias).

## Resend / SendGrid / similar

Use the provider’s SMTP credentials, not a fake `https://SMTP_HOST/` webhook. Example Resend:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_xxxxxxxxx
SMTP_FROM=US360 <reminders@your-verified-domain>
```

The From address must be on a domain the provider has verified.

## What gets emailed

| Reminder | Goes to |
| --- | --- |
| Calendar / “you” reminders | Account email |
| Prepared notes for her (`reminder_her`) | Her Profile email |
| Reels, Instagram, Facebook, WhatsApp | Never emailed or auto-sent |

Until SMTP is set, reminders still appear in-app and by web push.
