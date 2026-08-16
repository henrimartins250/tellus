import { setConfig, THEMES, LOCALES, UNITS, REFRESH_OPTIONS } from "../config";
import type { AppConfig } from "../config";
import { t, formatNumber } from "../i18n";
import type { AppState } from "../store";
import type { Block } from "../components/block";

const MOCK_SENSORS = [
  { id: "alpha-1", name: "Alpha-1", location: "North Field", type: "soil-probe", status: "online", battery: 82, firmware: "1.4.2", interval: "10m", metrics: ["moisture", "temperature"] },
  { id: "alpha-2", name: "Alpha-2", location: "North Field", type: "soil-probe", status: "online", battery: 64, firmware: "1.4.2", interval: "10m", metrics: ["moisture", "temperature"] },
  { id: "bravo-1", name: "Bravo-1", location: "South Field", type: "climate-node", status: "degraded", battery: 18, firmware: "1.3.0", interval: "5m", metrics: ["moisture", "temperature", "humidity"] },
  { id: "charlie-1", name: "Charlie-1", location: "West Field", type: "soil-probe", status: "offline", battery: 0, firmware: "1.2.1", interval: "15m", metrics: ["moisture", "temperature"] },
];

const STATUS_META: Record<string, { key: string; icon: string }> = {
  online: { key: "sensors.status.online", icon: "check_circle" },
  degraded: { key: "sensors.status.degraded", icon: "warning" },
  offline: { key: "sensors.status.offline", icon: "error" },
};

/**
 * Settings view block.
 *
 * Builds the configuration forms once and commits changes through setConfig
 * (the config controller). Rebuilds its DOM only when locale/units change so
 * the translated labels stay in sync; otherwise it only syncs the theme
 * buttons active state from the Store.
 */
export class SettingsBlock implements Block {
  readonly id = "settings";
  readonly title = "Settings";

  private root: HTMLElement | null = null;
  private themeButtons: HTMLButtonElement[] = [];
  private rendered: { locale: string; units: string } | null = null;

  destroy(): void {
    this.root = null;
    this.themeButtons = [];
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

    const { locale, units, theme } = currentState.config;
    const displayChanged =
      !this.rendered ||
      this.rendered.locale !== locale ||
      this.rendered.units !== units;

    if (displayChanged) {
      this.rendered = { locale, units };
      this.renderPage(currentState.config);
      return;
    }

    this.syncThemeButtons(theme);
  }

