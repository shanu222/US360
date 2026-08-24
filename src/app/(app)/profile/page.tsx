"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { profileFields } from "@/engine/profile-fields";
import { GenderSelect } from "@/components/gender-select";
import { voiceFor, type Gender } from "@/lib/voice";

export default function ProfilePage() {
  const [partnerName, setPartnerName] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [userGender, setUserGender] = useState<Gender | "">("");
  const [partnerGender, setPartnerGender] = useState<Gender | "">("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const voice = useMemo(() => voiceFor(partnerGender || null), [partnerGender]);
  const fields = useMemo(() => profileFields(partnerGender || null), [partnerGender]);

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
          Train US360 without an AI. These fields feed the rule engine, cards, Reel choices, Send, and city food/place
          suggestions. City is enough — do not enter a home address.
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
          <Input value={communicationStyle} onChange={(e) => setCommunicationStyle(e.target.value)} />
        </div>
      </Card>
      {groups.map((group) => (
        <Card key={group} className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-rose">{group}</p>
          {fields.filter((f) => f.group === group).map((field) => (
            <div key={field.key}>
              <Label>{field.label}</Label>
              {group === "send" ? (
                <Input
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  placeholder={field.key === "partner_instagram" ? "username" : field.key === "partner_whatsapp" ? "923001234567" : "username"}
                />
              ) : (
                <Textarea
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </Card>
      ))}
      <Button onClick={save} disabled={!userGender || !partnerGender}>
        Save profile
      </Button>
    </div>
  );
}
