"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { COMMUNICATION_STYLES, FAVORITE_CATEGORIES } from "@/types";
import { GenderSelect } from "@/components/gender-select";
import { oppositeGender, voiceFor, type Gender } from "@/lib/voice";

const STEPS = [
  "Welcome",
  "Relationship",
  "Preferences",
  "Dates",
  "Communication",
  "Daily automation",
  "Notifications",
  "Privacy",
];

export function OnboardingFlow({
  defaultTimezone,
  existingUserGender,
  existingPartnerGender,
  existingPartnerName,
  genderOnly,
  nextPath,
}: {
  defaultTimezone: string;
  existingUserGender?: Gender | null;
  existingPartnerGender?: Gender | null;
  existingPartnerName?: string;
  genderOnly?: boolean;
  nextPath?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [userGender, setUserGender] = useState<Gender | "">(existingUserGender ?? "");
  const [partnerGender, setPartnerGender] = useState<Gender | "">(
    existingPartnerGender ?? (existingUserGender ? oppositeGender(existingUserGender) : ""),
  );
  const [data, setData] = useState({
    partnerName: existingPartnerName ?? "",
    partnerNickname: "",
    startDate: "",
    communicationStyle: "Simple",
    language: "en",
    timezone: defaultTimezone || "UTC",
    favorites: Object.fromEntries(FAVORITE_CATEGORIES.map((c) => [c, ""])) as Record<string, string>,
    dislikes: "",
    birthday: "",
    anniversary: "",
    customDates: "",
    styles: ["Simple"] as string[],
    automationMode: "ASSISTED",
    morningTime: "08:00",
    afternoonTime: "14:00",
    eveningTime: "19:00",
    nightTime: "22:00",
    city: "",
  });

  const voice = useMemo(() => voiceFor(partnerGender || "female"), [partnerGender]);

  function toggleStyle(style: string) {
    setData((d) => ({
      ...d,
      styles: d.styles.includes(style) ? d.styles.filter((s) => s !== style) : [...d.styles, style],
    }));
  }

  function setUserAndDefaultPartner(next: Gender) {
    setUserGender(next);
    if (!existingPartnerGender && (!partnerGender || partnerGender === oppositeGender(next) || partnerGender === (existingUserGender ? oppositeGender(existingUserGender) : ""))) {
      setPartnerGender(oppositeGender(next));
    } else if (!partnerGender) {
      setPartnerGender(oppositeGender(next));
    }
  }

  async function saveGenders() {
    if (!userGender || !partnerGender) {
      toast.error("Please choose male or female for you and your partner.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/gender", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userGender,
        partnerGender,
        partnerName: data.partnerName || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save. Please try again.");
      return;
    }
    router.push(nextPath || "/home");
    router.refresh();
  }

  async function finish() {
    if (!userGender || !partnerGender) {
      toast.error("Please choose male or female for you and your partner.");
      setStep(1);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...data, userGender, partnerGender }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save onboarding. Please try again.");
      return;
    }
    router.push("/import-chat");
    router.refresh();
  }

  function canContinue() {
    if (step === 1 && !userGender) return false;
    if (step === 2 && (!data.partnerName || !partnerGender)) return false;
    return true;
  }

  if (genderOnly) {
    return (
      <div className="bg-mesh min-h-screen px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-center font-display text-4xl text-navy">US360</p>
          <div className="card-premium mt-8 space-y-6 p-8">
            <h1 className="font-display text-4xl text-navy">Tell US360 who you are</h1>
            <p className="text-sm leading-6 text-muted">
              Pronouns, reminders, and suggestions follow these answers. You can change them later on Profile.
            </p>
            <GenderSelect label="I am" value={userGender} onChange={setUserAndDefaultPartner} />
            <GenderSelect
              label="My partner is"
              value={partnerGender}
              onChange={setPartnerGender}
              hint="Defaults to the other option. Change it if that is not right."
            />
            {!existingPartnerName ? (
              <div>
                <Label>{voice.Their} name or nickname</Label>
                <Input value={data.partnerName} onChange={(e) => setData({ ...data, partnerName: e.target.value })} />
              </div>
            ) : null}
            <Button className="w-full" onClick={saveGenders} disabled={saving || !userGender || !partnerGender}>
              {saving ? "Saving…" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-mesh min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-center font-display text-4xl text-navy">US360</p>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.28em] text-muted">
          Step {step} of 8 · {STEPS[step - 1]}
        </p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-paper">
          <div className="h-full bg-navy transition-all" style={{ width: `${(step / 8) * 100}%` }} />
        </div>

        <div className="card-premium mt-8 p-8">
          {step === 1 && (
            <div className="space-y-6 text-center">
              <h1 className="font-display text-4xl text-navy">Welcome to US360</h1>
              <p className="text-lg text-muted">Remember better. Communicate better. Care better.</p>
              <p className="text-sm leading-6 text-muted">
                This is a private space to become more attentive — not a bot that speaks for you.
              </p>
              <div className="text-left">
                <GenderSelect
                  label="I am"
                  value={userGender}
                  onChange={setUserAndDefaultPartner}
                  hint="Required. US360 uses this so the whole app can speak in the right language."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-3xl">Relationship profile</h2>
              <GenderSelect
                label="My partner is"
                value={partnerGender}
                onChange={setPartnerGender}
                hint="Required. Cards, commands, and reminders will use he/him or she/her from this."
              />
              <div>
                <Label>{voice.Their} name or nickname</Label>
                <Input value={data.partnerName} onChange={(e) => setData({ ...data, partnerName: e.target.value })} required />
              </div>
              <div>
                <Label>Nickname (optional)</Label>
                <Input value={data.partnerNickname} onChange={(e) => setData({ ...data, partnerNickname: e.target.value })} />
              </div>
              <div>
                <Label>Relationship start date (optional)</Label>
                <Input type="date" value={data.startDate} onChange={(e) => setData({ ...data, startDate: e.target.value })} />
              </div>
              <div>
                <Label>Preferred language</Label>
                <Input value={data.language} onChange={(e) => setData({ ...data, language: e.target.value })} />
              </div>
              <div>
                <Label>Timezone</Label>
                <Input value={data.timezone} onChange={(e) => setData({ ...data, timezone: e.target.value })} />
              </div>
              <div>
                <Label>Your city (optional — city only, no home address)</Label>
                <Input
                  list="pk-cities"
                  placeholder="Islamabad"
                  value={data.city}
                  onChange={(e) => setData({ ...data, city: e.target.value })}
                />
                <datalist id="pk-cities">
                  {["Islamabad", "Rawalpindi", "Lahore", "Karachi", "Peshawar", "Quetta", "Multan", "Faisalabad", "Gujranwala", "Sialkot", "Hyderabad", "Bahawalpur", "Abbottabad", "Murree", "Gilgit", "Skardu"].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-3xl">{voice.Their} preferences</h2>
              <p className="text-sm text-muted">Add what you already know. You can refine this later.</p>
              {FAVORITE_CATEGORIES.map((cat) => (
                <div key={cat}>
                  <Label className="capitalize">{cat.replaceAll("_", " ")}</Label>
                  <Input
                    placeholder="Comma separated"
                    value={data.favorites[cat]}
                    onChange={(e) => setData({ ...data, favorites: { ...data.favorites, [cat]: e.target.value } })}
                  />
                </div>
              ))}
              <div>
                <Label>Things {voice.they} dislikes</Label>
                <Textarea value={data.dislikes} onChange={(e) => setData({ ...data, dislikes: e.target.value })} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display text-3xl">Important dates</h2>
              <div>
                <Label>Birthday</Label>
                <Input type="date" value={data.birthday} onChange={(e) => setData({ ...data, birthday: e.target.value })} />
              </div>
              <div>
                <Label>Anniversary</Label>
                <Input type="date" value={data.anniversary} onChange={(e) => setData({ ...data, anniversary: e.target.value })} />
              </div>
              <div>
                <Label>Other events (one per line: Title — YYYY-MM-DD)</Label>
                <Textarea value={data.customDates} onChange={(e) => setData({ ...data, customDates: e.target.value })} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="font-display text-3xl">Communication preferences</h2>
              <p className="mt-2 text-sm text-muted">Choose the tones that sound like you.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {COMMUNICATION_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={`rounded-full px-4 py-2 text-sm ${data.styles.includes(style) ? "bg-navy text-cream" : "bg-paper"}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="font-display text-3xl">Daily automation</h2>
              <p className="text-sm text-muted">Would you like US360 to prepare daily thoughtful content?</p>
              {[
                { id: "SMART", t: "Smart Mode", d: "US360 prepares recommendations and cards. You still approve anything that leaves the app." },
                { id: "ASSISTED", t: "Assisted Mode", d: "Cards and messages can be scheduled. External actions follow supported integrations — otherwise you share manually." },
                { id: "MANUAL", t: "Manual Mode", d: "AI only recommends. Nothing is scheduled automatically." },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setData({ ...data, automationMode: m.id })}
                  className={`w-full rounded-2xl border p-4 text-left ${data.automationMode === m.id ? "border-navy bg-white" : "border-line"}`}
                >
                  <p className="font-medium">{m.t}</p>
                  <p className="mt-1 text-sm text-muted">{m.d}</p>
                </button>
              ))}
            </div>
          )}

          {step === 7 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <h2 className="font-display text-3xl sm:col-span-2">Notification times</h2>
              {(["morningTime", "afternoonTime", "eveningTime", "nightTime"] as const).map((key) => (
                <div key={key}>
                  <Label className="capitalize">{key.replace("Time", "").replace(/([A-Z])/g, " $1")}</Label>
                  <Input type="time" value={data[key]} onChange={(e) => setData({ ...data, [key]: e.target.value })} />
                </div>
              ))}
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4 text-sm leading-6 text-muted">
              <h2 className="font-display text-3xl text-ink">Your privacy</h2>
              <p>US360 stores the profile, memories, dates, messages, cards, and Reels you choose to save — so it can help you remember and communicate with more care.</p>
              <p>AI receives only the context you allow in Settings. Generated text is a suggestion, never an automatic send.</p>
              <p>Instagram, if connected, uses official OAuth. We never ask for a social password or scrape accounts.</p>
              <p>City is optional for food and place suggestions. US360 does not store a home address and does not track GPS unless you later opt in.</p>
              <p>You can export or delete memories, relationship data, or your entire account from Settings at any time.</p>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {step < 8 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue()}>
                Continue
              </Button>
            ) : (
              <Button onClick={finish} disabled={saving || !data.partnerName || !userGender || !partnerGender}>
                {saving ? "Saving…" : "Enter US360"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
