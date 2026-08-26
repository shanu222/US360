import { voiceFor } from "@/lib/voice";

export type CommandFocus = "moment" | "food" | "places" | "reel" | "assistant";

export function examplesForFocus(focus: CommandFocus, partnerGender?: string | null) {
  const v = voiceFor(partnerGender ?? "female");
  if (focus === "food") {
    return [
      { label: "Tonight", command: "What should we eat tonight?" },
      { label: "Cheap", command: "Suggest a cheap restaurant." },
      { label: "Romantic", command: "Suggest a romantic restaurant." },
      { label: "Biryani", command: "What should we eat? Biryani." },
      { label: "Chinese", command: "Suggest a Chinese restaurant." },
      { label: "Burgers", command: "Find a good burger place." },
      { label: "Dessert", command: "What dessert should we get?" },
      { label: "Lunch", command: "What should we eat for lunch?" },
      { label: "F-10", command: "What should we eat in F-10?" },
    ];
  }
  if (focus === "places") {
    return [
      { label: "Visit", command: "What should we visit?" },
      { label: "Date", command: "Plan a date for us." },
      { label: "Outdoor", command: "Suggest outdoor places to visit." },
      { label: "Quiet", command: "Suggest a quiet place to go." },
      { label: "Cafe", command: "Suggest a cafe to visit." },
      { label: "Park", command: "What park should we visit?" },
      { label: "Today", command: "What should we do today?" },
      { label: "Weekend", command: "What can we do this weekend?" },
    ];
  }
  if (focus === "reel") {
    return [
      { label: "Something nice", command: `Find something nice to send ${v.them}.` },
      { label: `${v.They} is sad`, command: `${v.They} is sad today. Find a Reel.` },
      { label: "Make them smile", command: `I want to make ${v.them} smile. Find a Reel.` },
      { label: "After a fight", command: "We just had a fight. Find a Reel only if it fits." },
    ];
  }
  if (focus === "assistant") {
    return [
      { label: "With her now", command: `I am with ${v.them} right now. What should we eat?` },
      { label: "Eat in F-10", command: "What should we eat in F-10?" },
      { label: "This morning", command: "What should we eat this morning?" },
      { label: `${v.They} is angry`, command: `${v.They} is angry because of what happened earlier. What should I do?` },
      { label: "Exam tomorrow", command: `${v.They} has an exam tomorrow. What should I prepare for ${v.them}?` },
      { label: "Restaurant", command: `What restaurant would ${v.they} like?` },
      { label: "Tonight", command: "Where should we go tonight?" },
      { label: "Create something", command: `Create something nice for ${v.them}.` },
      { label: "What to send", command: `What should I send ${v.them}?` },
    ];
  }
  return [
    { label: `${v.They} is angry`, command: `${v.They} is angry.` },
    { label: `${v.They} is sad`, command: `${v.They} is sad today.` },
    { label: `${v.They} is stressed`, command: `${v.They} is stressed.` },
    { label: "Should I apologize?", command: "Should I apologize?" },
    { label: "We had a fight", command: "We just had a fight." },
    { label: "Exam tomorrow", command: `${v.They} has an exam tomorrow.` },
    { label: "Make them smile", command: `I want to make ${v.them} smile.` },
  ];
}

export function expandCommand(text: string, focus: CommandFocus) {
  const raw = text.trim();
  if (!raw) return raw;
  if (focus === "food" && !/\b(eat|restaurant|dinner|lunch|food|order|dessert|biryani|burger|cuisine|f-?\d+)\b/i.test(raw)) {
    return `What should we eat tonight? ${raw}`;
  }
  if (focus === "places" && !/\b(visit|place|go out|date|park|explore|cafe|outdoor|weekend|today)\b/i.test(raw)) {
    return `What should we visit? ${raw}`;
  }
  if (focus === "reel" && !/\breel\b/i.test(raw)) {
    return `${raw} Find a Reel if it actually fits.`;
  }
  return raw;
}

export function focusCopy(focus: CommandFocus) {
  if (focus === "food") {
    return {
      kicker: "Restaurants",
      title: "What should we eat?",
      description: "Tap a mood, cuisine, or area. Likes stay in the background.",
      submit: "Suggest food",
      placeholder: "Or write a dish, cuisine, or area such as F-10…",
    };
  }
  if (focus === "places") {
    return {
      kicker: "Explore",
      title: "Where should we go?",
      description: "Tap a kind of outing. City and likes stay in the background.",
      submit: "Suggest places",
      placeholder: "Or write a place or city…",
    };
  }
  if (focus === "reel") {
    return {
      kicker: "Reels",
      title: "What should I send?",
      description: "Tap the moment. A Reel is suggested only when it fits.",
      submit: "Find a Reel",
      placeholder: "Or describe the moment…",
    };
  }
  if (focus === "assistant") {
    return {
      kicker: "AI Assistant",
      title: "Ask anything in one place",
      description: "Food, a moment, an exam, or what to send. Saved profile, memory, calendar, and chat history are used in the background.",
      submit: "Ask",
      placeholder: "I am with her right now in F-10. What should we eat?",
    };
  }
  return {
    kicker: "Help",
    title: "What should I do?",
    description: "Tap how they feel, or write one sentence.",
    submit: "Help me",
    placeholder: "Or describe the moment in one sentence…",
  };
}
