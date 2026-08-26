import {
  Brain,
  CalendarDays,
  Clapperboard,
  Home,
  Lightbulb,
  MapPin,
  MessageCircleHeart,
  Mail,
  Settings,
  Sparkles,
  Sun,
  BookHeart,
  HeartHandshake,
  History,
  UtensilsCrossed,
} from "lucide-react";

export const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/daily-love", label: "Daily Love", icon: Sun },
  { href: "/assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/memory", label: "Memory", icon: BookHeart },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { href: "/reels", label: "Reels", icon: Clapperboard },
  { href: "/cards", label: "Cards", icon: MessageCircleHeart },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/insights", label: "Insights", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const MORE_NAV = [
  { href: "/profile", label: "Profile", icon: HeartHandshake },
  { href: "/timeline", label: "Timeline", icon: History },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/explore", label: "Places to visit", icon: MapPin },
] as const;

export const MORE_HREFS = MORE_NAV.map((item) => item.href);

const MOBILE_OVERFLOW = [
  "/memory",
  "/restaurants",
  "/food",
  "/reels",
  "/cards",
  "/messages",
  "/insights",
  "/settings",
  "/profile",
  "/timeline",
  "/ideas",
  "/explore",
  "/more",
];

export const MOBILE_NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/daily-love", label: "Daily", icon: Sun },
  { href: "/assistant", label: "AI", icon: Sparkles },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/more", label: "More", icon: BookHeart },
] as const;

export function navItemIsActive(href: string, pathname: string) {
  if (href === "/more") {
    return MOBILE_OVERFLOW.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  }
  if (href === "/daily-love") {
    return pathname === "/daily-love" || pathname.startsWith("/morning") || pathname.startsWith("/night");
  }
  if (href === "/restaurants") {
    return pathname === "/restaurants" || pathname.startsWith("/food");
  }
  if (href === "/messages") {
    return pathname === "/messages" || pathname.startsWith("/assistant/message-studio");
  }
  if (href === "/assistant") {
    return pathname === "/assistant" || (pathname.startsWith("/assistant/") && !pathname.startsWith("/assistant/message-studio"));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
