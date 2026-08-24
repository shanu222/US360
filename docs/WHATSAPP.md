# WhatsApp Cloud API (official only)

US360 sends calendar reminders to a user’s WhatsApp number **only** through the official WhatsApp Business Cloud API (Graph API), or an approved provider that uses a Graph-compatible messages endpoint.

It does **not**:

- ask for a personal WhatsApp password
- scrape WhatsApp Web
- run a browser bot
- use unofficial libraries

## Workflow

WhatsApp chat export → parse messages → detect dates & events → organize calendar → identify upcoming events → prepare reminder → user confirmation for uncertain dates → WhatsApp notification (if Cloud API is configured)

Events come from the **uploaded export**, not dummy data. Clear lines such as “My exam is tomorrow.” become **Tomorrow — Exam** (high confidence, auto-added). Vague plans wait on Calendar until you confirm.

## Until credentials exist

Reminders still fire in-app, by email, and by web push. WhatsApp stays disabled. Settings reports “not configured.” The app will not claim a WhatsApp message was sent.

## What you need

1. Meta Developer account
2. WhatsApp Business Platform / Cloud API
3. Verified business (when Meta requires it)
4. WhatsApp Business phone number (the **sender**)
5. API permissions for Cloud API messaging (`whatsapp_business_messaging` and related scopes)
6. Permanent access token + Phone Number ID
7. Webhook: `https://<app>/api/integrations/whatsapp/webhook` and `WHATSAPP_VERIFY_TOKEN`
8. Approved **utility** template with two body variables: event title, timing (`today` / `tomorrow` / `in N days`)

Suggested template body (submit this to Meta for approval):

```
Reminder ❤️
{{1}} is {{2}}. You may want to wish her good luck or prepare a supportive message.
```

Example after fill: “Exam is tomorrow.”

Business-initiated messages outside the 24-hour customer-care window **must** use an approved template. Free-form session messages are not used for these reminders.

## Environment

```
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_REMINDER_TEMPLATE=us360_reminder
WHATSAPP_TEMPLATE_LANG=en
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_API_BASE=   # optional; default https://graph.facebook.com/v21.0
```

If you use a compliant WhatsApp messaging provider instead of calling Meta directly, point `WHATSAPP_API_BASE` at their Graph-compatible `/messages` host. Do not use unofficial WhatsApp automation.

Users then save their own number under Settings (the **recipient**) and enable WhatsApp reminders. Daily jobs call `/{phone-number-id}/messages` with the approved template.

Scheduled WhatsApp **calls** are not part of Cloud API messaging; this integration sends reminder **messages** only.
