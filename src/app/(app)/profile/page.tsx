"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { profileFields } from "@/engine/profile-fields";
import { optionsFor } from "@/engine/profile-options";
import { GenderSelect } from "@/components/gender-select";
import { SelectOrWrite } from "@/components/select-or-write";
import { voiceFor, type Gender } from "@/lib/voice";
import { PAKISTAN_CITIES } from "@/lifestyle/cities";
import { COMMUNICATION_STYLES } from "@/types";

export default function ProfilePage() {
  const [partnerName, setPartnerName] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [userGender, setUserGender] = useState<Gender | "">("");
  const [partnerGender, setPartnerGender] = useState<Gender | "">("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const voice = useMemo(() => voiceFor(partnerGender || null), [partnerGender]);
  const fields = useMemo(() => profileFields(partnerGender || null), [partnerGender]);
  const cityOptions = useMemo(() => PAKISTAN_CITIES.map((city) => city.name), []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((j) => {
        setPartnerName(j.data?.partnerName ?? "");
        setCommunicationStyle(j.data?.communicationStyle ?? "");
        setUserGender(j.data?.userGender ?? "");
        setPartnerGender(j.data?.partnerGender ?? "");
        setValues(j.data?.values ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    if (!userGender || !partnerGender) {
      toast.error("Please choose male or female for you and your partner.");
      return;
    }
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ partnerName, communicationStyle, values, userGender, partnerGender }),
    });
    if (!res.ok) return toast.error("Could not save profile.");
    toast.success("Profile saved. Commands will use this.");
  }

  if (loading) return <p className="text-sm text-muted">Loading profile…</p>;

  const groups = ["city", "about", "favorites", "food", "send", "conflict", "style", "history", "now"] as const;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">Relationship profile</h1>
        <p className="mt-2 text-muted">
          Tap chips to select, or write your own — you can do both. You do not have to type everything. These fields feed
          the rule engine, cards, Reel choices, Send, and city food/place suggestions. City is enough — do not enter a
          home address.
        </p>
      </div>
      <Card className="space-y-4">
        <GenderSelect label="I am" value={userGender} onChange={setUserGender} />
        <GenderSelect
          label="My partner is"
          value={partnerGender}
          onChange={setPartnerGender}
          hint="The rest of US360 uses he/him or she/her from this."
        />
        <div>
          <Label>{voice.Their} name</Label>
          <Input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
        </div>
        <div>
          <Label>How you two usually talk</Label>
          <SelectOrWrite
            value={communicationStyle}
            onChange={setCommunicationStyle}
            options={COMMUNICATION_STYLES}
            placeholder="Or write your own style"
          />
        </div>
      </Card>
      {groups.map((group) => (
        <Card key={group} className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-rose">{group}</p>
          {fields
            .filter((f) => f.group === group)
            .map((field) => {
              const value = values[field.key] ?? "";
              const setValue = (next: string) => setValues((current) => ({ ...current, [field.key]: next }));
              const sendPlaceholder =
                field.key === "partner_instagram"
                  ? "username"
                  : field.key === "partner_whatsapp"
                    ? "923001234567"
                    : field.key === "partner_email"
                      ? "name@example.com"
                      : "username";
              return (
                <div key={field.key}>
                  <Label>{field.label}</Label>
                  {field.kind === "text" ? (
                    <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={sendPlaceholder} />
                  ) : field.kind === "textarea" ? (
                    <Textarea value={value} onChange={(e) => setValue(e.target.value)} />
                  ) : field.kind === "city" ? (
                    <SelectOrWrite value={value} onChange={setValue} options={cityOptions} mode="single" placeholder="Or write another city" />
                  ) : (
                    <SelectOrWrite
                      value={value}
                      onChange={setValue}
                      options={optionsFor(field.optionsKey)}
                      mode={field.kind === "choice" ? "single" : "multi"}
                    />
                  )}
                </div>
              );
            })}
        </Card>
      ))}
      <Button onClick={save} disabled={!userGender || !partnerGender}>
        Save profile
      </Button>
      <p className="text-sm text-muted">
        Need the live system wired?{" "}
        <Link className="underline" href="/docs/setup">
          External setup steps
        </Link>
      </p>
    </div>
  );
}
