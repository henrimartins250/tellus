/**
 * Weather controller.
 *
 * Polls Open-Meteo through the weather service and dispatches explicit state
 * updates into the central Store. It never mutates the DOM directly. Refetches
 * immediately whenever the field location (lat/lon) changes and restarts its
 * polling timer when the configured refresh interval changes.
 */
import type { Store } from "../store";
import { fetchWeather } from "../services/weather";

export interface WeatherController {
  /** Starts the initial fetch and the periodic polling loop. */
  start(): void;
  /** Stops the polling loop and detaches store subscriptions. */
  stop(): void;
}

export function createWeatherController(store: Store): WeatherController {
  let timer: number | null = null;
  let unsubscribe: (() => void) | null = null;
  let lastRefreshInterval = -1;
  let lastLat = NaN;
  let lastLon = NaN;

  async function refresh(): Promise<void> {
    const { lat, lon } = store.getState().config;
    try {
      const weather = await fetchWeather(lat, lon);
      store.dispatch({ weather, error: null, loading: false });
    } catch (err) {
      store.dispatch({
        error: err instanceof Error ? err.message : String(err),
        loading: false,
      });
    }
  }

  function schedule(): void {
    if (timer !== null) window.clearInterval(timer);
    timer = window.setInterval(
      () => void refresh(),
      store.getState().config.refreshInterval,
    );
  }

  function sync(): void {
    const { lat, lon, refreshInterval } = store.getState().config;
    if (lat !== lastLat || lon !== lastLon) {
      lastLat = lat;
      lastLon = lon;
      void refresh();
    }
    if (refreshInterval !== lastRefreshInterval) {
      lastRefreshInterval = refreshInterval;
      schedule();
    }
  }

  return {
    start(): void {
      const { lat, lon, refreshInterval } = store.getState().config;
      lastLat = lat;
      lastLon = lon;
      lastRefreshInterval = refreshInterval;
      void refresh();
      schedule();
      unsubscribe = store.subscribe(sync);
    },

    stop(): void {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },
  };
}
