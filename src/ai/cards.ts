export interface CardTheme {
  id: string;
  label: string;
  category: "GOOD_MORNING" | "GOOD_NIGHT" | "ROMANTIC" | "GENERAL";
  background: string;
  overlay: string;
  text: string;
  accent: string;
}

export const CARD_THEMES: CardTheme[] = [
  {
    id: "sunrise",
    label: "Sunrise",
    category: "GOOD_MORNING",
    background: "linear-gradient(160deg, #F6E3C8 0%, #E8B298 45%, #C9897A 100%)",
    overlay: "rgba(255,255,255,0.18)",
    text: "#3A2A24",
    accent: "#8C4A3A",
  },
  {
    id: "coffee",
    label: "Coffee",
    category: "GOOD_MORNING",
    background: "linear-gradient(165deg, #EFE6DC 0%, #D7C2A8 50%, #8D6E56 100%)",
    overlay: "rgba(255,248,240,0.2)",
    text: "#2C2118",
    accent: "#6B4A32",
  },
  {
    id: "flowers",
    label: "Flowers",
    category: "GENERAL",
    background: "linear-gradient(150deg, #F7EEE8 0%, #E8C9C4 48%, #C9A3A8 100%)",
    overlay: "rgba(255,255,255,0.22)",
    text: "#3D2C32",
    accent: "#8A5560",
  },
  {
    id: "nature",
    label: "Nature",
    category: "GENERAL",
    background: "linear-gradient(160deg, #E7EFE6 0%, #C5D5C0 50%, #7F9A84 100%)",
    overlay: "rgba(255,255,255,0.16)",
    text: "#243028",
    accent: "#4F6B55",
  },
  {
    id: "minimal-luxury",
    label: "Minimal luxury",
    category: "GENERAL",
    background: "linear-gradient(180deg, #F7F3EC 0%, #E6DCCF 100%)",
    overlay: "rgba(255,255,255,0.3)",
    text: "#2A2520",
    accent: "#8A6A4B",
  },
  {
    id: "romantic-scenery",
    label: "Romantic scenery",
    category: "ROMANTIC",
    background: "linear-gradient(155deg, #F3E6E4 0%, #D9B6B8 46%, #8E5B6A 100%)",
    overlay: "rgba(255,255,255,0.14)",
    text: "#2F2228",
    accent: "#7A4454",
  },
  {
    id: "moon",
    label: "Moon",
    category: "GOOD_NIGHT",
    background: "linear-gradient(165deg, #1C2433 0%, #2C3A52 50%, #5A6B88 100%)",
    overlay: "rgba(255,255,255,0.06)",
    text: "#F4EFE6",
    accent: "#D6C3A4",
  },
  {
    id: "stars",
    label: "Stars",
    category: "GOOD_NIGHT",
    background: "linear-gradient(180deg, #12151C 0%, #242A3A 60%, #3C4458 100%)",
    overlay: "rgba(255,255,255,0.05)",
    text: "#F7F1E6",
    accent: "#C9B48A",
  },
  {
    id: "night-city",
    label: "Night city",
    category: "GOOD_NIGHT",
    background: "linear-gradient(150deg, #1A1E2A 0%, #2E3148 45%, #6A5470 100%)",
    overlay: "rgba(0,0,0,0.15)",
    text: "#F6EFE6",
    accent: "#E0C4B0",
  },
  {
    id: "cozy-room",
    label: "Cozy room",
    category: "GOOD_NIGHT",
    background: "linear-gradient(160deg, #3A2A22 0%, #6A4636 50%, #C49A72 100%)",
    overlay: "rgba(255,255,255,0.08)",
    text: "#FFF6EA",
    accent: "#E8C9A4",
  },
  {
    id: "dreamy",
    label: "Dreamy scenery",
    category: "GOOD_NIGHT",
    background: "linear-gradient(145deg, #2A2540 0%, #4C3F68 50%, #A88BB0 100%)",
    overlay: "rgba(255,255,255,0.1)",
    text: "#F8F2EA",
    accent: "#E6C9D4",
  },
  {
    id: "seasonal",
    label: "Seasonal",
    category: "GENERAL",
    background: "linear-gradient(160deg, #F4EFE4 0%, #D9C3A8 48%, #A98462 100%)",
    overlay: "rgba(255,255,255,0.18)",
    text: "#33281F",
    accent: "#7A5A3A",
  },
  {
    id: "aurora",
    label: "Aurora",
    category: "ROMANTIC",
    background: "linear-gradient(145deg, #1B1030 0%, #5B2A6B 42%, #E08BB4 100%)",
    overlay: "rgba(255,255,255,0.12)",
    text: "#FFF6F0",
    accent: "#F6D48A",
  },
  {
    id: "ruby",
    label: "Ruby dusk",
    category: "ROMANTIC",
    background: "linear-gradient(160deg, #3A1020 0%, #9A3048 48%, #F0A07A 100%)",
    overlay: "rgba(255,255,255,0.1)",
    text: "#FFF4EC",
    accent: "#FFD7B0",
  },
  {
    id: "coral",
    label: "Coral morning",
    category: "GOOD_MORNING",
    background: "linear-gradient(155deg, #FFE4D6 0%, #FFB4A2 45%, #E07A7A 100%)",
    overlay: "rgba(255,255,255,0.22)",
    text: "#3A1E1C",
    accent: "#8C3038",
  },
  {
    id: "champagne",
    label: "Champagne",
    category: "GENERAL",
    background: "linear-gradient(180deg, #FFF6E8 0%, #F0D4A8 50%, #C9A06A 100%)",
    overlay: "rgba(255,255,255,0.28)",
    text: "#3A2C1C",
    accent: "#8A6030",
  },
];

