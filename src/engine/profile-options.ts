export const PROFILE_OPTIONS = {
  personality: [
    "Kind",
    "Quiet",
    "Outgoing",
    "Funny",
    "Sensitive",
    "Practical",
    "Romantic",
    "Independent",
    "Family-oriented",
    "Ambitious",
  ],
  communication: [
    "Short messages",
    "Romantic",
    "Funny",
    "Emotional",
    "Simple",
    "Playful",
    "Formal",
    "Voice notes",
    "Calls over text",
  ],
  makes_happy: [
    "Thoughtful texts",
    "Quality time",
    "Small surprises",
    "Being listened to",
    "Help with tasks",
    "Compliments",
    "Food together",
    "Walks",
    "Music",
    "Quiet evenings",
  ],
  upsets: [
    "Being ignored",
    "Late replies",
    "Broken plans",
    "Public arguments",
    "Feeling rushed",
    "Feeling unheard",
    "Comparing with others",
    "Jokes about family",
  ],
  calms: [
    "Space and time",
    "A calm talk",
    "A hug",
    "A walk",
    "Chai and quiet",
    "Music",
    "An apology",
    "Sleep",
    "Being with family",
  ],
  flowers: [
    "Roses",
    "Tulips",
    "Lilies",
    "Sunflowers",
    "Jasmine",
    "Orchids",
    "Peonies",
    "Daisies",
    "Baby's breath",
    "Mixed bouquet",
  ],
  colors: ["Red", "Pink", "Maroon", "White", "Black", "Navy", "Beige", "Gold", "Purple", "Pastels", "Green", "Blue"],
  foods: [
    "Biryani",
    "Karahi",
    "Nihari",
    "Tikka",
    "BBQ",
    "Haleem",
    "Chaat",
    "Burgers",
    "Pizza",
    "Pasta",
    "Sushi",
    "Chinese",
    "Brownies",
    "Ice cream",
  ],
  songs: ["Romantic songs", "Sad songs", "Calm / lo-fi", "Bollywood", "Pakistani songs", "English pop", "Qawwali", "Instrumental"],
  movies: [
    "Romantic",
    "Comedy",
    "Drama",
    "Action",
    "Thriller",
    "Bollywood",
    "Hollywood",
    "Pakistani dramas",
    "Animated",
    "Documentaries",
  ],
  activities: [
    "Walk",
    "Cafe",
    "Movies",
    "Drive",
    "Hiking",
    "Shopping",
    "Cooking together",
    "Picnic",
    "Board games",
    "Gym",
    "Travel",
    "Photography",
  ],
  places: [
    "Cafe",
    "Park",
    "Lake view",
    "Hill station",
    "Mall",
    "Home",
    "Campus",
    "Margalla Hills",
    "F-9 Park",
    "Food street",
  ],
  gifts: [
    "Handwritten note",
    "Flowers",
    "Dessert",
    "Jewellery",
    "Perfume",
    "Books",
    "Surprise outing",
    "Photo album",
    "Clothes",
    "Something homemade",
  ],
  apology: ["In person", "Short text", "A longer message", "A small gift", "Give space first", "Say it simply"],
  conflict: ["Talk it out", "Needs space first", "Calm and slow", "Dislikes long arguments", "Prefers in person"],
  space: ["Yes", "No"],
  message_length: ["Short", "Medium", "Long"],
  romantic: ["Words", "Acts of care", "Gifts", "Time together", "Touch", "Quiet gestures"],
  humor: ["Playful", "Dry", "Memes", "Teasing", "Gentle", "Does not like teasing"],
  cuisines: [
    "Pakistani",
    "Chinese",
    "Italian",
    "Japanese",
    "Thai",
    "Afghan",
    "BBQ",
    "Burgers",
    "Pizza",
    "Seafood",
    "Cafe food",
    "Desserts",
  ],
  dishes: [
    "Biryani",
    "Karahi",
    "Nihari",
    "Tikka",
    "Seekh kebab",
    "Haleem",
    "Chaat",
    "Burgers",
    "Pizza",
    "Pasta",
    "Sushi",
    "Dumplings",
    "Steak",
    "Salad",
  ],
  restaurants: ["Local cafe", "Desi restaurant", "Fast food", "Fine dining", "Outdoor seating", "Family restaurant", "Food court"],
  drinks: ["Chai", "Coffee", "Fresh juice", "Lassi", "Mocktail", "Water", "Soft drink", "Smoothie"],
  desserts: ["Brownie", "Ice cream", "Kheer", "Gulab jamun", "Cake", "Rabri", "Cheesecake", "Donuts"],
  food_dislikes: ["Very spicy", "Too oily", "Seafood", "Organ meat", "Olives", "Coriander", "Onions", "Mushrooms"],
  allergies: ["Nuts", "Peanuts", "Dairy", "Gluten", "Eggs", "Seafood", "Soy", "None shared"],
  spice: ["Mild", "Medium", "Hot"],
  diet: ["Vegetarian", "Non-vegetarian", "Vegan", "No preference"],
  budget: ["Low", "Medium", "High"],
  dining_env: ["Quiet", "Romantic", "Casual", "Outdoor", "Family", "Cafe", "Fine dining"],
  dislikes: ["Being ignored", "Late replies", "Very spicy food", "Crowded places", "Last-minute plans"],
} as const;

export type ProfileOptionsKey = keyof typeof PROFILE_OPTIONS;

const FAVORITE_OPTION_KEYS: Record<string, ProfileOptionsKey> = {
  colors: "colors",
  flowers: "flowers",
  foods: "foods",
  drinks: "drinks",
  movies: "movies",
  music: "songs",
  hobbies: "activities",
  places: "places",
  activities: "activities",
  gifts: "gifts",
  appreciates: "makes_happy",
};

export function optionsFor(key?: string | null): string[] {
  if (!key) return [];
  if (key in PROFILE_OPTIONS) return [...PROFILE_OPTIONS[key as ProfileOptionsKey]];
  return [];
}

export function optionsForFavoriteCategory(category: string): string[] {
  return optionsFor(FAVORITE_OPTION_KEYS[category] ?? category);
}

export function parseList(value?: string | null): string[] {
  if (!value?.trim()) return [];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const part of value.split(/[,;\n]+/)) {
    const item = part.trim();
    if (!item) continue;
    const id = item.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    items.push(item);
  }
  return items;
}

export function joinList(items: string[]): string {
  return items.map((item) => item.trim()).filter(Boolean).join(", ");
}

export function isSelected(items: string[], option: string): boolean {
  const id = option.trim().toLowerCase();
  return items.some((item) => item.toLowerCase() === id);
}

export function addItems(items: string[], incoming: string | string[], multiple: boolean): string[] {
  const next = multiple ? [...items] : [];
  const seen = new Set(next.map((item) => item.toLowerCase()));
  const parts = Array.isArray(incoming) ? incoming : parseList(incoming);
  for (const part of parts) {
    const item = part.trim();
    if (!item) continue;
    const id = item.toLowerCase();
    if (seen.has(id)) continue;
    if (!multiple) return [item];
    seen.add(id);
    next.push(item);
  }
  return next;
}

export function removeItem(items: string[], option: string): string[] {
  const id = option.trim().toLowerCase();
  return items.filter((item) => item.toLowerCase() !== id);
}

export function toggleItem(items: string[], option: string, multiple: boolean): string[] {
  if (isSelected(items, option)) return removeItem(items, option);
  return addItems(items, option, multiple);
}

export function extrasNotInOptions(items: string[], options: readonly string[]): string[] {
  return items.filter((item) => !options.some((option) => option.toLowerCase() === item.toLowerCase()));
}
