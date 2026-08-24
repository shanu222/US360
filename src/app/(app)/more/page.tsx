import Link from "next/link";
import { NAV } from "@/lib/nav";
import { Card } from "@/components/ui/card";

export default function MorePage() {
  const extra = NAV.filter((n) => !["/home", "/assistant", "/daily-love", "/calendar"].includes(n.href));
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <h1 className="font-display text-4xl text-navy">More</h1>
      {extra.map((item) => (
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
