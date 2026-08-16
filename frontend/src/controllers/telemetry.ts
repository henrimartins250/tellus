/**
 * Telemetry controller.
 *
 * Polls the backend through the telemetry service and dispatches explicit
 * state updates into the central Store. It never mutates the DOM directly.
 * Restarts its polling timer and refetches whenever the configured
 * refresh interval or backend URL changes.
 */
import type { Store } from "../store";
import {
  fetchLatestReadings,
  fetchHistoryReadings,
} from "../services/telemetry";

export interface TelemetryController {
  /** Starts the initial fetch and the periodic polling loop. */
  start(): void;
  /** Stops the polling loop and detaches store subscriptions. */
  stop(): void;
  /** Triggers an immediate manual refresh of the telemetry data. */
  refresh(): void;
}

export function createTelemetryController(store: Store): TelemetryController {
  let timer: number | null = null;
  let unsubscribe: (() => void) | null = null;
  let lastRefreshInterval = -1;
  let lastBackendUrl = "";

  async function refresh(): Promise<void> {
    const { backendUrl } = store.getState().config;
    store.dispatch({ loading: true, error: null });
    const [latestReadings, historyReadings] = await Promise.all([
      fetchLatestReadings(backendUrl),
      fetchHistoryReadings(backendUrl),
    ]);
    store.dispatch({
      latestReadings,
      historyReadings,
      loading: false,
      lastUpdated: Date.now(),
    });
  }

  function schedule(): void {
    if (timer !== null) window.clearInterval(timer);
    timer = window.setInterval(
      () => void refresh(),
      store.getState().config.refreshInterval,
    );
  }

  function sync(): void {
    const { refreshInterval, backendUrl } = store.getState().config;
    if (backendUrl !== lastBackendUrl) {
      lastBackendUrl = backendUrl;
      void refresh();
    }
    if (refreshInterval !== lastRefreshInterval) {
      lastRefreshInterval = refreshInterval;
      schedule();
    }
  }

  return {
    start(): void {
      const { refreshInterval, backendUrl } = store.getState().config;
      lastRefreshInterval = refreshInterval;
      lastBackendUrl = backendUrl;
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

    refresh(): void {
      void refresh();
    },
  };
}
