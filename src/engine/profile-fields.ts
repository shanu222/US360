import { voiceFor, type PartnerVoice } from "@/lib/voice";
import type { ProfileOptionsKey } from "@/engine/profile-options";

export type FieldKind = "text" | "textarea" | "chips" | "choice" | "city";

type FieldDef = {
  key: string;
  group: string;
  kind: FieldKind;
  optionsKey?: ProfileOptionsKey;
  label: (v: PartnerVoice) => string;
};

const FIELD_DEFS: FieldDef[] = [
  { key: "personality", group: "about", kind: "chips", optionsKey: "personality", label: () => "Personality / preferences" },
  { key: "communication_style", group: "about", kind: "chips", optionsKey: "communication", label: () => "Communication style" },
  { key: "makes_happy", group: "about", kind: "chips", optionsKey: "makes_happy", label: (v) => `Things that make ${v.them} happy` },
  { key: "upsets", group: "about", kind: "chips", optionsKey: "upsets", label: (v) => `Things that upset ${v.them}` },
  { key: "calms", group: "about", kind: "chips", optionsKey: "calms", label: (v) => `Things that calm ${v.them}` },
  { key: "flowers", group: "favorites", kind: "chips", optionsKey: "flowers", label: () => "Favorite flowers" },
  { key: "colors", group: "favorites", kind: "chips", optionsKey: "colors", label: () => "Favorite colors" },
  { key: "foods", group: "favorites", kind: "chips", optionsKey: "foods", label: () => "Favorite foods" },
  { key: "songs", group: "favorites", kind: "chips", optionsKey: "songs", label: () => "Favorite songs" },
  { key: "movies", group: "favorites", kind: "chips", optionsKey: "movies", label: () => "Favorite movies" },
  { key: "activities", group: "favorites", kind: "chips", optionsKey: "activities", label: () => "Favorite activities" },
  { key: "places", group: "favorites", kind: "chips", optionsKey: "places", label: () => "Favorite places" },
  { key: "gifts", group: "favorites", kind: "chips", optionsKey: "gifts", label: () => "Favorite gifts" },
  { key: "apology_style", group: "conflict", kind: "chips", optionsKey: "apology", label: (v) => `How ${v.they} prefers apologies` },
  { key: "conflict_style", group: "conflict", kind: "chips", optionsKey: "conflict", label: () => "Communication during conflict" },
  { key: "wants_space", group: "conflict", kind: "choice", optionsKey: "space", label: () => "Likes space after an argument" },
  { key: "message_length", group: "conflict", kind: "choice", optionsKey: "message_length", label: () => "Preferred message length" },
  { key: "romantic_style", group: "style", kind: "chips", optionsKey: "romantic", label: () => "Preferred romantic style" },
  { key: "humor", group: "style", kind: "chips", optionsKey: "humor", label: () => "Preferred humor" },
  { key: "memories_note", group: "history", kind: "textarea", label: () => "Important memories" },
  { key: "promises_note", group: "history", kind: "textarea", label: () => "Important promises" },
  { key: "current_goals", group: "now", kind: "textarea", label: () => "Current goals" },
  { key: "current_concerns", group: "now", kind: "textarea", label: () => "Current concerns" },
  { key: "partner_instagram", group: "send", kind: "text", label: (v) => `${v.Their} Instagram username (for Send)` },
  { key: "partner_whatsapp", group: "send", kind: "text", label: (v) => `${v.Their} WhatsApp number with country code` },
  { key: "partner_facebook", group: "send", kind: "text", label: (v) => `${v.Their} Facebook or Messenger username` },
  { key: "partner_email", group: "send", kind: "text", label: (v) => `${v.Their} email address` },
  { key: "user_city", group: "city", kind: "city", label: () => "Your city (no home address — e.g. Islamabad)" },
  { key: "partner_cuisines", group: "food", kind: "chips", optionsKey: "cuisines", label: (v) => `${v.Their} favorite cuisines` },
  { key: "partner_dishes", group: "food", kind: "chips", optionsKey: "dishes", label: (v) => `${v.Their} favorite dishes` },
  { key: "partner_restaurants", group: "food", kind: "chips", optionsKey: "restaurants", label: (v) => `${v.Their} favorite restaurants` },
  { key: "partner_drinks", group: "food", kind: "chips", optionsKey: "drinks", label: (v) => `${v.Their} favorite drinks` },
  { key: "partner_desserts", group: "food", kind: "chips", optionsKey: "desserts", label: (v) => `${v.Their} favorite desserts` },
  { key: "partner_food_dislikes", group: "food", kind: "chips", optionsKey: "food_dislikes", label: (v) => `Foods ${v.they} dislikes` },
  { key: "partner_allergies", group: "food", kind: "chips", optionsKey: "allergies", label: (v) => `Allergies or diet notes ${v.they} shared` },
  { key: "partner_spice", group: "food", kind: "choice", optionsKey: "spice", label: (v) => `${v.Their} spice preference` },
  { key: "partner_diet", group: "food", kind: "choice", optionsKey: "diet", label: () => "Vegetarian / non-vegetarian preference" },
  { key: "partner_budget", group: "food", kind: "choice", optionsKey: "budget", label: () => "Preferred dining budget" },
  { key: "partner_dining_env", group: "food", kind: "chips", optionsKey: "dining_env", label: () => "Preferred dining environment" },
  { key: "user_cuisines", group: "food", kind: "chips", optionsKey: "cuisines", label: () => "Your favorite cuisines" },
  { key: "user_dishes", group: "food", kind: "chips", optionsKey: "dishes", label: () => "Your favorite dishes" },
  { key: "user_drinks", group: "food", kind: "chips", optionsKey: "drinks", label: () => "Your favorite drinks" },
  { key: "user_desserts", group: "food", kind: "chips", optionsKey: "desserts", label: () => "Your favorite desserts" },
  { key: "user_food_dislikes", group: "food", kind: "chips", optionsKey: "food_dislikes", label: () => "Foods you dislike" },
  { key: "user_budget", group: "food", kind: "choice", optionsKey: "budget", label: () => "Your dining budget" },
];

export function profileFields(partnerGender?: string | null) {
  const v = voiceFor(partnerGender);
  return FIELD_DEFS.map((field) => ({
    key: field.key,
    group: field.group,
    kind: field.kind,
    optionsKey: field.optionsKey,
    label: field.label(v),
  }));
}

export const PROFILE_FIELDS = profileFields("female");

export type ProfileKey = (typeof FIELD_DEFS)[number]["key"];
