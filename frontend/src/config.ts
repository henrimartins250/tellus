export interface AppConfig {
  theme: string;
  locale: string;
  units: string;
  lat: number;
  lon: number;
  backendUrl: string;
  refreshInterval: number;
}

const STORAGE_KEY = "tellus-config-v1";

export const THEMES: { id: string; icon: string; swatch: string }[] = [
  { id: "light", icon: "light_mode", swatch: "#F8FAFC" },
  { id: "dark", icon: "dark_mode", swatch: "#0B110D" },
  { id: "sunset", icon: "wb_twilight", swatch: "#C25E00" },
  { id: "neon", icon: "bolt", swatch: "#22D3EE" },
];

export const LOCALES: { id: string; label: string }[] = [
  { id: "en", label: "English" },
  { id: "pt-BR", label: "Português (Brasil)" },
];

export const UNITS: { id: string; key: string }[] = [
  { id: "metric", key: "settings.units.metric" },
  { id: "imperial", key: "settings.units.imperial" },
];

export const REFRESH_OPTIONS: { value: number }[] = [
  { value: 30000 },
  { value: 60000 },
  { value: 120000 },
  { value: 300000 },
  { value: 600000 },
  { value: 1800000 },
];

const DEFAULTS: AppConfig = {
  theme: "light",
  locale: "en",
  units: "metric",
  lat: -22.9,
  lon: -49.1,
  backendUrl: "http://localhost:3000",
  refreshInterval: 300000,
};

type Validator = (value: unknown) => boolean;

const VALIDATORS: Record<keyof AppConfig, Validator> = {
  theme: (v) => THEMES.some((t) => t.id === v),
  locale: (v) => LOCALES.some((l) => l.id === v),
  units: (v) => UNITS.some((u) => u.id === v),
  lat: (v) => typeof v === "number" && Number.isFinite(v) && v >= -90 && v <= 90,
  lon: (v) => typeof v === "number" && Number.isFinite(v) && v >= -180 && v <= 180,
  backendUrl: (v) => typeof v === "string" && v.length > 0,
  refreshInterval: (v) =>
    typeof v === "number" && Number.isFinite(v) && v >= 5000,
};

function load(): Partial<AppConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const record = parsed as Record<string, unknown>;
    const clean: Partial<AppConfig> = {};
    for (const key of Object.keys(DEFAULTS) as (keyof AppConfig)[]) {
      const value = record[key];
      if (value === undefined) continue;
      if (VALIDATORS[key] && !VALIDATORS[key](value)) continue;
      clean[key] = value as never;
    }
    return clean;
  } catch {
    return {};
  }
}

const state: AppConfig = { ...DEFAULTS, ...load() };
const listeners = new Set<(cfg: AppConfig) => void>();

export function getConfig(): AppConfig {
  return { ...state };
}

export function setConfig(patch: Partial<AppConfig>): boolean {
  let changed = false;
  for (const key of Object.keys(DEFAULTS) as (keyof AppConfig)[]) {
    const value = patch[key];
    if (value === undefined) continue;
    if (VALIDATORS[key] && !VALIDATORS[key](value)) continue;
    if (state[key] === value) continue;
    state[key] = value as never;
    changed = true;
  }
  if (changed) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable, keep in-memory only
    }
    listeners.forEach((fn) => fn(getConfig()));
  }
  return changed;
}

export function subscribe(fn: (cfg: AppConfig) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
