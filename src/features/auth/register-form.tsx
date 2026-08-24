"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { GenderSelect } from "@/components/gender-select";
import type { Gender } from "@/lib/voice";

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<Gender | "">("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!gender) {
      toast.error("Please tell us whether you are male or female so US360 can use the right language.");
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        gender,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error ?? "Could not create account");
      return;
    }
    const sign = await signIn("credentials", {
      email: String(form.get("email")).trim().toLowerCase(),
      password: String(form.get("password")),
      redirect: false,
    });
    if (sign?.error) {
      toast.success("Account created. Please sign in.");
      window.location.assign("/login");
      return;
    }
    window.location.assign("/onboarding");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
      </div>
      <GenderSelect
        label="I am"
        value={gender}
        onChange={setGender}
        hint="Required. Messages, reminders, and suggestions use the matching language for you and your partner."
      />
      <Button className="w-full" disabled={loading || !gender}>
        {loading ? "Creating…" : "Create account"}
      </Button>
      {googleEnabled ? (
        <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/onboarding" })}>
          Continue with Google
        </Button>
      ) : null}
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-navy underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
