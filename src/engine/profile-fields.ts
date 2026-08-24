import { voiceFor, type PartnerVoice } from "@/lib/voice";

type FieldDef = {
  key: string;
  group: string;
  label: (v: PartnerVoice) => string;
};

const FIELD_DEFS: FieldDef[] = [
  { key: "personality", group: "about", label: () => "Personality / preferences" },
  { key: "communication_style", group: "about", label: () => "Communication style" },
  { key: "makes_happy", group: "about", label: (v) => `Things that make ${v.them} happy` },
  { key: "upsets", group: "about", label: (v) => `Things that upset ${v.them}` },
  { key: "calms", group: "about", label: (v) => `Things that calm ${v.them}` },
  { key: "flowers", group: "favorites", label: () => "Favorite flowers" },
  { key: "colors", group: "favorites", label: () => "Favorite colors" },
  { key: "foods", group: "favorites", label: () => "Favorite foods" },
  { key: "songs", group: "favorites", label: () => "Favorite songs" },
  { key: "movies", group: "favorites", label: () => "Favorite movies" },
  { key: "activities", group: "favorites", label: () => "Favorite activities" },
  { key: "places", group: "favorites", label: () => "Favorite places" },
  { key: "gifts", group: "favorites", label: () => "Favorite gifts" },
  { key: "apology_style", group: "conflict", label: (v) => `How ${v.they} prefers apologies` },
  { key: "conflict_style", group: "conflict", label: () => "Communication during conflict" },
  { key: "wants_space", group: "conflict", label: () => "Likes space after an argument (yes/no)" },
  { key: "message_length", group: "conflict", label: () => "Preferred message length (short/medium/long)" },
  { key: "romantic_style", group: "style", label: () => "Preferred romantic style" },
  { key: "humor", group: "style", label: () => "Preferred humor" },
  { key: "memories_note", group: "history", label: () => "Important memories" },
  { key: "promises_note", group: "history", label: () => "Important promises" },
  { key: "current_goals", group: "now", label: () => "Current goals" },
  { key: "current_concerns", group: "now", label: () => "Current concerns" },
  { key: "partner_instagram", group: "send", label: (v) => `${v.Their} Instagram username (for Send)` },
  { key: "partner_whatsapp", group: "send", label: (v) => `${v.Their} WhatsApp number with country code` },
  { key: "partner_facebook", group: "send", label: (v) => `${v.Their} Facebook or Messenger username` },
  { key: "partner_email", group: "send", label: (v) => `${v.Their} email address` },
  { key: "user_city", group: "city", label: () => "Your city (no home address — e.g. Islamabad)" },
  { key: "partner_cuisines", group: "food", label: (v) => `${v.Their} favorite cuisines` },
  { key: "partner_dishes", group: "food", label: (v) => `${v.Their} favorite dishes` },
  { key: "partner_restaurants", group: "food", label: (v) => `${v.Their} favorite restaurants` },
  { key: "partner_drinks", group: "food", label: (v) => `${v.Their} favorite drinks` },
  { key: "partner_desserts", group: "food", label: (v) => `${v.Their} favorite desserts` },
  { key: "partner_food_dislikes", group: "food", label: (v) => `Foods ${v.they} dislikes` },
  { key: "partner_allergies", group: "food", label: (v) => `Allergies or diet notes ${v.they} shared` },
  { key: "partner_spice", group: "food", label: (v) => `${v.Their} spice preference` },
  { key: "partner_diet", group: "food", label: () => "Vegetarian / non-vegetarian preference" },
  { key: "partner_budget", group: "food", label: () => "Preferred dining budget (low / medium / high)" },
  { key: "partner_dining_env", group: "food", label: () => "Preferred dining environment" },
  { key: "user_cuisines", group: "food", label: () => "Your favorite cuisines" },
  { key: "user_dishes", group: "food", label: () => "Your favorite dishes" },
  { key: "user_drinks", group: "food", label: () => "Your favorite drinks" },
  { key: "user_desserts", group: "food", label: () => "Your favorite desserts" },
  { key: "user_food_dislikes", group: "food", label: () => "Foods you dislike" },
  { key: "user_budget", group: "food", label: () => "Your dining budget (low / medium / high)" },
];

export function profileFields(partnerGender?: string | null) {
  const v = voiceFor(partnerGender);
  return FIELD_DEFS.map((field) => ({
    key: field.key,
    group: field.group,
    label: field.label(v),
  }));
}

export const PROFILE_FIELDS = profileFields("female");

export type ProfileKey = (typeof FIELD_DEFS)[number]["key"];
