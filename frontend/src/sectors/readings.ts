import { t, formatRelativeTime, formatTemp } from "../i18n";
import type { SensorReadingResponse } from "../types/generated/SensorReading";
import type { AppState } from "../store";
import type { Block } from "../components/block";

type SignalLevel = "unknown" | "excellent" | "good" | "weak";

function getSignalLevel(isoString: string | null | undefined): SignalLevel {
  if (!isoString) return "unknown";
  const ms = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(ms / 1000);
  if (secs < 120) return "excellent";
  if (secs < 3600) return "good";
  return "weak";
}

type MoistureLevel = "dry" | "saturated" | "optimal";

function getMoistureLevel(v: number): MoistureLevel {
  if (v < 30) return "dry";
  if (v > 70) return "saturated";
  return "optimal";
}

/**
 * Readings view block.
 *
 * Renders the live sensor table from the central Store. Network requests are
 * delegated to the telemetry controller through `onRefresh`; this block never
 * fetches data itself.
 */
export class ReadingsBlock implements Block {
  readonly id = "readings";
  readonly title = "Readings";

  private root: HTMLElement | null = null;
  private rendered: {
    lastUpdated: number | null;
    locale: string;
    units: string;
  } | null = null;

  constructor(private readonly onRefresh: () => void) {}

  destroy(): void {
    this.root = null;
    this.rendered = null;
  }

  mount(parentContainer: HTMLElement): void {
    const page = document.createElement("div");
    page.className = "page";
    parentContainer.appendChild(page);
    this.root = page;
  }

  update(currentState: Readonly<AppState>): void {
    if (!this.root) return;

    const signature = {
      lastUpdated: currentState.lastUpdated,
      locale: currentState.config.locale,
      units: currentState.config.units,
    };
    if (
      this.rendered &&
      this.rendered.lastUpdated === signature.lastUpdated &&
      this.rendered.locale === signature.locale &&
      this.rendered.units === signature.units
    ) {
      return;
    }
    this.rendered = signature;

    this.root.innerHTML = "";
    this.root.appendChild(this.renderHeader(currentState.latestReadings));
    this.root.appendChild(this.renderTable(currentState.latestReadings));
  }

  renderHeader(readings: SensorReadingResponse[]): HTMLElement {
    const section = document.createElement("section");
    const count = readings.length;
    section.className = "readings-header";
    section.innerHTML = `
      <div>
        <h2 class="readings-title">${t("readings.title")}</h2>
        <p class="readings-subtitle">
          ${t("readings.subtitle")}
        </p>
      </div>
      <div class="readings-stats">
        <div class="readings-stat">
          <span class="readings-stat-value">${count}</span>
          <span class="readings-stat-label">${t("readings.activeNodes")}</span>
        </div>
        <button class="readings-refresh" aria-label="${t("readings.title")}">
          <span class="material-symbols-outlined">refresh</span>
        </button>
      </div>
    `;

    section
      .querySelector<HTMLElement>(".readings-refresh")!
      .addEventListener("click", () => this.onRefresh());

    return section;
  }

  renderTable(readings: SensorReadingResponse[]): HTMLElement {
    const section = document.createElement("section");
    section.innerHTML = `<div class="section-label">${t("readings.live")}</div>`;

    if (!readings || readings.length === 0) {
      const el = document.createElement("div");
      el.className = "error-banner";
      el.innerHTML = `<span class="material-symbols-outlined">wifi_off</span> ${t("readings.empty")}`;
      section.appendChild(el);
      return section;
    }

    const table = document.createElement("table");
    table.className = "readings-table";

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>${t("readings.node")}</th>
        <th>${t("readings.soilMoisture")}</th>
        <th>${t("readings.soilTemp")}</th>
        <th>${t("readings.signal")}</th>
        <th>${t("readings.lastUpdate")}</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    readings.forEach((s) => {
      const moistureLevel = getMoistureLevel(s.soil_moisture);
      const signal = getSignalLevel(s.timestamp);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="readings-node">
          <span class="readings-node-icon"><span class="material-symbols-outlined">sensors</span></span>
          <span class="readings-node-name">${s.node_id}</span>
        </td>
        <td>
          <span class="readings-moisture ${moistureLevel}">
            ${s.soil_moisture ? s.soil_moisture.toFixed(1) : "—"}%
          </span>
        </td>
        <td>${s.soil_temperature ? formatTemp(s.soil_temperature) : "—"}</td>
        <td><span class="readings-signal ${signal}">${t(`signal.${signal}`)}</span></td>
        <td class="readings-time">${formatRelativeTime(s.timestamp)}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    section.appendChild(table);
    return section;
  }
}
