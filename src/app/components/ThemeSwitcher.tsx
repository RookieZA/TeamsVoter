"use client";

import { useTheme, THEMES } from "@/lib/themeContext";
import { CheckIcon, PaletteIcon } from "lucide-react";
import { useState } from "react";

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);

    return (
        <div className="theme-switcher-container" data-open={open}>
            {/* Toggle button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="theme-toggle-btn"
                title="Change colour scheme"
                aria-label="Change colour scheme"
            >
                <PaletteIcon className="w-4 h-4" />
            </button>

            {/* Popover */}
            <div className="theme-popover" role="dialog" aria-label="Colour schemes">
                <p className="theme-popover-label">Colour Scheme</p>
                <div className="theme-swatches">
                    {THEMES.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => { setTheme(t.id); setOpen(false); }}
                            className={`theme-swatch-btn${theme === t.id ? " active" : ""}`}
                            title={t.label}
                            aria-label={`${t.label} theme${theme === t.id ? " (active)" : ""}`}
                        >
                            {/* Gradient swatch */}
                            <span
                                className="theme-swatch"
                                style={{
                                    background: `linear-gradient(135deg, ${t.swatches[0]} 0%, ${t.swatches[1]} 100%)`,
                                }}
                            />
                            <span className="theme-swatch-name">{t.label}</span>
                            {theme === t.id && (
                                <CheckIcon className="theme-check w-3 h-3" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
