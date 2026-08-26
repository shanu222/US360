import {
  Brain,
  CalendarDays,
  Clapperboard,
  Home,
  Lightbulb,
  MapPin,
  MessageCircleHeart,
  Moon,
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
  { href: "/assistant", label: "Help", icon: Sparkles },
  { href: "/reels", label: "Reels", icon: Clapperboard },
  { href: "/morning", label: "Good morning", icon: Sun },
  { href: "/night", label: "Good night", icon: Moon },
  { href: "/food", label: "Food", icon: UtensilsCrossed },
  { href: "/explore", label: "Explore", icon: MapPin },
  { href: "/more", label: "More", icon: BookHeart },
] as const;

export const MORE_NAV = [
  { href: "/daily-love", label: "Daily Love", icon: Sun },
  { href: "/memory", label: "Memory", icon: BookHeart },
  { href: "/profile", label: "Profile", icon: HeartHandshake },
  { href: "/timeline", label: "Timeline", icon: History },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/cards", label: "Cards", icon: MessageCircleHeart },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/insights", label: "Insights", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const MORE_HREFS = MORE_NAV.map((item) => item.href);

export const MOBILE_NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/assistant", label: "Help", icon: Sparkles },
  { href: "/reels", label: "Reels", icon: Clapperboard },
  { href: "/food", label: "Food", icon: UtensilsCrossed },
  { href: "/more", label: "More", icon: BookHeart },
] as const;
