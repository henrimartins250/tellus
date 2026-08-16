//main.rs

#![allow(unused)]

mod db;
mod handlers;
mod models;
use axum::{
    Router,
    extract::State,
    routing::{get, post},
};
use libsql::Builder;
use std::sync::Arc;

struct AppState {
    db: libsql::Database,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db = libsql::Builder::new_local("data.db").build().await?;
    let conn = db.connect()?;
    db::init_table(&conn).await?;

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
    println!("listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;
    Ok(())
}
