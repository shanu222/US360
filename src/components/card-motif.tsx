export function CardMotif({
  kind,
  accent,
  light,
}: {
  kind: string;
  accent: string;
  light?: boolean;
}) {
  const stroke = light ? "rgba(255,255,255,0.35)" : accent;
  const fill = light ? "rgba(255,255,255,0.12)" : `${accent}33`;
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 720 960" aria-hidden>
      {kind === "garden" || kind === "flowers" ? (
        <>
          <circle cx="90" cy="820" r="120" fill={fill} />
          <circle cx="640" cy="110" r="90" fill={fill} />
          <path d="M80 860 C140 780, 160 740, 120 680" fill="none" stroke={stroke} strokeWidth="3" />
          <path d="M120 680 C90 650, 150 620, 130 580" fill="none" stroke={stroke} strokeWidth="2" />
          <ellipse cx="118" cy="560" rx="28" ry="16" fill={accent} opacity="0.55" transform="rotate(-20 118 560)" />
          <ellipse cx="148" cy="575" rx="22" ry="13" fill={accent} opacity="0.4" transform="rotate(25 148 575)" />
          <ellipse cx="98" cy="575" rx="22" ry="13" fill={accent} opacity="0.4" transform="rotate(-40 98 575)" />
          <circle cx="122" cy="572" r="8" fill={light ? "#F6E7A8" : accent} />
          <ellipse cx="600" cy="160" rx="36" ry="20" fill={accent} opacity="0.45" />
          <ellipse cx="630" cy="175" rx="24" ry="14" fill={accent} opacity="0.35" />
          <ellipse cx="575" cy="175" rx="24" ry="14" fill={accent} opacity="0.35" />
        </>
      ) : null}
      {kind === "sunrise" || kind === "coral" ? (
        <>
          <circle cx="360" cy="210" r="70" fill={accent} opacity="0.35" />
          <circle cx="360" cy="210" r="42" fill={accent} opacity="0.55" />
          {[0, 30, 60, 90, 120, 150].map((deg) => (
            <line
              key={deg}
              x1="360"
              y1="210"
              x2={360 + Math.cos((deg * Math.PI) / 180) * 130}
              y2={210 + Math.sin((deg * Math.PI) / 180) * 70}
              stroke={stroke}
              strokeWidth="2"
              opacity="0.4"
            />
          ))}
          <path d="M0 720 Q180 640 360 700 T720 660 L720 960 L0 960 Z" fill={fill} />
          <path d="M0 780 Q220 720 400 760 T720 730 L720 960 L0 960 Z" fill={accent} opacity="0.18" />
        </>
      ) : null}
      {kind === "night" || kind === "moon" || kind === "stars" || kind === "dreamy" ? (
        <>
          <circle cx="560" cy="150" r="54" fill={accent} opacity="0.55" />
          <circle cx="540" cy="140" r="46" fill={light ? "rgba(20,24,40,0.35)" : "rgba(255,255,255,0.08)"} />
          {[
            [90, 120],
            [160, 80],
            [220, 160],
            [80, 240],
            [640, 280],
            [500, 80],
            [300, 70],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill={accent} opacity="0.8" />
          ))}
          <path d="M0 820 C160 760, 280 800, 360 780 C500 750, 620 800, 720 770 L720 960 L0 960 Z" fill={fill} />
        </>
      ) : null}
      {kind === "aurora" || kind === "ruby" ? (
        <>
          <path d="M0 180 C160 80, 280 240, 420 120 C560 20, 640 180, 720 90 L720 0 L0 0 Z" fill={fill} />
          <path d="M0 260 C200 140, 340 300, 520 180 C620 110, 700 220, 720 160" fill="none" stroke={stroke} strokeWidth="8" opacity="0.35" />
          <path d="M0 880 C180 800, 360 860, 540 790 C640 750, 700 820, 720 800 L720 960 L0 960 Z" fill={accent} opacity="0.2" />
        </>
      ) : null}
      {kind === "nature" || kind === "seasonal" ? (
        <>
          <path d="M80 820 C80 700, 180 700, 180 820" fill={fill} />
          <path d="M140 700 C90 640, 70 560, 140 500 C210 560, 190 640, 140 700 Z" fill={accent} opacity="0.35" />
          <path d="M560 860 C560 720, 680 720, 680 860" fill={fill} />
          <path d="M620 720 C560 650, 540 560, 620 490 C700 560, 680 650, 620 720 Z" fill={accent} opacity="0.28" />
          <circle cx="360" cy="140" r="36" fill={accent} opacity="0.25" />
        </>
      ) : null}
      {kind === "luxury" || kind === "champagne" || kind === "marble" ? (
        <>
          <rect x="48" y="48" width="624" height="864" rx="28" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.45" />
          <rect x="64" y="64" width="592" height="832" rx="22" fill="none" stroke={stroke} strokeWidth="0.6" opacity="0.3" />
          <circle cx="360" cy="110" r="18" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.6" />
          <path d="M330 110 H390 M360 80 V140" stroke={accent} strokeWidth="1" opacity="0.5" />
        </>
      ) : null}
      {kind === "city" || kind === "night-city" ? (
        <>
          {[80, 140, 200, 270, 340, 410, 480, 550, 620].map((x, i) => (
            <rect key={x} x={x} y={720 - (40 + (i % 5) * 36)} width="42" height={240} fill={fill} />
          ))}
          <circle cx="520" cy="160" r="28" fill={accent} opacity="0.45" />
        </>
      ) : null}
      {kind === "lantern" ? (
        <>
          <rect x="250" y="120" width="80" height="110" rx="12" fill={fill} />
          <path d="M250 140 H330 M250 210 H330" stroke={stroke} strokeWidth="2" opacity="0.5" />
          <circle cx="290" cy="175" r="18" fill={accent} opacity="0.45" />
          <path d="M270 230 L290 250 L310 230" fill="none" stroke={stroke} strokeWidth="2" />
          <circle cx="120" cy="200" r="10" fill={accent} opacity="0.35" />
          <circle cx="560" cy="240" r="12" fill={accent} opacity="0.3" />
          <path d="M0 780 C180 700, 360 820, 720 720 L720 960 L0 960 Z" fill={fill} />
        </>
      ) : null}
      {kind === "meadow" ? (
        <>
          <path d="M0 720 Q180 640 360 700 T720 660 L720 960 L0 960 Z" fill={fill} />
          {[90, 160, 240, 480, 560, 640].map((x) => (
            <g key={x}>
              <path d={`M${x} 780 C${x} 730, ${x + 10} 710, ${x} 680`} fill="none" stroke={stroke} strokeWidth="2" />
              <ellipse cx={x} cy="668" rx="16" ry="10" fill={accent} opacity="0.5" />
              <ellipse cx={x - 12} cy="676" rx="12" ry="8" fill={accent} opacity="0.35" />
              <ellipse cx={x + 12} cy="676" rx="12" ry="8" fill={accent} opacity="0.35" />
            </g>
          ))}
        </>
      ) : null}
      {kind === "ocean" ? (
        <>
          <path d="M0 640 C120 600, 200 680, 320 640 C440 600, 520 680, 720 630 L720 960 L0 960 Z" fill={fill} />
          <path d="M0 700 C140 660, 260 740, 400 700 C540 660, 640 740, 720 690" fill="none" stroke={stroke} strokeWidth="3" opacity="0.4" />
          <circle cx="560" cy="180" r="48" fill={accent} opacity="0.35" />
        </>
      ) : null}
    </svg>
  );
}

export function motifForTheme(id: string) {
  if (["flowers", "garden", "romantic-scenery"].includes(id)) return "garden";
  if (["sunrise", "coral", "coffee"].includes(id)) return "sunrise";
  if (["moon", "stars", "dreamy", "cozy-room"].includes(id)) return "night";
  if (["aurora", "ruby"].includes(id)) return "aurora";
  if (["nature", "seasonal"].includes(id)) return "nature";
  if (["meadow"].includes(id)) return "meadow";
  if (["minimal-luxury", "champagne", "marble", "gold-leaf"].includes(id)) return "luxury";
  if (["night-city"].includes(id)) return "city";
  if (["lantern"].includes(id)) return "lantern";
  if (["ocean", "dusk-rose"].includes(id)) return "ocean";
  return "garden";
}
