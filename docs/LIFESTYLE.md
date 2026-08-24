# City food, restaurants, and places

US360 can suggest restaurants and visiting places from **your city only**. It does not ask for a home address and does not track GPS.

## How to use it

1. Set **Your city** on Profile or during onboarding (Islamabad, Lahore, Karachi, …).
2. Fill food likes for her and for you (cuisines, dishes, budget).
3. Ask the Assistant or Explore page:
   - “What should we eat tonight?”
   - “Suggest a restaurant.”
   - “What should we visit in Islamabad?”
   - “Plan a date for us.”
   - “What should we do today?”

## What the score uses

City, time of day, opening hours when known, cuisine/dish likes, chat food mentions, saved/liked places, previous visits, budget, occasion, and relationship context (for example a calmer plan before an exam).

Every result explains **why**, and shows freshness:

- **verified** — live API (Google Places or Foursquare) when you configured a key
- **catalog** — built-in city list (not claimed as live)
- **user** — something you saved

OpenStreetMap Overpass is used as a public fallback. The app does not scrape restaurant websites.

## Live APIs (optional)

```
GOOGLE_PLACES_API_KEY=
FOURSQUARE_API_KEY=
```

Weather uses Open-Meteo (no key). Directions open Google Maps with a search query.

## Chat import

Mentions such as “I really want to try that Japanese restaurant” appear on Explore for you to **Save** or **Add to calendar**. Nothing is stored as a plan until you confirm.

## Privacy

City only. No automatic home address. No secret GPS.
