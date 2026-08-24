import {
  Brain,
  CalendarDays,
  Clapperboard,
  Home,
  Lightbulb,
  MessageCircleHeart,
  Settings,
  Sparkles,
  Sun,
  BookHeart,
} from "lucide-react";

export const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/daily-love", label: "Daily Love", icon: Sun },
  { href: "/memory", label: "Memory", icon: BookHeart },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/reels", label: "Reels", icon: Clapperboard },
  { href: "/cards", label: "Cards", icon: MessageCircleHeart },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/insights", label: "Insights", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const MOBILE_NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/assistant", label: "AI", icon: Sparkles },
  { href: "/daily-love", label: "Daily", icon: Sun },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/more", label: "More", icon: BookHeart },
] as const;
