// bobaImages.ts
// Drop this file anywhere in your project (e.g. lib/bobaImages.ts)
// Usage:  import { getBobaImage } from '@/lib/bobaImages'
//         <div dangerouslySetInnerHTML={{ __html: getBobaImage(item.name) }} />
//   OR as a data-URI on <img src>:
//         <img src={getBobaImageSrc(item.name)} alt={item.name} />

interface DrinkTheme {
  liquid: string;
  foam: string;
  pearls: [string, string, string];
  isSlush?: boolean;
}

const DRINK_THEMES: Record<string, DrinkTheme> = {
  'Green Milk Tea':              { liquid: '#7fbf6a', foam: '#c8e6a0', pearls: ['#4a2c1a', '#3d2415', '#5a3520'] },
  'Oolong Milk Tea':             { liquid: '#c8956a', foam: '#e8cbb0', pearls: ['#2a1a0e', '#3d2415', '#1e1208'] },
  'Earl Grey Milk Tea':          { liquid: '#b0956e', foam: '#ddd0be', pearls: ['#2a1a0e', '#3d2415', '#1e1208'] },
  'Pearl Milk Tea':              { liquid: '#d4b896', foam: '#ede0d0', pearls: ['#1a0e08', '#2a1a0e', '#3d2415'] },
  'Caramel Milk Tea':            { liquid: '#c47a20', foam: '#e8c887', pearls: ['#2a1a0e', '#4a2c1a', '#1e1208'] },
  'Strawberry Milk Tea':         { liquid: '#e8758a', foam: '#f5c0cc', pearls: ['#8b1a2e', '#a0253f', '#6e1224'] },
  'Test Milk Tea':               { liquid: '#c0a882', foam: '#e0d0c0', pearls: ['#2a1a0e', '#3d2415', '#1e1208'] },
  'Mango Green Tea':             { liquid: '#d4a820', foam: '#f0d870', pearls: ['#4a2c1a', '#3d2415', '#2a1a0e'] },
  'Passion Fruit Green Tea':     { liquid: '#d46820', foam: '#f0a060', pearls: ['#4a2c1a', '#8b3a1a', '#2a1a0e'] },
  'Mango & Passion Fruit Tea':   { liquid: '#e09030', foam: '#f5c060', pearls: ['#8b3a1a', '#4a2c1a', '#6b2a10'] },
  'Strawberry Matcha':           { liquid: '#78b040', foam: '#e87890', pearls: ['#8b1a2e', '#6e1224', '#a0253f'] },
  'Mango Matcha':                { liquid: '#88b830', foam: '#e8d060', pearls: ['#4a2c1a', '#3d2415', '#2a1a0e'] },
  'Matcha Milk Tea':             { liquid: '#6a9e38', foam: '#b8d888', pearls: ['#2a1a0e', '#3d2415', '#1e1208'] },
  'Oreo Slush':                  { liquid: '#404040', foam: '#c8c8c8', pearls: ['#181818', '#282828', '#383838'], isSlush: true },
  'Coffee Slush':                { liquid: '#5c3820', foam: '#c8a878', pearls: ['#1e1208', '#2a1a0e', '#141008'], isSlush: true },
  'Strawberry Slush':            { liquid: '#e85070', foam: '#f8a8b8', pearls: ['#8b1a2e', '#6e1224', '#a02040'], isSlush: true },
  'Mango Slush':                 { liquid: '#f0a020', foam: '#f8d870', pearls: ['#8b4a10', '#6e3808', '#a05810'], isSlush: true },
  'Peach Oolong':                { liquid: '#e8905a', foam: '#f5c898', pearls: ['#2a1a0e', '#3d2415', '#1e1208'] },
  'Testing Seasonal':            { liquid: '#9a78c8', foam: '#d0b8f0', pearls: ['#2a1a4e', '#3d2870', '#1e1038'] },
  'Seasonal Latte':              { liquid: '#a87848', foam: '#e8d0a8', pearls: ['#2a1a0e', '#3d2415', '#1e1208'] },
  'Seasonal Item 3':             { liquid: '#88c878', foam: '#c8f0b8', pearls: ['#1a4a1a', '#2a5e2a', '#0e300e'] },
  'Taro Slush':                  { liquid: '#b898e0', foam: '#dcc8f8', pearls: ['#4a2870', '#3a1e58', '#5e3488'], isSlush: true },
  'Coffee Milk Tea':             { liquid: '#7a5038', foam: '#c8a880', pearls: ['#1e1208', '#2a1a0e', '#141008'] },
  'Brown Sugar Milk Tea':        { liquid: '#8a4820', foam: '#e8c090', pearls: ['#2a1208', '#3d1a08', '#1e0e04'] },
  'Thai Milk Tea':               { liquid: '#e07828', foam: '#f5c070', pearls: ['#2a1a0e', '#3d2415', '#1e1208'] },
  'Matcha Slush':                { liquid: '#5a9828', foam: '#a8d868', pearls: ['#1a3a0e', '#2a5018', '#0e2808'], isSlush: true },
  'Taro Milk Tea':               { liquid: '#c8a0e8', foam: '#e8d0f8', pearls: ['#4a2870', '#3a1e58', '#5e3488'] },
  'Wintermelon Milk Tea':        { liquid: '#88b8a0', foam: '#c0ddd0', pearls: ['#2a1a0e', '#3d2415', '#1e1208'] },
  'Black Milk Tea':              { liquid: '#4a3428', foam: '#c8b8a8', pearls: ['#0e0a06', '#181210', '#0a0806'] },
};

