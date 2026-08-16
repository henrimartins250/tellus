import { getConfig } from "./config";

type Dictionary = Record<string, string>;

const DICTIONARIES: Record<string, Dictionary> = {
  en: {
    "sector.climate": "Climate",
    "sector.readings": "Readings",
    "sector.settings": "Settings",

    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.sunset": "Sunset",
    "theme.neon": "Neon",
    "status.online": "Online",

    "app.loading": "Loading field data…",
    "app.error": "Could not load field data: {message}",

    "wmo.0": "Clear",
    "wmo.1": "Mainly Clear",
    "wmo.2": "Partly Cloudy",
    "wmo.3": "Overcast",
    "wmo.45": "Foggy",
    "wmo.48": "Depositing Rime Fog",
    "wmo.51": "Light Drizzle",
    "wmo.53": "Moderate Drizzle",
    "wmo.55": "Dense Drizzle",
    "wmo.56": "Light Freezing Drizzle",
    "wmo.57": "Dense Freezing Drizzle",
    "wmo.61": "Slight Rain",
    "wmo.63": "Moderate Rain",
    "wmo.65": "Heavy Rain",
    "wmo.66": "Light Freezing Rain",
    "wmo.67": "Heavy Freezing Rain",
    "wmo.71": "Slight Snow",
    "wmo.73": "Moderate Snow",
    "wmo.75": "Heavy Snow",
    "wmo.77": "Snow Grains",
    "wmo.80": "Slight Rain Showers",
    "wmo.81": "Moderate Rain Showers",
    "wmo.82": "Violent Rain Showers",
    "wmo.85": "Slight Snow Showers",
    "wmo.86": "Heavy Snow Showers",
    "wmo.95": "Thunderstorm",
    "wmo.96": "Thunderstorm with Slight Hail",
    "wmo.99": "Thunderstorm with Heavy Hail",
    "wmo.unknown": "Unknown",

    "map.title": "Field Location",
    "map.feelsLike": "Feels like {temp}",

    "weekly.title": "Weekly Forecast",
    "weekly.range": "next 7 days",

    "cond.title": "Current Conditions",
    "cond.now": "now",
    "cond.wind": "Wind",
    "cond.pressure": "Pressure",
    "cond.uv": "UV Index",
    "cond.rainfall": "Rainfall",
    "cond.cloud": "Cloud Cover",
    "cond.solar": "Solar",
    "solar.high": "High",
    "solar.moderate": "Moderate",
    "solar.low": "Low",

    "alerts.none": "All conditions normal",
    "alerts.ideal": "Ideal growing conditions",
    "alerts.ideal.detail": "Temp and humidity in optimal range",
    "alerts.highTemp": "High temperature",
    "alerts.highTemp.detail": "{temp} — heat stress risk",
    "alerts.lowTemp": "Low temperature",
    "alerts.lowTemp.detail": "{temp} — frost risk",
    "alerts.lowHumidity": "Low humidity",
    "alerts.lowHumidity.detail": "{humidity} — irrigation may be needed",
    "alerts.highHumidity": "High humidity",
    "alerts.highHumidity.detail": "{humidity} — disease pressure elevated",
    "alerts.heavyRain": "Heavy rainfall expected",
    "alerts.heavyRain.detail": "{amount}",
    "alerts.lowPressure": "Low pressure system",
    "alerts.lowPressure.detail": "{pressure}",
    "alerts.drySoil": "Dry soil — {node}",
    "alerts.drySoil.detail": "Soil moisture at {moisture}",
    "alerts.hotSoil": "Hot soil — {node}",
    "alerts.hotSoil.detail": "Soil temp at {temp}",

    "col.field": "Field & Weather",
    "col.humidity": "Humidity",
    "col.temperature": "Temperature",
    "col.last24h": "last 24h",

    "metric.airHumidity": "Air Humidity",
    "metric.soilAverage": "Soil Average",
    "metric.air": "Air",
    "chart.relativeHumidity": "Relative Humidity",
    "chart.temperature": "Temperature",
    "node.air": "Air",
    "node.soil": "{node} soil",
    "node.soilMoisture": "Soil moisture · {time}",
    "node.soilTemp": "Soil temp · {time}",
    "node.airDeltaHumidity": "Open-Meteo · {delta}% since 24h",
    "node.airDeltaTemp": "Open-Meteo · {delta}° since 24h",

    "time.unknown": "unknown",
    "time.justNow": "just now",
    "time.secondsAgo": "{n}s ago",
    "time.minutesAgo": "{n}m ago",
    "time.hoursAgo": "{n}h ago",
    "time.daysAgo": "{n}d ago",

    "readings.title": "Sensor Readings",
    "readings.subtitle": "Live soil conditions from deployed nodes",
    "readings.activeNodes": "Active Nodes",
    "readings.live": "Live Readings",
    "readings.empty": "No sensor nodes connected",
    "readings.node": "Node",
    "readings.soilMoisture": "Soil Moisture",
    "readings.soilTemp": "Soil Temp",
    "readings.signal": "Signal",
    "readings.lastUpdate": "Last Update",
    "signal.excellent": "Excellent",
    "signal.good": "Good",
    "signal.weak": "Weak",
    "signal.unknown": "Unknown",

    "sensors.title": "Sensor Configuration",
    "sensors.subtitle": "Manage deployed nodes and their settings",
    "sensors.add": "Add Sensor",
    "sensors.deployed": "Deployed Nodes",
    "sensors.status.online": "Online",
    "sensors.status.degraded": "Degraded",
    "sensors.status.offline": "Offline",
    "sensors.location": "Location",
    "sensors.type": "Type",
    "sensors.interval": "Reading Interval",
    "sensors.firmware": "Firmware",
    "sensors.charging": "Charging",

    "settings.title": "Settings",
    "settings.subtitle": "Application, field and backend configuration",
    "settings.appearance": "Appearance",
    "settings.appearance.sub": "Theme, language and measurement units",
    "settings.theme": "Theme",
    "settings.language": "Language",
    "settings.units": "Units",
    "settings.units.metric": "Metric (SI)",
    "settings.units.imperial": "Imperial",
    "settings.field": "Field Location",
    "settings.field.sub": "Coordinates used for weather and maps",
    "settings.latitude": "Latitude",
    "settings.longitude": "Longitude",
    "settings.backend": "Backend & Data",
    "settings.backend.sub": "API endpoint and refresh frequency",
    "settings.backendUrl": "Backend URL",
    "settings.refreshInterval": "Refresh Interval",
    "settings.seconds": "{n} sec",
    "settings.minute": "{n} min",
    "settings.minutes": "{n} min",
  },

  "pt-BR": {
    "sector.climate": "Clima",
    "sector.readings": "Leituras",
    "sector.settings": "Configurações",

    "theme.light": "Claro",
    "theme.dark": "Escuro",
    "theme.sunset": "Pôr do sol",
    "theme.neon": "Neon",
    "status.online": "Online",

    "app.loading": "Carregando dados do campo…",
    "app.error": "Não foi possível carregar os dados: {message}",

    "wmo.0": "Céu limpo",
    "wmo.1": "Poucas nuvens",
    "wmo.2": "Parcialmente nublado",
    "wmo.3": "Nublado",
    "wmo.45": "Nevoeiro",
    "wmo.48": "Nevoeiro com gelo",
    "wmo.51": "Garoa fraca",
    "wmo.53": "Garoa moderada",
    "wmo.55": "Garoa densa",
    "wmo.56": "Garoa congelante fraca",
    "wmo.57": "Garoa congelante densa",
    "wmo.61": "Chuva fraca",
    "wmo.63": "Chuva moderada",
    "wmo.65": "Chuva forte",
    "wmo.66": "Chuva congelante fraca",
    "wmo.67": "Chuva congelante forte",
    "wmo.71": "Neve fraca",
    "wmo.73": "Neve moderada",
    "wmo.75": "Neve forte",
    "wmo.77": "Grãos de neve",
    "wmo.80": "Pancadas de chuva fracas",
    "wmo.81": "Pancadas de chuva moderadas",
    "wmo.82": "Pancadas de chuva violentas",
    "wmo.85": "Pancadas de neve fracas",
    "wmo.86": "Pancadas de neve fortes",
    "wmo.95": "Tempestade",
    "wmo.96": "Tempestade com granizo leve",
    "wmo.99": "Tempestade com granizo forte",
    "wmo.unknown": "Desconhecido",

    "map.title": "Localização do Campo",
    "map.feelsLike": "Sensação de {temp}",

    "weekly.title": "Previsão Semanal",
    "weekly.range": "próximos 7 dias",

    "cond.title": "Condições Atuais",
    "cond.now": "agora",
    "cond.wind": "Vento",
    "cond.pressure": "Pressão",
    "cond.uv": "Índice UV",
    "cond.rainfall": "Precipitação",
    "cond.cloud": "Nebulosidade",
    "cond.solar": "Solar",
    "solar.high": "Alta",
    "solar.moderate": "Moderada",
    "solar.low": "Baixa",

    "alerts.none": "Tudo dentro do normal",
    "alerts.ideal": "Condições ideais de cultivo",
    "alerts.ideal.detail": "Temperatura e umidade na faixa ideal",
    "alerts.highTemp": "Temperatura alta",
    "alerts.highTemp.detail": "{temp} — risco de estresse térmico",
    "alerts.lowTemp": "Temperatura baixa",
    "alerts.lowTemp.detail": "{temp} — risco de geada",
    "alerts.lowHumidity": "Umidade baixa",
    "alerts.lowHumidity.detail": "{humidity} — irrigação pode ser necessária",
    "alerts.highHumidity": "Umidade alta",
    "alerts.highHumidity.detail": "{humidity} — pressão de doenças elevada",
    "alerts.heavyRain": "Chuva forte prevista",
    "alerts.heavyRain.detail": "{amount}",
    "alerts.lowPressure": "Sistema de baixa pressão",
    "alerts.lowPressure.detail": "{pressure}",
    "alerts.drySoil": "Solo seco — {node}",
    "alerts.drySoil.detail": "Umidade do solo em {moisture}",
    "alerts.hotSoil": "Solo quente — {node}",
    "alerts.hotSoil.detail": "Temperatura do solo em {temp}",

    "col.field": "Campo e Clima",
    "col.humidity": "Umidade",
    "col.temperature": "Temperatura",
    "col.last24h": "últimas 24h",

    "metric.airHumidity": "Umidade do Ar",
    "metric.soilAverage": "Média do Solo",
    "metric.air": "Ar",
    "chart.relativeHumidity": "Umidade Relativa",
    "chart.temperature": "Temperatura",
    "node.air": "Ar",
    "node.soil": "{node} solo",
    "node.soilMoisture": "Umidade do solo · {time}",
    "node.soilTemp": "Temp. do solo · {time}",
    "node.airDeltaHumidity": "Open-Meteo · {delta}% desde 24h",
    "node.airDeltaTemp": "Open-Meteo · {delta}° desde 24h",

    "time.unknown": "desconhecido",
    "time.justNow": "agora",
    "time.secondsAgo": "há {n}s",
    "time.minutesAgo": "há {n}min",
    "time.hoursAgo": "há {n}h",
    "time.daysAgo": "há {n}d",

    "readings.title": "Leituras dos Sensores",
    "readings.subtitle": "Condições do solo ao vivo dos nós implantados",
    "readings.activeNodes": "Nós Ativos",
    "readings.live": "Leituras ao Vivo",
    "readings.empty": "Nenhum nó de sensor conectado",
    "readings.node": "Nó",
    "readings.soilMoisture": "Umidade do Solo",
    "readings.soilTemp": "Temp. do Solo",
    "readings.signal": "Sinal",
    "readings.lastUpdate": "Última Atualização",
    "signal.excellent": "Excelente",
    "signal.good": "Bom",
    "signal.weak": "Fraco",
    "signal.unknown": "Desconhecido",

    "sensors.title": "Configuração dos Sensores",
    "sensors.subtitle": "Gerencie os nós implantados e suas configurações",
    "sensors.add": "Adicionar Sensor",
    "sensors.deployed": "Nós Implantados",
    "sensors.status.online": "Online",
    "sensors.status.degraded": "Degradado",
    "sensors.status.offline": "Offline",
    "sensors.location": "Localização",
    "sensors.type": "Tipo",
    "sensors.interval": "Intervalo de Leitura",
    "sensors.firmware": "Firmware",
    "sensors.charging": "Carregando",

    "settings.title": "Configurações",
    "settings.subtitle": "Configuração do aplicativo, campo e backend",
    "settings.appearance": "Aparência",
    "settings.appearance.sub": "Tema, idioma e unidades de medida",
    "settings.theme": "Tema",
    "settings.language": "Idioma",
    "settings.units": "Unidades",
    "settings.units.metric": "Métrico (SI)",
    "settings.units.imperial": "Imperial",
    "settings.field": "Localização do Campo",
    "settings.field.sub": "Coordenadas usadas para clima e mapas",
    "settings.latitude": "Latitude",
    "settings.longitude": "Longitude",
    "settings.backend": "Backend e Dados",
    "settings.backend.sub": "Endpoint da API e frequência de atualização",
    "settings.backendUrl": "URL do Backend",
    "settings.refreshInterval": "Intervalo de Atualização",
    "settings.seconds": "{n} seg",
    "settings.minute": "{n} min",
    "settings.minutes": "{n} min",
  },
};

