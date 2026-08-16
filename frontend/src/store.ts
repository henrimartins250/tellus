/**
 * Central Store (Model layer).
 *
 * Holds all application and telemetry state in memory and is the single
 * source of truth for the UI. The DOM is NEVER used as a source of state
 * truth — Block views only read what is dispatched here by Controllers.
 */
import { getConfig, subscribe as subscribeConfig } from "./config";
import type { AppConfig } from "./config";
import type { SensorReadingResponse } from "./types/generated/SensorReading";
import type { OpenMeteoWeather } from "./services/weather";

export interface AppState {
  /** Latest Open-Meteo forecast for the configured field location. */
  weather: OpenMeteoWeather | null;
  /** Latest reading per deployed sensor node. */
  latestReadings: SensorReadingResponse[];
  /** Recent history of sensor readings (all nodes). */
  historyReadings: SensorReadingResponse[];
  /** Snapshot of the persistent application configuration. */
  config: AppConfig;
  /** True while any controller fetch is in flight. */
  loading: boolean;
  /** Most recent controller error message, if any. */
  error: string | null;
  /** Timestamp of the last successful telemetry refresh. */
  lastUpdated: number | null;
}

export interface Store {
  /** Read-only snapshot of the current application state. */
  getState(): Readonly<AppState>;
  /** Dispatches an explicit, partial state update (action) into the store. */
  dispatch(patch: Partial<AppState>): void;
  /** Registers a listener called on every state change. Returns an unsubscribe fn. */
  subscribe(listener: (state: Readonly<AppState>) => void): () => void;
}

/**
 * Creates the application-wide central store.
 *
 * The store mirrors the persistent config module into its own state so that
 * both Block views and Controllers read a single, consistent config snapshot.
 */
export function createStore(): Store {
  let state: AppState = {
    weather: null,
    latestReadings: [],
    historyReadings: [],
    config: getConfig(),
    loading: false,
    error: null,
    lastUpdated: null,
  };

  const listeners = new Set<(state: Readonly<AppState>) => void>();

  function emit(): void {
    listeners.forEach((listener) => listener(state));
  }

  // Keep the store's config snapshot in sync with the config module, which
  // persists changes to localStorage. This turns every setConfig() into a
  // store dispatch so Blocks can react to configuration changes.
  subscribeConfig((config) => {
    state.config = config;
    emit();
  });

  return {
    getState(): Readonly<AppState> {
      return state;
    },

    dispatch(patch: Partial<AppState>): void {
      state = { ...state, ...patch };
      emit();
    },

    subscribe(listener: (state: Readonly<AppState>) => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
