import { createContext, useContext, useState, useLayoutEffect, useCallback, useMemo } from "react";
import PALETTE_GROUPS from "./paletteDefaults";
import { hexToRgbString, isValidHex } from "./colorUtils";

const STORAGE_KEY_ENABLED = "app-theme-enabled";
const STORAGE_KEY_OVERRIDES = "app-theme-overrides";

// Flat lookup used by the "apply to DOM" effect and by getValue() —
// { "--blue-600": "#2563eb", ... } built once from paletteDefaults.js.
const DEFAULTS_BY_VAR = PALETTE_GROUPS.reduce((acc, group) => {
  group.colors.forEach((c) => { acc[c.var] = c.default; });
  return acc;
}, {});
const ALL_VAR_NAMES = Object.keys(DEFAULTS_BY_VAR);

function loadEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY_ENABLED) === "true";
  } catch {
    return false;
  }
}

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OVERRIDES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const ThemeContext = createContext(null);

/**
 * Wrap your app root with this once (see README). It owns the "enabled"
 * flag + the color overrides, keeps them in localStorage, and — the only
 * place any DOM mutation happens — pushes them onto document.documentElement
 * as inline CSS custom properties, which is all that's needed to override
 * index.css: inline styles on :root beat a stylesheet rule of equal
 * specificity, and removing the inline property just lets the index.css
 * value show through again untouched.
 */
export function ThemeProvider({ children }) {
  const [enabled, setEnabledState] = useState(loadEnabled);
  const [overrides, setOverrides] = useState(loadOverrides);

  // The single place colors actually get applied (or un-applied) to the
  // page. Runs whenever `enabled` or `overrides` changes — including the
  // very first render, so a page refresh reapplies whatever was saved.
  useLayoutEffect(() => {
    const root = document.documentElement.style;
    ALL_VAR_NAMES.forEach((name) => {
      const custom = enabled ? overrides[name] : undefined;
      if (custom) {
        root.setProperty(name, custom);
        root.setProperty(`${name}-rgb`, hexToRgbString(custom));
      } else {
        // No inline override — falls back to whatever index.css itself
        // defines for this variable. This is the "unchecked -> defaults"
        // behavior; nothing needs to be reset "back" to a value, it just
        // stops being overridden.
        root.removeProperty(name);
        root.removeProperty(`${name}-rgb`);
      }
    });
  }, [enabled, overrides]);

  useLayoutEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));
    } catch {
      // localStorage unavailable (private mode, quota, etc) — the theme
      // still works for this session, it just won't persist.
    }
  }, [enabled]);

  useLayoutEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
    } catch {
      // see above
    }
  }, [overrides]);

  const setEnabled = useCallback((value) => setEnabledState(value), []);

  const setColor = useCallback((varName, hex) => {
    if (!isValidHex(hex)) return;
    setOverrides((prev) => ({ ...prev, [varName]: hex.toLowerCase() }));
  }, []);

  // Batch version of setColor — one state update for many variables at
  // once (used by the "regenerate ramp from seed" tool, which can touch
  // 50+ variables in one go).
  const setMany = useCallback((mapping) => {
    const valid = Object.entries(mapping).filter(([, hex]) => isValidHex(hex));
    if (valid.length === 0) return;
    setOverrides((prev) => {
      const next = { ...prev };
      valid.forEach(([varName, hex]) => { next[varName] = hex.toLowerCase(); });
      return next;
    });
  }, []);

  const resetColor = useCallback((varName) => {
    setOverrides((prev) => {
      if (!(varName in prev)) return prev;
      const next = { ...prev };
      delete next[varName];
      return next;
    });
  }, []);

  // Batch version of resetColor — used by "reset this group" and "reset all".
  const resetMany = useCallback((varNames) => {
    setOverrides((prev) => {
      const next = { ...prev };
      let changed = false;
      varNames.forEach((v) => {
        if (v in next) { delete next[v]; changed = true; }
      });
      return changed ? next : prev;
    });
  }, []);

  const resetAll = useCallback(() => setOverrides({}), []);

  const getValue = useCallback(
    (varName) => overrides[varName] || DEFAULTS_BY_VAR[varName],
    [overrides]
  );

  const hasCustomizations = Object.keys(overrides).length > 0;

  const value = useMemo(
    () => ({
      enabled, setEnabled, overrides,
      setColor, setMany, resetColor, resetMany, resetAll,
      getValue, hasCustomizations,
    }),
    [enabled, setEnabled, overrides, setColor, setMany, resetColor, resetMany, resetAll, getValue, hasCustomizations]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme() must be used inside a <ThemeProvider>");
  return ctx;
}
