import { createColumns } from "./layout";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Chart from "chart.js/auto";
import type { ScriptableContext } from "chart.js";
import type { SensorReadingResponse } from "../types/generated/SensorReading";
import type { OpenMeteoWeather } from "../services/weather";
import type { AppState } from "../store";
import type { Block } from "../components/block";
import {
  t,
  formatNumber,
  formatWeekday,
  formatRelativeTime,
  formatTemp,
  formatSpeedKmh,
  formatPressure,
  formatRain,
  temp,
  tempSymbol,
} from "../i18n";

const WMO_CODES: Record<number, { icon: string }> = {
  0: { icon: "sunny" },
  1: { icon: "sunny" },
  2: { icon: "partly_cloudy_day" },
  3: { icon: "cloud" },
  45: { icon: "foggy" },
  48: { icon: "foggy" },
  51: { icon: "rainy_light" },
  53: { icon: "rainy_light" },
  55: { icon: "rainy_light" },
  56: { icon: "weather_snowy" },
  57: { icon: "weather_snowy" },
  61: { icon: "rainy" },
  63: { icon: "rainy" },
  65: { icon: "rainy" },
  66: { icon: "weather_snowy" },
  67: { icon: "weather_snowy" },
  71: { icon: "weather_snowy" },
  73: { icon: "weather_snowy" },
  75: { icon: "weather_snowy" },
  77: { icon: "weather_snowy" },
  80: { icon: "rainy" },
  81: { icon: "rainy" },
  82: { icon: "rainy" },
  85: { icon: "weather_snowy" },
  86: { icon: "weather_snowy" },
  95: { icon: "thunderstorm" },
  96: { icon: "thunderstorm" },
  99: { icon: "thunderstorm" },
};

function getDefault(code: number): { label: string; icon: string } {
  const entry = WMO_CODES[code];
  return { label: t(`wmo.${code}`), icon: entry ? entry.icon : "help" };
}

const WIND_DIRECTIONS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

