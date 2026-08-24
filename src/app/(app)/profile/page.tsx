"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PROFILE_FIELDS } from "@/engine/profile-fields";

export default function ProfilePage() {
  const [partnerName, setPartnerName] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((j) => {
        setPartnerName(j.data?.partnerName ?? "");
        setCommunicationStyle(j.data?.communicationStyle ?? "");
        setValues(j.data?.values ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ partnerName, communicationStyle, values }),
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
        <div>
          <Label>Her name</Label>
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
          {PROFILE_FIELDS.filter((f) => f.group === group).map((field) => (
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
      <Button onClick={save}>Save profile</Button>
    </div>
  );
}