  syncThemeButtons(activeTheme: string): void {
    this.themeButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === activeTheme);
    });
  }

  renderPage(config: AppConfig): void {
    if (!this.root) return;
    this.themeButtons = [];
    this.root.innerHTML = "";
    this.root.appendChild(this.renderHeader());
    this.root.appendChild(this.buildAppearance(config));
    this.root.appendChild(this.buildField(config));
    this.root.appendChild(this.buildBackend(config));
    this.root.appendChild(this.renderSensors());
  }

  renderHeader(): HTMLElement {
    const section = document.createElement("section");
    section.className = "readings-header";
    section.innerHTML = `
      <div>
        <h2 class="readings-title">${t("settings.title")}</h2>
        <p class="readings-subtitle">${t("settings.subtitle")}</p>
      </div>
    `;
    return section;
  }

  buildSection(title: string, sub: string, icon: string, content: HTMLElement): HTMLElement {
    const section = document.createElement("section");
    section.className = "settings-section";
    section.innerHTML = `
      <div class="settings-section-head">
        <span class="material-symbols-outlined settings-section-icon">${icon}</span>
        <div>
          <div class="settings-section-title">${title}</div>
          <div class="settings-section-sub">${sub}</div>
        </div>
      </div>
    `;
    section.appendChild(content);
    return section;
  }

  buildSelect(
    labelKey: string,
    options: { id: string; key?: string; label?: string }[],
    current: string,
    onCommit: (value: string) => void,
  ): HTMLLabelElement {
    const field = document.createElement("label");
    field.className = "settings-field";
    const label = document.createElement("span");
    label.className = "settings-label";
    label.textContent = t(labelKey);
    const select = document.createElement("select");
    select.className = "settings-select";
    options.forEach((opt) => {
      const el = document.createElement("option");
      el.value = opt.id;
      el.textContent = opt.label || (opt.key ? t(opt.key) : "");
      select.appendChild(el);
    });
    select.value = current;
    select.addEventListener("change", () => onCommit(select.value));
    field.append(label, select);
    return field;
  }

  buildNumberInput(
    labelKey: string,
    current: number,
    opts: { min?: number; max?: number; step?: number | string },
    onCommit: (value: number) => void,
  ): HTMLLabelElement {
    const field = document.createElement("label");
    field.className = "settings-field";
    const label = document.createElement("span");
    label.className = "settings-label";
    label.textContent = t(labelKey);
    const input = document.createElement("input");
    input.className = "settings-input";
    input.type = "number";
    input.step = opts.step === undefined ? "any" : String(opts.step);
    if (opts.min !== undefined) input.min = String(opts.min);
    if (opts.max !== undefined) input.max = String(opts.max);
    input.value = String(current);
    input.addEventListener("change", () => {
      const parsed = parseFloat(input.value);
      if (Number.isFinite(parsed)) onCommit(parsed);
    });
    field.append(label, input);
    return field;
  }

  buildTextInput(labelKey: string, current: string, onCommit: (value: string) => void): HTMLLabelElement {
    const field = document.createElement("label");
    field.className = "settings-field";
    const label = document.createElement("span");
    label.className = "settings-label";
    label.textContent = t(labelKey);
    const input = document.createElement("input");
    input.className = "settings-input";
    input.type = "text";
    input.spellcheck = false;
    input.value = current;
    input.addEventListener("change", () => onCommit(input.value.trim()));
    field.append(label, input);
    return field;
  }

  buildAppearance(config: AppConfig): HTMLElement {
    const content = document.createElement("div");
    content.className = "settings-grid";

    const themeField = document.createElement("div");
    themeField.className = "settings-field settings-field-theme";
    const themeLabel = document.createElement("span");
    themeLabel.className = "settings-label";
    themeLabel.textContent = t("settings.theme");
    const themeGrid = document.createElement("div");
    themeGrid.className = "theme-grid";
    THEMES.forEach((th) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `theme-btn${config.theme === th.id ? " active" : ""}`;
      btn.dataset.theme = th.id;
      btn.innerHTML = `<span class="theme-swatch" style="background:${th.swatch}"></span><span>${t(`theme.${th.id}`)}</span>`;
      btn.addEventListener("click", () => setConfig({ theme: th.id }));
      themeGrid.appendChild(btn);
      this.themeButtons.push(btn);
    });
    themeField.append(themeLabel, themeGrid);

    const langField = this.buildSelect(
      "settings.language",
      LOCALES,
      config.locale,
      (v) => setConfig({ locale: v }),
    );
    const unitsField = this.buildSelect(
      "settings.units",
      UNITS,
      config.units,
      (v) => setConfig({ units: v }),
    );

    content.append(themeField, langField, unitsField);
    return this.buildSection(
      t("settings.appearance"),
      t("settings.appearance.sub"),
      "palette",
      content,
    );
  }

  buildField(config: AppConfig): HTMLElement {
    const content = document.createElement("div");
    content.className = "settings-grid";
    content.append(
      this.buildNumberInput("settings.latitude", config.lat, { min: -90, max: 90, step: 0.0001 }, (v) => setConfig({ lat: v })),
      this.buildNumberInput("settings.longitude", config.lon, { min: -180, max: 180, step: 0.0001 }, (v) => setConfig({ lon: v })),
    );
    return this.buildSection(
      t("settings.field"),
      t("settings.field.sub"),
      "location_on",
      content,
    );
  }

  buildBackend(config: AppConfig): HTMLElement {
    const content = document.createElement("div");
    content.className = "settings-grid";

    const urlField = this.buildTextInput(
      "settings.backendUrl",
      config.backendUrl,
      (v) => setConfig({ backendUrl: v }),
    );

    const intervalField = document.createElement("label");
    intervalField.className = "settings-field";
    const intervalLabel = document.createElement("span");
    intervalLabel.className = "settings-label";
    intervalLabel.textContent = t("settings.refreshInterval");
    const intervalSelect = document.createElement("select");
    intervalSelect.className = "settings-select";
    REFRESH_OPTIONS.forEach((opt) => {
      const el = document.createElement("option");
      el.value = String(opt.value);
      const mins = opt.value / 60000;
      if (mins < 1) {
        el.textContent = t("settings.seconds", { n: opt.value / 1000 });
      } else {
        el.textContent = t(mins === 1 ? "settings.minute" : "settings.minutes", {
          n: formatNumber(mins, { maximumFractionDigits: 0 }),
        });
      }
      intervalSelect.appendChild(el);
    });
    intervalSelect.value = String(config.refreshInterval);
    intervalSelect.addEventListener("change", () => {
      setConfig({ refreshInterval: parseInt(intervalSelect.value, 10) });
    });
    intervalField.append(intervalLabel, intervalSelect);

    content.append(urlField, intervalField);
    return this.buildSection(
      t("settings.backend"),
      t("settings.backend.sub"),
      "dns",
      content,
    );
  }

  renderSensors(): HTMLElement {
    const section = document.createElement("section");
    const head = document.createElement("div");
    head.className = "settings-section-head";
    head.innerHTML = `
      <span class="material-symbols-outlined settings-section-icon">sensors</span>
      <div>
        <div class="settings-section-title">${t("sensors.deployed")}</div>
        <div class="settings-section-sub">${t("sensors.subtitle")}</div>
      </div>
      <button class="sensors-add" aria-label="${t("sensors.add")}">
        <span class="material-symbols-outlined">add</span> ${t("sensors.add")}
      </button>
    `;
    section.appendChild(head);

    const grid = document.createElement("div");
    grid.className = "sensors-grid";
    MOCK_SENSORS.forEach((s) => {
      const status = STATUS_META[s.status] || STATUS_META.offline;
      const card = document.createElement("div");
      card.className = `sensor-card sensor-card-${s.status}`;
      card.innerHTML = `
        <div class="sensor-card-head">
          <div class="sensor-card-title">
            <span class="sensor-card-name">${s.name}</span>
            <span class="sensor-card-id">${s.id}</span>
          </div>
          <span class="sensor-status-pill ${s.status}">
            <span class="material-symbols-outlined">${status.icon}</span>
            ${t(status.key)}
          </span>
        </div>
        <div class="sensor-card-body">
          <div class="sensor-card-row">
            <span class="sensor-card-label">${t("sensors.location")}</span>
            <span class="sensor-card-value">${s.location}</span>
          </div>
          <div class="sensor-card-row">
            <span class="sensor-card-label">${t("sensors.type")}</span>
            <span class="sensor-card-value">${s.type}</span>
          </div>
          <div class="sensor-card-row">
            <span class="sensor-card-label">${t("sensors.interval")}</span>
            <span class="sensor-card-value">${s.interval}</span>
          </div>
          <div class="sensor-card-row">
            <span class="sensor-card-label">${t("sensors.firmware")}</span>
            <span class="sensor-card-value">${s.firmware}</span>
          </div>
        </div>
        <div class="sensor-card-footer">
          <div class="sensor-battery">
            <span class="sensor-battery-icon"><span class="material-symbols-outlined">battery_full</span></span>
            <span class="sensor-battery-text">${s.battery > 0 ? s.battery + "%" : t("sensors.charging")}</span>
          </div>
          <div class="sensor-metrics">
            ${s.metrics.map((m) => `<span class="sensor-metric">${m}</span>`).join("")}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
    section.appendChild(grid);
    return section;
  }
}
