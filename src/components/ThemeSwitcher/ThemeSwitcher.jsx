import { useEffect, useState } from "react";
import { FiDroplet, FiX, FiCheck, FiSliders } from "react-icons/fi";
import DraggableFab from "../DraggableFab/DraggableFab";
import { useTheme } from "../../theme/ThemeContext";
import { THEME_PRESETS, BRAND_GROUP } from "../../theme/presets";
import { generateRampFromSeed } from "../../theme/colorUtils";
import ThemeCustomizer from "../ThemeCustomizer/ThemeCustomizer";
import "./ThemeSwitcher.css";

const ACTIVE_PRESET_KEY = "app-theme-active-preset";

export default function ThemeSwitcher() {
  const { enabled, setEnabled, setMany, resetAll, hasCustomizations } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [activePresetId, setActivePresetId] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_PRESET_KEY) || "default";
    } catch {
      return "default";
    }
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const applyPreset = (preset) => {
    if (preset.id === "default") {
      resetAll();
    } else {
      const mapping = generateRampFromSeed(BRAND_GROUP.colors, preset.seed);
      setMany(mapping);
      if (!enabled) setEnabled(true);
    }
    setActivePresetId(preset.id);
    try {
      localStorage.setItem(ACTIVE_PRESET_KEY, preset.id);
    } catch {
      // non-fatal — theme still applies, just won't remember which preset it was
    }
    setToast(`Theme changed to ${preset.label}`);
    setMenuOpen(false);
  };

  return (
    <>
      <DraggableFab storageId="theme-fab" defaultCorner="bottom-right" onTap={() => setMenuOpen(true)} className="ts-fab">
        <FiDroplet />
        {hasCustomizations && <span className="ts-fab-dot" />}
      </DraggableFab>

      {toast && (
        <div className="ts-toast">
          <FiCheck /> {toast}
        </div>
      )}

      {menuOpen && (
        <div className="ts-overlay" onMouseDown={() => setMenuOpen(false)}>
          <div className="ts-menu" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ts-menu-header">
              <h3><FiDroplet /> Choose a color theme</h3>
              <button className="ts-menu-close" onClick={() => setMenuOpen(false)} aria-label="Close">
                <FiX />
              </button>
            </div>

            <div className="ts-preset-grid">
              {THEME_PRESETS.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    className={`ts-preset ${isActive ? "is-active" : ""}`}
                    onClick={() => applyPreset(preset)}
                  >
                    <span
                      className={`ts-preset-swatch ${preset.id === "default" ? "is-default" : ""}`}
                      style={{ background: preset.swatch }}
                    >
                      {isActive && <FiCheck />}
                    </span>
                    <span className="ts-preset-label">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            <button className="ts-advanced-link" onClick={() => { setMenuOpen(false); setAdvancedOpen(true); }}>
              <FiSliders /> Customize every color individually
            </button>
          </div>
        </div>
      )}

      <ThemeCustomizer isOpen={advancedOpen} onClose={() => setAdvancedOpen(false)} />
    </>
  );
}
