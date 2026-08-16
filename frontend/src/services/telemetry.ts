/**
 * Telemetry data service (Controller layer).
 *
 * Responsible ONLY for ingesting backend sensor payloads and returning typed
 * reading arrays. It never touches the DOM. Controllers dispatch the returned
 * values into the central Store; UI Block components read from the Store.
 */
import type { SensorReadingResponse } from "../types/generated/SensorReading";

async function fetchReadings(url: string): Promise<SensorReadingResponse[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Backend: ${res.status}`);
    return (await res.json()) as SensorReadingResponse[];
  } catch {
    return [];
  }
}

/** Fetches the latest reading per deployed sensor node. */
export function fetchLatestReadings(
  backendUrl: string,
): Promise<SensorReadingResponse[]> {
  return fetchReadings(`${backendUrl}/api/sensor`);
}

/** Fetches the recent history of sensor readings. */
export function fetchHistoryReadings(
  backendUrl: string,
): Promise<SensorReadingResponse[]> {
  return fetchReadings(`${backendUrl}/api/sensor/history`);
}
