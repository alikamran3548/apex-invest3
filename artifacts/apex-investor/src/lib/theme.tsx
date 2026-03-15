import { createContext, useContext, useEffect, useState } from 'react';

// ─── THEMES ──────────────────────────────────────────────────────────────────

export type ThemeId =
  | 'navy-gold' | 'midnight' | 'forest' | 'steel' | 'burgundy'
  | 'rose-gold' | 'obsidian' | 'amber' | 'ocean' | 'violet';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  preview: { bg: string; primary: string; card: string };
  tier?: 'S' | 'A';
}

export const THEMES: Theme[] = [
  // ── A-Tier (originals) ────────────────────────────────────────────────────
  { id: 'navy-gold',  name: 'Navy & Gold',  description: 'Classic dark navy with premium gold accents',       preview: { bg: '#0a0f1e', primary: '#c9982a', card: '#111827' } },
  { id: 'midnight',   name: 'Midnight',     description: 'Pure black with electric cyan highlights',           preview: { bg: '#050508', primary: '#06b6d4', card: '#0f0f14' } },
  { id: 'forest',     name: 'Forest',       description: 'Deep forest tones with emerald green accents',      preview: { bg: '#070f0a', primary: '#10b981', card: '#0c1a10' } },
  { id: 'steel',      name: 'Steel Blue',   description: 'Slate and steel with indigo blue accents',          preview: { bg: '#080c14', primary: '#6366f1', card: '#0d1220' } },
  { id: 'burgundy',   name: 'Burgundy',     description: 'Dark charcoal with deep crimson accents',           preview: { bg: '#0c0909', primary: '#e11d48', card: '#140e0e' } },
  // ── S-Tier (exclusive) ────────────────────────────────────────────────────
  { id: 'rose-gold',  name: 'Rose Gold',    description: 'Luxurious mauve with rose-gold metallic accents',   preview: { bg: '#0e0709', primary: '#d4889a', card: '#16090c' }, tier: 'S' },
  { id: 'obsidian',   name: 'Obsidian',     description: 'Pure obsidian black with cool silver highlights',   preview: { bg: '#080808', primary: '#c8d0da', card: '#101010' }, tier: 'S' },
  { id: 'amber',      name: 'Amber',        description: 'Warm dark earth tones with blazing amber accents',  preview: { bg: '#0d0804', primary: '#f59e0b', card: '#160d05' }, tier: 'S' },
  { id: 'ocean',      name: 'Deep Ocean',   description: 'Abyssal navy depths with radiant aqua accents',     preview: { bg: '#030c14', primary: '#22d3ee', card: '#051220' }, tier: 'S' },
  { id: 'violet',     name: 'Violet',       description: 'Cosmic dark purple with vibrant violet glows',      preview: { bg: '#08040f', primary: '#a855f7', card: '#100819' }, tier: 'S' },
];

// ─── UI SETTINGS ─────────────────────────────────────────────────────────────

export type CardStyle   = 'glass' | 'solid' | 'minimal' | 'terminal';
export type FontStyle   = 'sans' | 'serif' | 'mono';
export type RadiusStyle = 'rounded' | 'sharp' | 'pill';

export interface UISettings {
  cardStyle:    CardStyle;
  fontStyle:    FontStyle;
  radiusStyle:  RadiusStyle;
  glowEffects:  boolean;
}

const DEFAULT_UI: UISettings = {
  cardStyle:   'glass',
  fontStyle:   'sans',
  radiusStyle: 'rounded',
  glowEffects: false,
};

function loadUI(): UISettings {
  try {
    const stored = localStorage.getItem('apex-ui');
    if (stored) return { ...DEFAULT_UI, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_UI;
}

function applyUI(ui: UISettings) {
  const el = document.documentElement;
  el.setAttribute('data-card-style',  ui.cardStyle);
  el.setAttribute('data-font',        ui.fontStyle);
  el.setAttribute('data-radius',      ui.radiusStyle);
  el.setAttribute('data-glow',        ui.glowEffects ? 'on' : 'off');
}

// ─── THEME CONTEXT ───────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme:    ThemeId;
  setTheme: (t: ThemeId) => void;
  ui:       UISettings;
  setUI:    (updates: Partial<UISettings>) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'navy-gold', setTheme: () => {},
  ui: DEFAULT_UI,     setUI: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem('apex-theme') as ThemeId | null;
    return stored && THEMES.find(t => t.id === stored) ? stored : 'navy-gold';
  });

  const [ui, setUIState] = useState<UISettings>(loadUI);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('apex-theme', theme);
  }, [theme]);

  // Apply UI settings
  useEffect(() => {
    applyUI(ui);
    localStorage.setItem('apex-ui', JSON.stringify(ui));
  }, [ui]);

  // Apply both on first mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    applyUI(ui);
  }, []);

  const setTheme = (t: ThemeId) => setThemeState(t);
  const setUI = (updates: Partial<UISettings>) =>
    setUIState(prev => ({ ...prev, ...updates }));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, ui, setUI }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
