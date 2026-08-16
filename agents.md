# AGENTS.md — System Architecture & AI Guardrails

This document establishes strict architectural invariants, coding conventions, and verification steps for AI coding agents operating on this repository.

---

## 1. Stack Overview

- **Backend:** Rust (Axum framework)
- **Database:** libSQL (SQLite-compatible)
- **Frontend:** Plain Vanilla TypeScript (bundled with Vite, zero UI frameworks)
- **Type Bridge:** `ts-rs` (automatically exports Rust structs to TypeScript interfaces)
- **Target Device Data:** Telemetry from ESP32 environmental nodes

---

## 2. Core Architectural Invariants

### Unidirectional Data Flow (MVC Model)

1. **Model (Central Store):** Holds all application and telemetry state in memory. The DOM MUST NEVER be used as a source of state truth.
2. **Controller (Services / WebSocket):** Ingests network payloads and dispatches explicit state updates into the Store. Controllers do NOT mutate the DOM directly.
3. **View (Block Components):** Reads state from the Store and updates DOM elements. Block components MUST NOT initiate network requests directly.

```text
[ ESP32 Node ] ──▶ [ Axum API / WS ] ──▶ [ Controller Service ]
                                                │
                                                ▼ (Dispatches)
                                         [ Central Store ]
                                                │
                                                ▼ (Notifies)
                                         [ UI Block Views ]
```

### Component Contract (`Block` Interface)

Every UI element (card, graph, gauge, read-out) must implement the `Block` lifecycle interface:

```typescript
export interface Block {
  /** Unique string identifier for the block instance */
  readonly id: string;

  /** Human-readable title displayed in the card header */
  readonly title: string;

  /**
   * Mounts the HTML structure of the block into a given parent container.
   * Called once when inserting the block into a column layout.
   *
   * @param parentContainer - The DOM node (e.g., column wrapper) holding this block.
   */
  mount(parentContainer: HTMLElement): void;

  /**
   * Called whenever the central Store updates its state.
   * The component should efficiently update its internal DOM elements here.
   *
   * @param currentState - Read-only reference to the global application state.
   */
  update(currentState: Readonly<AppState>): void;

  /**
   * Cleans up all attached DOM elements, event listeners, and timers.
   * Must be called before removing a block or swapping layout columns.
   */
  destroy(): void;
}
```

---

## 3. Database Schema & Type Sharing Reference

Database tables are defined in libSQL. The `sensor_readings` table follows this schema:

```sql
CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    node_id TEXT NOT NULL,
    soil_temperature REAL NOT NULL,
    soil_moisture REAL NOT NULL,
    air_temperature REAL,
    air_humidity REAL,
    light_level REAL
);
```

### Type Contract (ts-rs)

- Do **NOT** manually create or edit TypeScript interfaces for backend DTOs or database entities.
- Annotate Rust structs with `#[derive(TS)]` and `#[ts(export)]` to automatically generate TypeScript bindings inside `src/types/generated/`.

Example Rust definition (note: `export_to` is resolved relative to the generated `bindings/` directory next to `Cargo.toml`):

```rust
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../frontend/src/types/generated/SensorReading.ts")]
pub struct SensorReading {
    pub id: i64,
    pub timestamp: String,
    pub node_id: String,
    pub soil_temperature: f64,
    pub soil_moisture: f64,
    pub air_temperature: Option<f64>,
    pub air_humidity: Option<f64>,
    pub light_level: Option<f64>,
}
```

---

## 4. Coding Conventions & Quality Guidelines

### Naming & Explanations

- **Verbose Variables:** Prefer explicit, descriptive names over short abstractions.
  - Good: `environmentalTelemetryStore`, `sensorNodeIdentifier`, `soilMoisturePercentage`
  - Bad: `s`, `id`, `val`, `data`
- **Documentation:** Provide detailed JSDoc / Doc-comments for functions and classes explaining *why* an architectural choice was made, not just *what* the code does.

### DOM & Layout Safety

- **Scoped DOM Mutations:** Use `this.element.querySelector(...)` scoped strictly within the component. Never query `document.body` or use global string IDs (`document.getElementById`) inside component logic.
- **Resource Cleanup:** When re-ordering or destroying blocks during dynamic column swaps, agents MUST ensure `.destroy()` is executed to prevent memory leaks and dangling listeners.

---

## 5. Verification Commands

Agents MUST execute and pass these verification checks before marking any task as complete.

### Frontend Verification (TypeScript / Vite)

```bash
# Verify type safety without emitting output
npx tsc --noEmit

# Verify Vite production bundling
npm run build
```

### Backend Verification (Rust / Axum)

```bash
# Verify compilation
cargo check

# Run tests — `cargo test` also auto-runs ts-rs `export_bindings`, which regenerates frontend/src/types/generated/
cargo test
```

---

## 6. Strictly Forbidden Actions

- 🚫 **NO Framework Injection:** Do NOT install or write code using React, Vue, Svelte, jQuery, or external CSS frameworks.
- 🚫 **NO Direct State Mutation:** Views must NEVER mutate `AppState` properties directly.
- 🚫 **NO Raw Network Logic in Components:** Do NOT embed `fetch()` or WebSocket code inside `Block` implementations.
- 🔒 **DO NOT MODIFY:** Database migration scripts or SQL table layouts without explicit user instruction.