let cache: { locale: string; table: Dictionary } | null = null;

function dict(): Dictionary {
  const locale = getConfig().locale;
  if (!cache || cache.locale !== locale) {
    cache = {
      locale,
      table: DICTIONARIES[locale] || DICTIONARIES.en,
    };
  }
  return cache.table;
}

export type TranslationVars = Record<string, string | number>;

export function t(key: string, vars?: TranslationVars): string {
  let str = dict()[key];
  if (str === undefined) str = DICTIONARIES.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  const locale = getConfig().locale;
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatWeekday(date: Date): string {
  const locale = getConfig().locale;
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
}

export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return t("time.unknown");
  const ms = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(ms / 1000);
  if (secs < 10) return t("time.justNow");
  if (secs < 60) return t("time.secondsAgo", { n: secs });
  const mins = Math.floor(secs / 60);
  if (mins < 60) return t("time.minutesAgo", { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("time.hoursAgo", { n: hrs });
  const days = Math.floor(hrs / 24);
  return t("time.daysAgo", { n: days });
}

export function getUnits(): string {
  return getConfig().units;
}

export function temp(value: number): number {
  return getUnits() === "imperial" ? (value * 9) / 5 + 32 : value;
}

export function tempSymbol(): string {
  return getUnits() === "imperial" ? "°F" : "°C";
}

export function speed(value: number): number {
  return getUnits() === "imperial" ? value * 0.621371 : value;
}

export function speedSymbol(): string {
  return getUnits() === "imperial" ? "mph" : "km/h";
}

export function precip(value: number): number {
  return getUnits() === "imperial" ? value * 0.0393701 : value;
}

export function precipSymbol(): string {
  return getUnits() === "imperial" ? "in" : "mm";
}

export function pressure(value: number): number {
  return getUnits() === "imperial" ? value * 0.02953 : value;
}

export function pressureSymbol(): string {
  return getUnits() === "imperial" ? "inHg" : "hPa";
}

export function formatTemp(value: number, digits = 1): string {
  return `${formatNumber(temp(value), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}${tempSymbol()}`;
}

export function formatSpeedKmh(value: number): string {
  return `${formatNumber(speed(value), { maximumFractionDigits: 1 })} ${speedSymbol()}`;
}

export function formatPressure(value: number): string {
  return `${formatNumber(pressure(value), { maximumFractionDigits: 0 })} ${pressureSymbol()}`;
}

export function formatRain(value: number): string {
  return `${formatNumber(precip(value), { maximumFractionDigits: 1 })} ${precipSymbol()}`;
}
