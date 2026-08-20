import PALETTE_GROUPS from "./paletteDefaults";

// The "Blue — Brand Primary" group is what buttons, links, focus rings,
// and primary badges are actually built from throughout the app (via
// --admin-primary etc, which alias back to --blue-*). Recoloring just
// this one group is what makes a preset read as "the whole site changed
// color" without touching the semantic Green/Amber/Red (success/warning/
// danger) groups, which need to keep meaning what they mean regardless
// of theme — a red "Delete" button shouldn't turn violet just because
// the brand color did.
export const BRAND_GROUP = PALETTE_GROUPS.find((g) => g.id === "blue");

// Every seed below is a hex value that ALREADY exists somewhere in
// index.css (indigo-600, violet-600, teal-600, cyan-600, pink-700,
// slate-700) — not invented — so each preset inherits a hue/saturation
// that's already proven to look right in this exact design system.
export const THEME_PRESETS = [
  { id: "default", label: "Default", swatch: "#2563eb", seed: null },
  { id: "indigo", label: "Indigo", swatch: "#4f46e5", seed: "#4f46e5" },
  { id: "violet", label: "Violet", swatch: "#7c3aed", seed: "#7c3aed" },
  { id: "teal", label: "Teal", swatch: "#0d9488", seed: "#0d9488" },
  { id: "cyan", label: "Cyan", swatch: "#0891b2", seed: "#0891b2" },
  { id: "rose", label: "Rose", swatch: "#be185d", seed: "#be185d" },
  { id: "charcoal", label: "Charcoal", swatch: "#334155", seed: "#334155" },
];
