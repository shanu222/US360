import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mesh px-6 text-center">
      <p className="font-display text-4xl text-navy">US360</p>
      <h1 className="mt-6 font-display text-4xl">This page isn’t here</h1>
      <p className="mt-3 text-muted">The private space you were looking for doesn’t exist.</p>
      <Button asChild className="mt-8">
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
