import Link from "next/link";
import { MORE_NAV, NAV, MOBILE_NAV } from "@/lib/nav";
import { Card } from "@/components/ui/card";

export default function MorePage() {
  const mobileHrefs = new Set<string>(MOBILE_NAV.map((item) => item.href));
  const rest = NAV.filter((item) => !mobileHrefs.has(item.href));
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <h1 className="font-display text-4xl text-navy">More</h1>
      <p className="text-muted">The rest of US360, still one section at a time.</p>
      {rest.map((item) => (
        <Link key={item.href} href={item.href}>
          <Card className="mb-3 flex items-center gap-3">
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Card>
        </Link>
      ))}
      <p className="pt-4 text-xs uppercase tracking-[0.2em] text-rose">Also</p>
      {MORE_NAV.map((item) => (
        <Link key={item.href} href={item.href}>
          <Card className="mb-3 flex items-center gap-3">
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
