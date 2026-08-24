# WhatsApp (open-and-send only)

US360 never auto-sends WhatsApp reminders or Reels.

It does **not**:

- ask for a personal WhatsApp password
- scrape WhatsApp Web
- run a browser bot
- use unofficial libraries
- send WhatsApp messages on a schedule

## Workflow

WhatsApp chat export → parse messages → detect dates & events → organize calendar → identify upcoming events → **email reminder** to saved addresses (and in-app / push) → you open WhatsApp yourself if you want to message her there.

Events come from the **uploaded export**, not dummy data. Clear lines such as “My exam is tomorrow.” become **Tomorrow — Exam** (high confidence, auto-added). Vague plans wait on Calendar until you confirm.

Automatic delivery is **email only**. See [EMAIL.md](./EMAIL.md).

## Sending

Add her number on Profile so **Open WhatsApp** (`wa.me`) can prefill a message. You tap send. The product will not claim a WhatsApp message was sent.
