import "./style.css";
import { createBlocks, SECTOR_ICONS } from "./sectors/index";
import { setConfig, THEMES } from "./config";
import { t } from "./i18n";
import { createStore } from "./store";
import { createTelemetryController } from "./controllers/telemetry";
import { createWeatherController } from "./controllers/weather";
import type { AppState } from "./store";
import type { Block } from "./components/block";

const store = createStore();
const telemetryController = createTelemetryController(store);
const weatherController = createWeatherController(store);
const BLOCKS = createBlocks(() => telemetryController.refresh());

let currentBlock: Block | null = null;

function refreshUi(state: Readonly<AppState>) {
  const cfg = state.config;
  document.documentElement.dataset.theme = cfg.theme;
  document.documentElement.lang = cfg.locale;

  document.querySelectorAll<HTMLAnchorElement>(".side-pill").forEach((a) => {
    const id = a.dataset.sector;
    const label = a.querySelector(".side-label");
    if (label) label.textContent = t(`sector.${id}`);
    a.title = t(`sector.${id}`);
  });

  document
    .querySelectorAll<HTMLButtonElement>(".header-theme-btn")
    .forEach((btn) => {
      const id = btn.dataset.theme;
      btn.title = t(`theme.${id}`);
      btn.classList.toggle("active", id === cfg.theme);
    });

  const status = document.querySelector<HTMLElement>(".sidebar-status");
  if (status) status.title = t("status.online");
}

function setupSidebar(): HTMLElement {
  const aside = document.createElement("aside");
  aside.className = "sidebar";
  aside.innerHTML = `
    <div class="sidebar-brand" title="Tellus">
      <span class="material-symbols-outlined sidebar-logo">eco</span>
    </div>
    <nav class="sidebar-nav"></nav>
    <div class="sidebar-footer">
      <div class="header-theme"></div>
      <div class="sidebar-status" title="Online">
        <span class="status-dot"></span>
      </div>
    </div>
  `;

  const nav = aside.querySelector(".sidebar-nav") as HTMLElement;
  Object.keys(BLOCKS).forEach((id) => {
    const link = document.createElement("a");
    link.className = "side-pill";
    link.dataset.sector = id;
    link.href = "#";
    link.innerHTML = `
      <span class="material-symbols-outlined">${SECTOR_ICONS[id] || "apps"}</span>
      <span class="side-label">${t(`sector.${id}`)}</span>
    `;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      switchSector(id);
    });
    if (id === "climate") link.classList.add("active");
    nav.appendChild(link);
  });

  const theme = aside.querySelector(".header-theme") as HTMLElement;
  THEMES.forEach((th) => {
    const btn = document.createElement("button");
    btn.className = "header-theme-btn";
    btn.dataset.theme = th.id;
    btn.title = t(`theme.${th.id}`);
    btn.innerHTML = `<span class="material-symbols-outlined">${th.icon}</span>`;
    btn.addEventListener("click", () => setConfig({ theme: th.id }));
    theme.appendChild(btn);
  });

  return aside;
}

function switchSector(id: string) {
  if (currentBlock) {
    currentBlock.destroy();
    currentBlock = null;
  }

  const content = document.querySelector(".content") as HTMLElement;
  content.innerHTML = "";

  document.querySelectorAll<HTMLAnchorElement>(".side-pill").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.sector === id);
  });

  const block = BLOCKS[id];
  if (!block) return;

  currentBlock = block;
  block.mount(content);
  block.update(store.getState());
}

function init() {
  const app = document.querySelector("#app") as HTMLElement;
  const shell = document.createElement("div");
  shell.className = "app-shell";

  const content = document.createElement("main");
  content.className = "content";

  shell.appendChild(setupSidebar());
  shell.appendChild(content);
  app.appendChild(shell);

  refreshUi(store.getState());

  store.subscribe((state) => {
    refreshUi(state);
    if (currentBlock) currentBlock.update(state);
  });

  switchSector("climate");
  telemetryController.start();
  weatherController.start();
}

init();
