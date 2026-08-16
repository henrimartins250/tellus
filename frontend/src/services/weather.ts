/**
 * Weather data service (Controller layer).
 *
 * Responsible ONLY for ingesting Open-Meteo payloads and returning typed
 * weather data. It never touches the DOM. Consumers (controllers) dispatch
 * the returned value into the central Store; UI Block components read from
 * the Store instead of calling this service directly.
 */

export interface OpenMeteoWeather {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    pressure_msl: number;
    uv_index: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_sum: number[];
  };
}

/**
 * Fetches the Open-Meteo forecast for the given field coordinates.
 *
 * @param lat - Field latitude in decimal degrees.
 * @param lon - Field longitude in decimal degrees.
 * @throws When the weather API responds with a non-OK status.
 */
export async function fetchWeather(
  lat: number,
  lon: number,
): Promise<OpenMeteoWeather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,pressure_msl,uv_index",
    hourly: "temperature_2m,relative_humidity_2m",
    past_hours: "25",
    daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum",
    forecast_days: "7",
    timezone: "auto",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Weather API: ${res.status}`);
  return (await res.json()) as OpenMeteoWeather;
}
