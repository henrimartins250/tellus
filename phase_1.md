# Agricultural Monitoring Platform - Phase 1

## Goal

Build a working end-to-end agricultural monitoring prototype capable of:

* Receiving data from ESP32 nodes.
* Storing data in SQLite.
* Displaying current and historical values in a web dashboard.
* Supporting multiple sensor nodes.

Success is **not** measured by complexity.

Success is:

> Sensor data successfully travels from field node to dashboard.

---

# Phase 1 Scope

## Included

### Sensor Node

* ESP32
* Soil temperature
* Soil moisture
* Air temperature/humidity (optional if sensor available)
* Light sensor (optional)

### Backend

* HTTP API
* SQLite database
* Data validation
* Historical storage

### Dashboard

* Current values
* Historical graphs
* Node identification
* Basic status indicators

---

## Not Included

### Infrastructure

* LoRa
* MQTT
* Kubernetes
* Docker Swarm
* Distributed databases

### Processing

* WASM
* AI
* Machine Learning
* Julia analysis modules
* Predictive models

### Hardware

* Solar charging
* Rain gauge
* Nutrient sensors
* Computer vision

These are future phases.

---

# Architecture

```text
ESP32 Nodes
     │
     ▼
HTTP API (Rust)
     │
     ▼
SQLite
     │
     ▼
Dashboard
```

---

# Technology Stack

## Firmware

Language:

* C

Responsibilities:

* Read sensors
* Connect to WiFi
* Send HTTP requests
* Retry on failure

---

## Backend

Language:

* Rust

Suggested libraries:

* axum
* tokio
* serde
* rusqlite

Responsibilities:

* Receive sensor data
* Validate input
* Store measurements
* Serve dashboard data

---

## Database

SQLite

Source of truth.

Raw measurements are never modified.

---

## Frontend

* HTML
* CSS
* JavaScript
* Chart.js

Responsibilities:

* Show latest values
* Show historical values
* Identify nodes

---

# Initial Database Design

## sensor_readings

```sql
id INTEGER PRIMARY KEY

timestamp DATETIME

node_id TEXT

soil_temperature REAL

soil_moisture REAL

air_temperature REAL

air_humidity REAL

light_level REAL
```

Keep schema simple.

Do not optimize prematurely.

---

# Development Order

## Step 1

Create backend.

Goal:

```text
POST /api/sensor
```

Store test values in SQLite.

No ESP32 yet.

Use curl.

---

## Step 2

Create minimal dashboard.

Goal:

Show latest database values.

No charts yet.

---

## Step 3

Connect first ESP32.

Goal:

ESP32 sends fake sensor values.

---

## Step 4

Connect real sensor.

Goal:

Store real measurements.

---

## Step 5

Add historical charts.

Goal:

Visualize changes over time.

---

## Step 6

Support multiple nodes.

Goal:

Node A and Node B appear independently.

---

# Data Flow

```text
Sensor
   ↓
ESP32
   ↓
HTTP POST
   ↓
Rust API
   ↓
SQLite
   ↓
Dashboard
```

Every feature must fit somewhere in this flow.

---

# Mental Guide

Before implementing anything, ask:

## Question 1

Does this help data move from sensor to dashboard?

If yes:

Proceed.

If no:

Probably postpone.

---

## Question 2

Can this be demonstrated to a professor?

Good:

* New sensor
* Better graph
* More reliable node

Bad:

* Three days tuning build systems
* Rewriting architecture
* Fancy abstractions with no visible result

---

## Question 3

Would the project still work without this feature?

If yes:

Future phase.

---

# Future Ideas Parking Lot

Write ideas here.

Do not implement during Phase 1.

* LoRa
* Rain gauge
* NixOS appliance
* WASM modules
* Julia analysis
* Machine learning
* Edge processing
* Multi-farm deployment
* Mobile app

The parking lot exists so ideas are not lost, but they do not interrupt development.

---

# Definition of Done

The project is successful when:

* At least one ESP32 sends real sensor data.
* Data is stored in SQLite.
* Data survives restarts.
* Dashboard displays current values.
* Dashboard displays historical values.
* Multiple nodes are supported.

Everything beyond this is a bonus.
