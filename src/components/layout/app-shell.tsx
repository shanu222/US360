"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { NAV, MOBILE_NAV, navItemIsActive } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-mesh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line/80 bg-[#fffdfb]/90 px-5 py-6 backdrop-blur-xl lg:flex lg:flex-col">
        <Link href="/home" className="px-2">
          <p className="font-display text-3xl tracking-tight text-navy">US360</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted">Private companion</p>
        </Link>
        <nav className="mt-6 flex-1 space-y-0.5 overflow-y-auto pr-1" aria-label="Main">
          {NAV.map((item) => {
            const active = navItemIsActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
                  active ? "bg-navy text-cream" : "text-ink/80 hover:bg-paper",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-2xl bg-paper p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} src={user.image} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name ?? "You"}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line/70 bg-cream/80 px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="lg:hidden">
            <p className="font-display text-2xl">US360</p>
          </div>
          <form action="/search" className="hidden max-w-md flex-1 md:block">
            <label className="sr-only" htmlFor="global-search">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="global-search"
                name="q"
                placeholder="Search memories, events, reels…"
                className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm"
              />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Link href="/settings#notifications" className="rounded-full p-2 hover:bg-paper" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Link>
            <Link href="/search" className="rounded-full p-2 hover:bg-paper md:hidden" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
          </div>
        </header>
        <main className="px-4 pb-28 pt-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[#fffdfb]/95 px-2 py-2 backdrop-blur-xl lg:hidden"
        aria-label="Mobile"
      >
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => {
            const active = navItemIsActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px]",
                  active ? "text-navy" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
