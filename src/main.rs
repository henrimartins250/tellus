//main.rs

mod handlers;
mod models;
use axum::{
    Router,
    routing::{get, post},
};
use env_logger::Env;
use log::debug;
use std::sync::Arc;
use tellus::migrations::run_migrations;

struct AppState {
    db: libsql::Database,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Default to `debug` so the boot/migration logs are visible without any
    // setup, while still deferring to RUST_LOG when it is set (e.g. RUST_LOG=info
    // to quiet them in a deployed build). The default filter is the floor, not
    // an override — RUST_LOG always wins.
    env_logger::Builder::from_env(Env::default().default_filter_or("debug")).init();
    let db = libsql::Builder::new_local("data.db").build().await?;
    let conn = db.connect()?;
    // Migrations are fatal on failure: serving traffic against a schema the
    // binary does not expect would corrupt data and produce confusing 500s.
    run_migrations(&conn).await?;

    let state = Arc::new(AppState { db });

    // app holds our routes
    let app = Router::new()
        // sensor route access our most recent data from the sensors
        .route(
            "/api/sensor",
            post(handlers::post_sensors).get(handlers::get_sensors),
        )
        // recent history of sensor readings (last 25 per node)
        .route("/api/sensor/history", get(handlers::get_sensor_history))
        .with_state(state);

    // listens on localhost 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    debug!("listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;
    Ok(())
}
