import { useMemo, useState } from "react";
import { FiDroplet, FiX, FiRotateCcw, FiSearch, FiCheck, FiZap } from "react-icons/fi";
import { useTheme } from "../../theme/ThemeContext";
import PALETTE_GROUPS from "../../theme/paletteDefaults";
import { readableTextColor, hexToHsl, generateRampFromSeed } from "../../theme/colorUtils";
import "./ThemeCustomizer.css";

// "--slate-500" -> "Slate 500", "--white" -> "White"
function labelFromVar(varName) {
  const parts = varName.replace("--", "").split("-");
  return parts.map((p) => (/^\d+$/.test(p) ? p : p[0].toUpperCase() + p.slice(1))).join(" ");
}

// The shade closest to the "middle" of a ramp is the best default seed to
// show in the group's color picker — e.g. for blue-50..blue-950, that's
// something near blue-500/600, not the near-white or near-black ends.
function midShade(colors) {
  if (colors.length === 1) return colors[0];
  return colors[Math.floor(colors.length / 2)];
}

/**
 * The full, every-variable palette editor — for people who want to go
 * beyond the curated presets in <ThemeSwitcher>. Controlled: rendered
 * by ThemeSwitcher's "Customize further" action, not self-triggered.
 *
 * Props: isOpen, onClose
 */
export default function ThemeCustomizer({ isOpen, onClose }) {
  const {
    enabled, setEnabled, getValue, setColor, setMany,
    resetColor, resetMany, resetAll, hasCustomizations, overrides,
  } = useTheme();
  const [query, setQuery] = useState("");
  // One seed hex per group, keyed by group id — lets each group's ramp
  // tool remember what you picked without a full re-render of the others.
  const [seeds, setSeeds] = useState({});

  const customCount = Object.keys(overrides).length;

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PALETTE_GROUPS;
    return PALETTE_GROUPS
      .map((g) => ({
        ...g,
        colors: g.colors.filter(
          (c) => c.var.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.colors.length > 0);
  }, [query]);

  const applyRamp = (group) => {
    const seed = seeds[group.id] || getValue(midShade(group.colors).var);
    const mapping = generateRampFromSeed(group.colors, seed);
    setMany(mapping);
    if (!enabled) setEnabled(true);
  };

  const resetGroup = (group) => {
    resetMany(group.colors.map((c) => c.var));
  };

  if (!isOpen) return null;

  return (
    <div className="tc-overlay" onMouseDown={onClose}>
      <div className="tc-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="tc-header">
          <div>
            <h2 className="tc-title"><FiDroplet /> Advanced Color Editor</h2>
            <p className="tc-subtitle">Every color, individually. Changes apply live and are saved in this browser.</p>
          </div>
          <button className="tc-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <label className="tc-enable-row">
          <input
            type="checkbox"
            className="tc-checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <div>
            <span className="tc-enable-label">Enable custom colors</span>
            <span className="tc-enable-hint">
              {enabled
                ? "Your picked colors are applied across the app."
                : "Off — the app is using its default colors, right now your picks below are just saved, not applied."}
            </span>
          </div>
        </label>

        <div className="tc-toolbar">
          <div className="tc-search">
            <FiSearch />
            <input
              placeholder="Search colors (e.g. blue-600, slate)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className="tc-reset-all"
            onClick={resetAll}
            disabled={customCount === 0}
            title="Reset every color to its default"
          >
            <FiRotateCcw /> Reset all {customCount > 0 && `(${customCount})`}
          </button>
        </div>

        <div className={`tc-groups ${!enabled ? "tc-groups-disabled" : ""}`}>
          {filteredGroups.length === 0 && (
            <p className="tc-empty">No colors match "{query}".</p>
          )}

          {filteredGroups.map((group) => {
            const groupCustomCount = group.colors.filter((c) => c.var in overrides).length;
            const seedHex = seeds[group.id] || getValue(midShade(group.colors).var);
            const seedHsl = hexToHsl(seedHex);

            return (
              <details key={group.id} className="tc-group" open={!!query}>
                <summary className="tc-group-summary">
                  {group.label}
                  <span className="tc-group-count">{group.colors.length}</span>
                </summary>

                {group.colors.length > 1 && (
                  <div className="tc-ramp-tool">
                    <label className="tc-ramp-seed" style={{ background: seedHex }}>
                      <input
                        type="color"
                        value={seedHex}
                        disabled={!enabled}
                        onChange={(e) => setSeeds((prev) => ({ ...prev, [group.id]: e.target.value }))}
                        aria-label={`Seed color for ${group.label} ramp`}
                      />
                    </label>
                    <div className="tc-ramp-info">
                      <span className="tc-ramp-hsl">H{seedHsl.h}° S{seedHsl.s}% L{seedHsl.l}%</span>
                      <span className="tc-ramp-hint">Pick a hue, keep the shade steps</span>
                    </div>
                    <button
                      className="tc-ramp-apply"
                      disabled={!enabled}
                      onClick={() => applyRamp(group)}
                      title={`Regenerate all ${group.colors.length} shades in this group from the seed color`}
                    >
                      <FiZap /> Apply to {group.colors.length}
                    </button>
                    {groupCustomCount > 0 && (
                      <button
                        className="tc-ramp-reset"
                        onClick={() => resetGroup(group)}
                        title="Reset this whole group to defaults"
                      >
                        <FiRotateCcw />
                      </button>
                    )}
                  </div>
                )}

                <div className="tc-swatch-grid">
                  {group.colors.map((color) => {
                    const value = getValue(color.var);
                    const isCustom = value !== color.default;
                    const hsl = hexToHsl(value);
                    return (
                      <div className={`tc-swatch ${isCustom ? "is-custom" : ""}`} key={color.var}>
                        <label className="tc-swatch-color-wrap" style={{ background: value }}>
                          <input
                            type="color"
                            value={value}
                            disabled={!enabled}
                            onChange={(e) => setColor(color.var, e.target.value)}
                            aria-label={`${labelFromVar(color.var)} color`}
                          />
                          {isCustom && (
                            <FiCheck className="tc-swatch-check" style={{ color: readableTextColor(value) }} />
                          )}
                        </label>

                        <div className="tc-swatch-meta">
                          <span className="tc-swatch-name">{labelFromVar(color.var)}</span>
                          <input
                            className="tc-swatch-hex"
                            type="text"
                            value={value}
                            disabled={!enabled}
                            onChange={(e) => setColor(color.var, e.target.value)}
                            maxLength={7}
                            spellCheck={false}
                          />
                          <span className="tc-swatch-hsl">H{hsl.h} S{hsl.s} L{hsl.l}</span>
                        </div>

                        {isCustom && (
                          <button
                            className="tc-swatch-reset"
                            onClick={() => resetColor(color.var)}
                            title="Reset to default"
                            aria-label={`Reset ${labelFromVar(color.var)} to default`}
                          >
                            <FiRotateCcw />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}

