"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email")).trim().toLowerCase(),
      password: String(form.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Those details didn’t match. Please try again.");
      return;
    }
    window.location.assign("/home");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <Button className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      {googleEnabled ? (
        <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/home" })}>
          Continue with Google
        </Button>
      ) : null}
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="text-navy underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
