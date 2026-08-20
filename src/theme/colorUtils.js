// Small, dependency-free color helpers used by the theme system.
// Storage stays hex everywhere (that's what index.css and its rgba()
// calls need) — HSL is only ever used transiently, as an editing/
// derivation convenience, then converted back to hex before it's saved.

/** "#2563eb" -> true, "2563eb" / "#zzz" / "" -> false */
export function isValidHex(value) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value || "");
}

function normalizeHex(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return h;
}

/** "#2563eb" -> { r: 37, g: 99, b: 235 } */
export function hexToRgb(hex) {
  const h = normalizeHex(hex);
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/** "#2563eb" -> "37, 99, 235" — matches the "--x-rgb" format index.css already uses. */
export function hexToRgbString(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

/** { r, g, b } (0-255 each) -> "#2563eb" */
export function rgbToHex({ r, g, b }) {
  const toHex = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** "#2563eb" -> { h: 217, s: 91, l: 53 } (h in degrees, s/l as 0-100 integers) */
export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rN = r / 255, gN = g / 255, bN = b / 255;
  const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rN: h = ((gN - bN) / d + (gN < bN ? 6 : 0)); break;
      case gN: h = (bN - rN) / d + 2; break;
      default: h = (rN - gN) / d + 4;
    }
    h *= 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** { h: 217, s: 91, l: 53 } -> "#2563eb" */
export function hslToHex({ h, s, l }) {
  const hN = ((h % 360) + 360) % 360 / 360;
  const sN = Math.max(0, Math.min(100, s)) / 100;
  const lN = Math.max(0, Math.min(100, l)) / 100;

  if (sN === 0) {
    const gray = Math.round(lN * 255);
    return rgbToHex({ r: gray, g: gray, b: gray });
  }

  const hue2rgb = (p, q, t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
  const p = 2 * lN - q;
  const r = hue2rgb(p, q, hN + 1 / 3);
  const g = hue2rgb(p, q, hN);
  const b = hue2rgb(p, q, hN - 1 / 3);

  return rgbToHex({ r: r * 255, g: g * 255, b: b * 255 });
}

/**
 * The "regenerate a whole ramp from one seed color" tool. Takes a group's
 * color list (e.g. blue-50 ... blue-950, each with its original default
 * hex) and one new seed hex, and returns { varName: newHex } for every
 * color in the group.
 *
 * The new hue + saturation come from the seed for every shade (so the
 * whole family reads as one consistent hue), but each shade KEEPS its own
 * original default lightness — that's what preserves the ramp's shape
 * (--blue-50 stays near-white, --blue-950 stays near-black, etc.)
 * instead of flattening everything to one lightness.
 */
export function generateRampFromSeed(colors, seedHex) {
  const seedHsl = hexToHsl(seedHex);
  const result = {};
  colors.forEach((c) => {
    const defaultL = hexToHsl(c.default).l;
    result[c.var] = hslToHex({ h: seedHsl.h, s: seedHsl.s, l: defaultL });
  });
  return result;
}

/** Picks black or white text so it stays readable on top of `hex`. */
export function readableTextColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#ffffff";
}