// itd be cool if we displayed a radial visualizer toghether with this
function getWindDirection(deg: number): string {
  const index = Math.round(deg / 22.5) % 16;
  return WIND_DIRECTIONS[index];
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

const SERIES_COLORS: Record<string, string | null> = {
  air: null,
  n1: "#F59E0B",
  n2: "#0284C7",
};

interface AlertItem {
  type: "success" | "warning" | "danger" | "info";
  icon: string;
  text: string;
  detail: string;
}

interface ChartDataset {
  key: string;
  label: string;
  data: (number | null)[];
  borderColor?: string;
}

interface ChartCardConfig {
  title: string;
  range: string;
  labels: string[];
  datasets: ChartDataset[];
  suggestedMin?: number;
  suggestedMax?: number;
}

interface NodeRow {
  dot: string;
  name: string;
  sub: string;
  value: string;
}

interface LegendItem {
  cls: string;
  label: string;
}

export class ClimateBlock implements Block {
  readonly id = "climate";
  readonly title = "Climate";

  private charts: Chart[] = [];
  private pendingCharts: (() => Chart)[] = [];
  private map: L.Map | null = null;
  private root: HTMLElement | null = null;
  private rendered: {
    lastUpdated: number | null;
    weather: OpenMeteoWeather | null;
    locale: string;
    units: string;
  } = { lastUpdated: null, weather: null, locale: "", units: "" };

  destroy(): void {
    this.destroyCharts();
    this.destroyMap();
    this.root = null;
    this.rendered = {
      lastUpdated: null,
      weather: null,
      locale: "",
      units: "",
    };
  }

  destroyCharts() {
    this.charts.forEach((c) => c.destroy());
    this.charts.length = 0;
    this.pendingCharts.length = 0;
  }

  destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  groupHistory(
    history: SensorReadingResponse[],
  ): Record<string, SensorReadingResponse[]> {
    const byNode: Record<string, SensorReadingResponse[]> = {};
    (history || []).forEach((r) => {
      if (!byNode[r.node_id]) byNode[r.node_id] = [];
      byNode[r.node_id].push(r);
    });
    return byNode;
  }

  padSeries(values: number[], len: number): (number | null)[] {
    const arr: (number | null)[] = values.slice(-len);
    while (arr.length < len) arr.unshift(null);
    return arr;
  }

  initMap(root: HTMLElement, lat: number, lon: number) {
    const el = root.querySelector<HTMLElement>(".map-leaflet");
    if (!el) return;

    const map = L.map(el, { attributionControl: true }).setView([lat, lon], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.circleMarker([lat, lon], {
      radius: 7,
      color: "#ffffff",
      weight: 2,
      fillColor: this.getThemeColor("--primary") || "#15803D",
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup(t("map.title"));

    this.map = map;
  }

  // we can make the parameters more verbose currently i cant really tell whats happening
  getThemeColor(variable: string): string | null {
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim() || null
    );
  }

  renderMapCard(weather: OpenMeteoWeather): HTMLDivElement {
    const info = getDefault(weather.current.weather_code);
    const currentTemp = formatNumber(temp(weather.current.temperature_2m), {
      maximumFractionDigits: 1,
    });
    const card = document.createElement("div");
    card.className = "map-card";
    card.innerHTML = `
      <div class="map-card-head">
        <h2 class="map-title">${t("map.title")}</h2>
        <span class="map-badge"><span class="map-badge-dot"></span> ${info.label}</span>
      </div>
      <div class="map-leaflet"></div>
      <div class="map-weather-now">
        <span class="material-symbols-outlined">${info.icon}</span>
        <span class="map-weather-temp">${currentTemp}°</span>
        <div class="map-weather-meta">
          <span class="map-weather-cond">${info.label}</span>
          <span class="map-weather-feels">${t("map.feelsLike", {
            temp: `${formatNumber(temp(weather.current.apparent_temperature), {
              maximumFractionDigits: 1,
            })}°`,
          })}</span>
        </div>
      </div>
    `;
    return card;
  }

  renderWeeklyTrend(weather: OpenMeteoWeather): HTMLDivElement {
    const daily = weather.daily;
    const card = document.createElement("div");
    card.className = "weekly-card";
    card.innerHTML = `
      <div class="chart-head">
        <span class="chart-title">${t("weekly.title")}</span>
        <span class="chart-range">${t("weekly.range")}</span>
      </div>
      <div class="weekly-strip">
        ${daily.time
          .map((date, i) => {
            const info = getDefault(daily.weather_code[i]);
            const day = new Date(`${date}T00:00:00`);
            return `
          <div class="weekly-day" title="${info.label}">
            <span class="weekly-dow">${formatWeekday(day)}</span>
            <span class="material-symbols-outlined weekly-icon">${info.icon}</span>
            <span class="weekly-temp-max">${formatNumber(
              temp(daily.temperature_2m_max[i]),
              { maximumFractionDigits: 0 },
            )}°</span>
            <span class="weekly-temp-min">${formatNumber(
              temp(daily.temperature_2m_min[i]),
              { maximumFractionDigits: 0 },
            )}°</span>
            <span class="weekly-rain">${formatRain(daily.precipitation_sum[i] || 0)}</span>
          </div>
        `;
          })
          .join("")}
      </div>
    `;
    return card;
  }

  // the cards as a grid is not looking good, i think we should also group them inside a bigger block and separate cleanly like a table

  renderCondTable(weather: OpenMeteoWeather): HTMLDivElement {
    const c = weather.current;
    const windDir = getWindDirection(c.wind_direction_10m);
    const cloud = c.cloud_cover;
    const rows = [
      { icon: "air", label: t("cond.wind"), value: `${formatSpeedKmh(c.wind_speed_10m)} ${windDir}` },
      { icon: "speed", label: t("cond.pressure"), value: formatPressure(c.pressure_msl) },
      { icon: "sunny", label: t("cond.uv"), value: formatNumber(c.uv_index, { maximumFractionDigits: 1 }) },
      { icon: "rainy", label: t("cond.rainfall"), value: formatRain(c.precipitation) },
      { icon: "cloud", label: t("cond.cloud"), value: `${c.cloud_cover}%` },
      {
        icon: "wb_twilight",
        label: t("cond.solar"),
        value: cloud < 30 ? t("solar.high") : cloud < 70 ? t("solar.moderate") : t("solar.low"),
      },
    ];

    const table = document.createElement("div");
    table.className = "cond-table";
    table.innerHTML = `
      <div class="cond-table-head">
        <span class="cond-table-title">${t("cond.title")}</span>
        <span class="cond-table-sub">${t("cond.now")}</span>
      </div>
      ${rows
        .map(
          (r) => `
        <div class="cond-row">
          <span class="cond-row-label"><span class="material-symbols-outlined">${r.icon}</span>${r.label}</span>
          <span class="cond-row-value">${r.value}</span>
        </div>
      `,
        )
        .join("")}
    `;
    return table;
  }

  generateAlerts(
    weather: OpenMeteoWeather,
    sensors: SensorReadingResponse[],
  ): AlertItem[] {
    const alerts: AlertItem[] = [];
    const c = weather.current;
    const tempC = c.temperature_2m;
    const humidity = c.relative_humidity_2m;
    const precipC = c.precipitation;
    const pressureC = c.pressure_msl;

    // we can do this better later, probably implement a lookup table
    // and proper check functions
    if (tempC >= 20 && tempC <= 30 && humidity >= 40 && humidity <= 70) {
      alerts.push({
        type: "success",
        icon: "check_circle",
        text: t("alerts.ideal"),
        detail: t("alerts.ideal.detail"),
      });
    }
    if (tempC > 35) {
      alerts.push({
        type: "danger",
        icon: "warning",
        text: t("alerts.highTemp"),
        detail: t("alerts.highTemp.detail", { temp: formatTemp(tempC) }),
      });
    }
    if (tempC < 5) {
      alerts.push({
        type: "danger",
        icon: "warning",
        text: t("alerts.lowTemp"),
        detail: t("alerts.lowTemp.detail", { temp: formatTemp(tempC) }),
      });
    }
    if (humidity < 25) {
      alerts.push({
        type: "warning",
        icon: "warning",
        text: t("alerts.lowHumidity"),
        detail: t("alerts.lowHumidity.detail", { humidity: `${humidity}%` }),
      });
    }
    if (humidity > 85) {
      alerts.push({
        type: "warning",
        icon: "warning",
        text: t("alerts.highHumidity"),
        detail: t("alerts.highHumidity.detail", { humidity: `${humidity}%` }),
      });
    }
    if (precipC > 5) {
      alerts.push({
        type: "warning",
        icon: "rainy",
        text: t("alerts.heavyRain"),
        detail: t("alerts.heavyRain.detail", { amount: formatRain(precipC) }),
      });
    }
    if (pressureC < 1005) {
      alerts.push({
        type: "info",
        icon: "speed",
        text: t("alerts.lowPressure"),
        detail: t("alerts.lowPressure.detail", { pressure: formatPressure(pressureC) }),
      });
    }

    (sensors || []).forEach((s) => {
      if (s.soil_moisture < 30) {
        alerts.push({
          type: "warning",
          icon: "water_drop",
          text: t("alerts.drySoil", { node: s.node_id }),
          detail: t("alerts.drySoil.detail", { moisture: `${s.soil_moisture.toFixed(0)}%` }),
        });
      }
      if (s.soil_temperature > 35) {
        alerts.push({
          type: "warning",
          icon: "thermostat",
          text: t("alerts.hotSoil", { node: s.node_id }),
          detail: t("alerts.hotSoil.detail", { temp: formatTemp(s.soil_temperature) }),
        });
      }
    });

    return alerts.slice(0, 3);
  }
  // i think the way alerts are being handled is pretty coherent, not much here for now, my only concern is them possibly getting cluttered
  renderAlerts(
    weather: OpenMeteoWeather,
    sensors: SensorReadingResponse[],
  ): HTMLDivElement {
    const alerts = this.generateAlerts(weather, sensors);
    const list = document.createElement("div");
    list.className = "alert-list";

    if (alerts.length === 0) {
      list.innerHTML = `
        <div class="alert-row success">
          <span class="material-symbols-outlined">check_circle</span>
          <div><div class="alert-text">${t("alerts.none")}</div></div>
        </div>
      `;
      return list;
    }

    list.innerHTML = alerts
      .map(
        (a) => `
      <div class="alert-row ${a.type}">
        <span class="material-symbols-outlined">${a.icon}</span>
        <div>
          <div class="alert-text">${a.text}</div>
          <div class="alert-detail">${a.detail}</div>
        </div>
      </div>
    `,
      )
      .join("");
    return list;
  }

  renderMetricHero(
    primary: string,
    primaryLabel: string,
    primarySub: string,
    secondary: string,
    secondaryLabel: string,
    secondarySub: string,
  ): HTMLDivElement {
    const hero = document.createElement("div");
    hero.className = "metric-hero";
    hero.innerHTML = `
      <div class="metric-card">
        <span class="metric-value">${primary}<span class="unit">${primaryLabel}</span></span>
        <span class="metric-label">${primarySub}</span>
        <span class="metric-sub"></span>
      </div>
      <div class="metric-card">
        <span class="metric-value">${secondary}<span class="unit">${secondaryLabel}</span></span>
        <span class="metric-label">${secondarySub}</span>
        <span class="metric-sub"></span>
      </div>
    `;
    return hero;
  }

  renderLegend(items: LegendItem[]): HTMLDivElement {
    const legend = document.createElement("div");
    legend.className = "chart-legend";
    legend.innerHTML = items
      .map(
        (it) =>
          `<span class="legend-item"><span class="legend-line ${it.cls}"></span>${it.label}</span>`,
      )
      .join("");
    return legend;
  }
  // the charts do need a little bit of tweaking, maybe increasing resololution...
  // they are kinda bland overall
  renderChartCard(config: ChartCardConfig): HTMLDivElement {
    const { title, range, labels, datasets, suggestedMin, suggestedMax } =
      config;
    const card = document.createElement("div");
    card.className = "chart-card";
    card.innerHTML = `
      <div class="chart-head">
        <span class="chart-title">${title}</span>
        <span class="chart-range">${range}</span>
      </div>
      <canvas></canvas>
    `;

    const canvas = card.querySelector("canvas") as HTMLCanvasElement;
    this.pendingCharts.push(() =>
      this.buildChart(canvas, labels, datasets, suggestedMin, suggestedMax),
    );
    return card;
  }

  buildChart(
    canvas: HTMLCanvasElement,
    labels: string[],
    datasets: ChartDataset[],
    suggestedMin?: number,
    suggestedMax?: number,
  ): Chart {
    const muted = this.getThemeColor("--text-muted") || "#64748B";
    const primary =
      SERIES_COLORS.air || this.getThemeColor("--primary") || "#15803D";

    datasets.forEach((ds) => {
      if (ds.key === "air") ds.borderColor = primary;
      else ds.borderColor = SERIES_COLORS[ds.key] || ds.borderColor;
    });

    const chart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: datasets.map((ds) => ({
          label: ds.label,
          data: ds.data,
          borderColor: ds.borderColor,
          backgroundColor: (ctx: ScriptableContext<"line">) =>
            this.gradientFill(ctx, ds.borderColor!),
          fill: ds.key === "air",
          borderWidth: ds.key === "air" ? 2.5 : 1.5,
          borderDash: ds.key === "air" ? [] : [4, 3],
          pointRadius: 0,
          pointHitRadius: 10,
          tension: 0.35,
          spanGaps: true,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        animation: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => `${labels[items[0].dataIndex]}h`,
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 9 },
              color: muted,
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
            },
          },
          y: {
            suggestedMin,
            suggestedMax,
            grid: { color: hexToRgba(muted, 0.12) },
            ticks: { font: { size: 9 }, color: muted, padding: 4 },
          },
        },
      },
    });
    return chart;
  }

  gradientFill(
    ctx: ScriptableContext<"line">,
    color: string,
  ): string | CanvasGradient {
    const { chartArea } = ctx.chart;
    if (!chartArea) return color;
    const g = ctx.chart.ctx.createLinearGradient(
      0,
      chartArea.top,
      0,
      chartArea.bottom,
    );
    g.addColorStop(0, hexToRgba(color, 0.16));
    g.addColorStop(1, hexToRgba(color, 0));
    return g;
  }

  initPendingCharts() {
    this.pendingCharts.forEach((fn) => this.charts.push(fn()));
    this.pendingCharts.length = 0;
  }

  renderNodeRows(rows: NodeRow[]): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.className = "node-rows";
    wrap.innerHTML = rows
      .map(
        (r) => `
      <div class="node-row">
        <span class="node-row-dot ${r.dot}"></span>
        <div class="node-row-meta">
          <span class="node-row-name">${r.name}</span>
          <span class="node-row-sub">${r.sub}</span>
        </div>
        <span class="node-row-value">${r.value}</span>
      </div>
    `,
      )
      .join("");
    return wrap;
  }

  // the collums may need their own file, they may get quite large
  buildHumidityColumn(
    weather: OpenMeteoWeather,
    byNode: Record<string, SensorReadingResponse[]>,
    latest: SensorReadingResponse[],
  ): HTMLDivElement[] {
    const hourly = weather.hourly;
    const humiditySeries = hourly.relative_humidity_2m.slice(-25);
    const labels = hourly.time
      .slice(-25)
      .map((hour) => new Date(hour).getHours().toString().padStart(2, "0"));

    const current = weather.current;
    const airDelta =
      humiditySeries[humiditySeries.length - 1] - humiditySeries[0];

    const soilVals = (latest || []).map((s) => s.soil_moisture);
    const soilAvg = mean(soilVals);

    const datasets: ChartDataset[] = [
      { key: "air", label: t("node.air"), data: humiditySeries },
    ];
    const nodeNames = Object.keys(byNode);
    nodeNames.forEach((node, i) => {
      const series = byNode[node].map((r) => r.soil_moisture);
      datasets.push({
        key: i === 0 ? "n1" : "n2",
        label: node,
        data: this.padSeries(series, 25),
      });
    });

    const blocks = [
      this.renderMetricHero(
        `${current.relative_humidity_2m.toFixed(0)}`,
        "%",
        t("metric.airHumidity"),
        soilAvg !== null ? `${soilAvg.toFixed(0)}` : "—",
        "%",
        t("metric.soilAverage"),
      ),
      this.renderChartCard({
        title: t("chart.relativeHumidity"),
        range: t("col.last24h"),
        labels,
        datasets,
        suggestedMin: 0,
        suggestedMax: 100,
      }),
      this.renderLegend([
        { cls: "air", label: t("node.air") },
        ...nodeNames.map((node, i) => ({
          cls: i === 0 ? "n1" : "n2",
          label: node,
        })),
      ]),
    ];

    const rows: NodeRow[] = [
      {
        dot: "air",
        name: t("node.air"),
        sub: t("node.airDeltaHumidity", {
          delta: `${airDelta >= 0 ? "+" : ""}${airDelta.toFixed(0)}`,
        }),
        value: `${current.relative_humidity_2m.toFixed(0)}%`,
      },
      ...nodeNames.map((node, i) => {
        const s = latest.find((r) => r.node_id === node);
        return {
          dot: i === 0 ? "n1" : "n2",
          name: node,
          sub: t("node.soilMoisture", { time: formatRelativeTime(s && s.timestamp) }),
          value: s ? `${s.soil_moisture.toFixed(0)}%` : "—",
        };
      }),
    ];
    blocks.push(this.renderNodeRows(rows));

    return blocks;
  }

  buildTemperatureColumn(
    weather: OpenMeteoWeather,
    byNode: Record<string, SensorReadingResponse[]>,
    latest: SensorReadingResponse[],
  ): HTMLDivElement[] {
    const hourly = weather.hourly;
    const tempSeries = hourly.temperature_2m.slice(-25);
    const labels = hourly.time
      .slice(-25)
      .map((hour) => new Date(hour).getHours().toString().padStart(2, "0"));

    const current = weather.current;
    const airDelta = tempSeries[tempSeries.length - 1] - tempSeries[0];

    const soilVals = (latest || []).map((s) => s.soil_temperature);
    const soilAvg = mean(soilVals);

    const datasets: ChartDataset[] = [
      { key: "air", label: t("node.air"), data: tempSeries },
    ];
    const nodeNames = Object.keys(byNode);
    nodeNames.forEach((node, i) => {
      const series = byNode[node].map((r) => r.soil_temperature);
      datasets.push({
        key: i === 0 ? "n1" : "n2",
        label: node,
        data: this.padSeries(series, 25),
      });
    });

    const blocks = [
      this.renderMetricHero(
        formatNumber(temp(current.temperature_2m), {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
        tempSymbol(),
        t("metric.air"),
        soilAvg !== null ? formatNumber(temp(soilAvg), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—",
        tempSymbol(),
        t("metric.soilAverage"),
      ),
      this.renderChartCard({
        title: t("chart.temperature"),
        range: t("col.last24h"),
        labels,
        datasets,
        suggestedMin: 15,
        suggestedMax: 35,
      }),
      this.renderLegend([
        { cls: "air", label: t("node.air") },
        ...nodeNames.map((node, i) => ({
          cls: i === 0 ? "n1" : "n2",
          label: t("node.soil", { node }),
        })),
      ]),
    ];

    const rows: NodeRow[] = [
      {
        dot: "air",
        name: t("node.air"),
        sub: t("node.airDeltaTemp", {
          delta: `${airDelta >= 0 ? "+" : ""}${formatNumber(airDelta, {
            maximumFractionDigits: 1,
          })}`,
        }),
        value: formatTemp(current.temperature_2m),
      },
      ...nodeNames.map((node, i) => {
        const s = latest.find((r) => r.node_id === node);
        return {
          dot: i === 0 ? "n1" : "n2",
          name: node,
          sub: t("node.soilTemp", { time: formatRelativeTime(s && s.timestamp) }),
          value: s
            ? formatTemp(s.soil_temperature)
            : "—",
        };
      }),
    ];
    blocks.push(this.renderNodeRows(rows));

    return blocks;
  }

  mount(parentContainer: HTMLElement): void {
    const page = document.createElement("div");
    page.className = "dashboard";
    parentContainer.appendChild(page);
    this.root = page;
  }

  update(currentState: Readonly<AppState>): void {
    if (!this.root) return;

    const { weather, loading, error } = currentState;
    if (!weather) {
      this.renderStatus(loading, error);
      return;
    }

    // Re-render only when the underlying data or display settings changed so
    // that purely cosmetic updates (e.g. theme toggles) do not rebuild charts.
    const needsRender =
      weather !== this.rendered.weather ||
      currentState.lastUpdated !== this.rendered.lastUpdated ||
      currentState.config.locale !== this.rendered.locale ||
      currentState.config.units !== this.rendered.units;

    if (!needsRender) return;

    this.rendered = {
      lastUpdated: currentState.lastUpdated,
      weather,
      locale: currentState.config.locale,
      units: currentState.config.units,
    };
    this.renderLayout(currentState);
  }

  renderStatus(loading: boolean, error: string | null): void {
    if (!this.root) return;
    this.root.innerHTML = "";
    if (error && !loading) {
      const errEl = document.createElement("div");
      errEl.className = "error-banner";
      errEl.innerHTML = `<span class="material-symbols-outlined">warning</span> ${t(
        "app.error",
        { message: error },
      )}`;
      this.root.appendChild(errEl);
    } else {
      const loadingEl = document.createElement("div");
      loadingEl.className = "loading-placeholder";
      loadingEl.innerHTML = `<div class="spinner"></div><span>${t(
        "app.loading",
      )}</span>`;
      this.root.appendChild(loadingEl);
    }
  }

  renderLayout(currentState: Readonly<AppState>): void {
    if (!this.root) return;
    const { weather, latestReadings, historyReadings, config } = currentState;
    if (!weather) return;

    this.destroyCharts();
    this.destroyMap();

    const byNode = this.groupHistory(historyReadings);
    const coordCount = `${formatNumber(config.lat, {
      maximumFractionDigits: 1,
    })}°, ${formatNumber(config.lon, { maximumFractionDigits: 1 })}°`;

    const layout = createColumns([
      {
        title: t("col.field"),
        count: coordCount,
        blocks: [
          this.renderMapCard(weather),
          this.renderWeeklyTrend(weather),
          this.renderCondTable(weather),
          this.renderAlerts(weather, latestReadings),
        ],
      },
      {
        title: t("col.humidity"),
        count: t("col.last24h"),
        blocks: this.buildHumidityColumn(weather, byNode, latestReadings),
      },
      {
        title: t("col.temperature"),
        count: t("col.last24h"),
        blocks: this.buildTemperatureColumn(weather, byNode, latestReadings),
      },
    ]);

    this.root.innerHTML = "";
    this.root.appendChild(layout);
    this.initMap(layout, config.lat, config.lon);
    this.initPendingCharts();
  }
}
