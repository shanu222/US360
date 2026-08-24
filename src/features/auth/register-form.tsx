"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error ?? "Could not create account");
      return;
    }
    await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      callbackUrl: "/onboarding",
    });
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
      <Button className="w-full" disabled={loading}>
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