// Fallback for any drink name not in the map
const DEFAULT_THEME: DrinkTheme = {
  liquid: '#c0a882',
  foam: '#e0d0c0',
  pearls: ['#2a1a0e', '#3d2415', '#1e1208'],
};

function buildSvg(theme: DrinkTheme, id: string): string {
  const { liquid, foam, pearls, isSlush } = theme;

  const slushIce = `
    <rect x="15" y="35" width="10" height="8" rx="2" fill="white" opacity="0.35" clip-path="url(#cc-${id})"/>
    <rect x="42" y="45" width="8"  height="6" rx="2" fill="white" opacity="0.30" clip-path="url(#cc-${id})"/>
    <rect x="30" y="55" width="9"  height="7" rx="2" fill="white" opacity="0.28" clip-path="url(#cc-${id})"/>
    <rect x="55" y="38" width="7"  height="5" rx="2" fill="white" opacity="0.25" clip-path="url(#cc-${id})"/>`;

  const pearlsMarkup = `
    <circle cx="20" cy="84" r="4"   fill="${pearls[2]}" clip-path="url(#cc-${id})"/>
    <circle cx="26" cy="84" r="5"   fill="${pearls[0]}" clip-path="url(#cc-${id})"/>
    <circle cx="36" cy="84" r="5"   fill="${pearls[1]}" clip-path="url(#cc-${id})"/>
    <circle cx="46" cy="84" r="5"   fill="${pearls[2]}" clip-path="url(#cc-${id})"/>
    <circle cx="56" cy="84" r="5"   fill="${pearls[0]}" clip-path="url(#cc-${id})"/>
    <circle cx="31" cy="78" r="4"   fill="${pearls[1]}" clip-path="url(#cc-${id})"/>
    <circle cx="41" cy="79" r="4.5" fill="${pearls[0]}" clip-path="url(#cc-${id})"/>
    <circle cx="51" cy="78" r="4"   fill="${pearls[2]}" clip-path="url(#cc-${id})"/>`;

  return `<svg width="80" height="100" viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="cc-${id}">
      <path d="M10,14 L14,88 Q14,92 20,92 L60,92 Q66,92 66,88 L70,14 Z"/>
    </clipPath>
  </defs>

  <!-- straw -->
  <rect x="50" y="2" width="5" height="40" rx="2.5" fill="${pearls[0]}" opacity="0.7"/>

  <!-- cup background -->
  <path d="M10,14 L14,88 Q14,92 20,92 L60,92 Q66,92 66,88 L70,14 Z"
        fill="white" opacity="0.25" clip-path="url(#cc-${id})"/>

  <!-- liquid -->
  <rect x="9" y="28" width="62" height="66"
        fill="${liquid}" opacity="${isSlush ? 0.75 : 0.88}"
        clip-path="url(#cc-${id})"/>

  ${isSlush ? slushIce : pearlsMarkup}

  <!-- foam -->
  <ellipse cx="40" cy="28" rx="30" ry="8"  fill="${foam}" opacity="0.9"  clip-path="url(#cc-${id})"/>
  <ellipse cx="28" cy="26" rx="10" ry="4"  fill="${foam}" opacity="0.6"  clip-path="url(#cc-${id})"/>
  <ellipse cx="52" cy="27" rx="8"  ry="3"  fill="${foam}" opacity="0.5"  clip-path="url(#cc-${id})"/>

  <!-- shine -->
  <path d="M16,20 L18,80" stroke="white" stroke-width="2.5" opacity="0.18"
        stroke-linecap="round" clip-path="url(#cc-${id})"/>
  <path d="M20,18 L22,78" stroke="white" stroke-width="1"   opacity="0.12"
        stroke-linecap="round" clip-path="url(#cc-${id})"/>

  <!-- cup outline -->
  <path d="M10,14 L14,88 Q14,92 20,92 L60,92 Q66,92 66,88 L70,14 Z"
        fill="none" stroke="#b0a898" stroke-width="1.5"/>

  <!-- lid -->
  <ellipse cx="40" cy="14" rx="30" ry="5"  fill="#e8e0d8" stroke="#c0b8b0" stroke-width="1"/>
  <ellipse cx="40" cy="12" rx="28" ry="4"  fill="#f0ebe5" stroke="#c8c0b8" stroke-width="0.8"/>
  <path    d="M28,12 Q40,4 52,12"           fill="#f5f0ec" stroke="#c8c0b8" stroke-width="0.8"/>
  <ellipse cx="52" cy="11" rx="3" ry="2"   fill="#d8d0c8" stroke="#c0b8b0" stroke-width="0.5"/>
</svg>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a raw SVG string for the given drink name.
 * Use with dangerouslySetInnerHTML or convert to a data-URI.
 */
export function getBobaImage(drinkName: string): string {
  const theme = DRINK_THEMES[drinkName] ?? DEFAULT_THEME;
  // Use a short stable ID derived from the name so clip-path IDs don't clash
  // when multiple cups render on the same page.
  const id = drinkName.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 12) +
             Math.random().toString(36).slice(2, 6);
  return buildSvg(theme, id);
}

/**
 * Returns a data-URI you can pass directly to <img src="...">.
 * Useful when you don't want dangerouslySetInnerHTML.
 */
export function getBobaImageSrc(drinkName: string): string {
  const svg = getBobaImage(drinkName);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