export function pickTheme(category: string, recentThemeIds: string[] = []) {
  const pool = CARD_THEMES.filter((t) => {
    if (recentThemeIds.includes(t.id)) return false;
    if (category === "GOOD_MORNING") return t.category === "GOOD_MORNING" || t.category === "GENERAL";
    if (category === "GOOD_NIGHT") return t.category === "GOOD_NIGHT" || t.category === "GENERAL";
    if (category === "ROMANTIC") return t.category === "ROMANTIC" || t.category === "GENERAL";
    return true;
  });
  return pool[Math.floor(Math.random() * Math.max(pool.length, 1))] ?? CARD_THEMES[4];
}

export function renderCardHtml(opts: {
  message: string;
  themeId: string;
  partnerName?: string;
  occasion?: string;
}) {
  const theme = CARD_THEMES.find((t) => t.id === opts.themeId) ?? CARD_THEMES[4];
  const safe = escapeHtml(opts.message);
  const kicker = escapeHtml(opts.occasion || theme.label);
  const who = opts.partnerName ? escapeHtml(opts.partnerName) : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Outfit:wght@300;400;500&display=swap');
      html, body { margin: 0; padding: 0; }
      .card {
        width: 720px; height: 960px;
        background: ${theme.background};
        color: ${theme.text};
        display: flex; align-items: center; justify-content: center;
        font-family: Outfit, sans-serif;
        position: relative; overflow: hidden;
      }
      .blob-a { position:absolute; width:420px; height:420px; border-radius:50%; filter:blur(40px); opacity:.35; background:${theme.accent}; top:-80px; right:-60px; }
      .blob-b { position:absolute; width:320px; height:320px; border-radius:50%; filter:blur(36px); opacity:.28; background:#fff; bottom:-70px; left:-50px; }
      .spark { position:absolute; width:8px; height:8px; border-radius:50%; background:${theme.accent}; opacity:.7; }
      .veil { position: absolute; inset: 36px; border: 1px solid ${theme.overlay}; border-radius: 36px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); }
      .inner { position: relative; z-index: 1; padding: 72px 56px; text-align: center; max-width: 560px; }
      .kicker { letter-spacing: 0.34em; text-transform: uppercase; font-size: 11px; opacity: 0.82; margin-bottom: 28px; font-weight: 500; }
      .msg { font-family: 'Cormorant Garamond', serif; font-size: 46px; line-height: 1.22; font-weight: 600; text-wrap: pretty; }
      .rule { width: 72px; height: 1px; margin: 32px auto; background: ${theme.accent}; opacity: .7; }
      .name { font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: ${theme.accent}; }
      .brand { position:absolute; bottom:28px; left:0; right:0; text-align:center; font-size:10px; letter-spacing:.32em; text-transform:uppercase; opacity:.45; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="blob-a"></div>
      <div class="blob-b"></div>
      <div class="spark" style="top:18%; left:16%"></div>
      <div class="spark" style="top:28%; right:18%"></div>
      <div class="spark" style="bottom:22%; left:22%"></div>
      <div class="veil"></div>
      <div class="inner">
        <div class="kicker">${kicker}</div>
        <div class="msg">${safe}</div>
        <div class="rule"></div>
        ${who ? `<div class="name">For ${who}</div>` : ""}
      </div>
      <div class="brand">US360</div>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
