import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LoveCard } from "@/components/love-card";

const features = [
  {
    title: "WhatsApp → memory",
    body: "Import a chat ZIP. US360 reads dates, likes, foods, and how you write — without sending the export to an AI.",
  },
  {
    title: "Calendar that listens",
    body: "Exams, classes, grocery runs, birthdays — dated lines become reminders 7 days, 3 days, tomorrow, and on the day.",
  },
  {
    title: "Colorful cards",
    body: "Aurora, ruby, coral, champagne. Copy is drafted from recent chat and behavior. You still send it yourself.",
  },
  {
    title: "Reels with a gap",
    body: "Connect Instagram officially. Search Reels from chat topics, save them, then a cadence reminds you — never a silent auto-DM.",
  },
  {
    title: "What should I do?",
    body: "Describe a moment. Receive a calm, structured recommendation — not a lecture, and never a diagnosis.",
  },
  {
    title: "Restraint built in",
    body: "If you already showed care, the honest answer may be: nothing needed right now.",
  },
];

const steps = [
  { n: "01", t: "Import the WhatsApp chat" },
  { n: "02", t: "Calendar, cards, and Reel searches fill themselves" },
  { n: "03", t: "You send — US360 only prepares, reminds, and spaces" },
];

const faqs = [
  {
    q: "Can you read our WhatsApp chat?",
    a: "Yes — you upload the ZIP WhatsApp already lets you export. Only the text file is read in your browser first, then stored privately. Photos stay on your device. No AI reads the full export.",
  },
  {
    q: "Will US360 send Instagram Reels for me?",
    a: "Not silently. Connect Instagram officially, search Reels from chat topics, save the ones you like, then a cadence reminds you with a gap. You tap Open Instagram & Share. Consumer accounts cannot be auto-DMed.",
  },
  {
    q: "Will US360 send messages for me?",
    a: "No. US360 prepares suggestions. You stay in control of every message, card, and share.",
  },
  {
    q: "Do you store Instagram passwords?",
    a: "Never. Official Meta OAuth is used when available. If posting is not supported, you get a simple Open Instagram & Share fallback.",
  },
  {
    q: "Is my relationship data used to train models?",
    a: "US360 sends only the context you allow, and you can export or delete your data at any time.",
  },
  {
    q: "What if I already showed care today?",
    a: "Then the best recommendation may be: nothing needed right now. Restraint is part of the product.",
  },
];

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="bg-mesh min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <p className="font-display text-3xl text-navy">US360</p>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <Button asChild>
              <Link href="/home">Open app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-20 pt-10 text-center md:pt-20">
        <p className="text-xs uppercase tracking-[0.32em] text-rose">Private relationship companion</p>
        <h1 className="mt-6 font-display text-5xl leading-[1.05] text-navy md:text-7xl">
          Remember better.
          <br />
          Communicate better.
          <br />
          Care better.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          Your private AI companion for thoughtful communication, meaningful reminders and everyday connection.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#how">How it works</Link>
          </Button>
        </div>
        <div className="mx-auto mt-16 max-w-md">
          <LoveCard
            message="I keep you in the small details — even chai after class."
            themeId="aurora"
            partnerName="her"
            kicker="From your chat"
            className="min-h-[380px]"
          />
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.28em] text-muted">How it works</p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card-premium p-8">
              <p className="text-sm tracking-[0.2em] text-blush">{s.n}</p>
              <p className="mt-4 font-display text-3xl text-navy">{s.t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="card-premium p-7">
              <h2 className="font-display text-2xl text-navy">{f.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="overflow-hidden rounded-[2rem] bg-navy px-8 py-14 text-cream md:px-16">
          <p className="text-xs uppercase tracking-[0.28em] text-blush">Privacy</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl md:text-5xl">Built to stay private, because care should never feel like surveillance.</h2>
          <p className="mt-5 max-w-2xl text-cream/75">
            No Instagram passwords. No secret monitoring. No impersonation. You decide what is remembered, what is
            suggested, and what is sent.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="font-display text-4xl text-navy">FAQ</h2>
        <div className="mt-8 space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="card-premium p-5">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-3 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
        <h2 className="font-display text-4xl text-navy md:text-5xl">Start with one thoughtful question.</h2>
        <p className="mt-4 text-muted">What should I do right now?</p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/register">Get Started</Link>
        </Button>
      </section>
    </div>
  );
}
