use crate::AppState;
use crate::models::{ApiError, ApiResponse, SensorReadingRequest, SensorReadingResponse};
use axum::extract::{Json, State};
use std::sync::Arc;

pub async fn post_sensors(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SensorReadingRequest>,
) -> Result<ApiResponse, ApiError> {
    let conn = state
        .db
        .connect()
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    if payload.node_id.trim().is_empty() {
        return Err(ApiError::BadRequest("node_id cannot be empty".to_string()));
    }

    let query = "
        INSERT INTO sensor_readings (node_id, soil_temperature, soil_moisture, air_temperature, air_humidity, light_level)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        RETURNING id, timestamp
    ";

    let mut rows = conn
        .query(query, libsql::params![
            payload.node_id.clone(),
            payload.soil_temperature,
            payload.soil_moisture,
            payload.air_temperature,
            payload.air_humidity,
            payload.light_level,
        ])
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    let row = rows
        .next()
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?
        .ok_or_else(|| ApiError::InternalServerError("no row returned from insert".to_string()))?;

    let id: i64 = row
        .get(0)
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;
    let timestamp: String = row
        .get(1)
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    let response_data = SensorReadingResponse {
        id,
        timestamp,
        node_id: payload.node_id,
        soil_temperature: payload.soil_temperature,
        soil_moisture: payload.soil_moisture,
        air_temperature: payload.air_temperature,
        air_humidity: payload.air_humidity,
        light_level: payload.light_level,
    };

    Ok(ApiResponse::Created(response_data))
}

pub async fn get_sensors(
    State(state): State<Arc<AppState>>,
) -> Result<ApiResponse, ApiError> {
    let conn = state
        .db
        .connect()
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    let query = "
        SELECT id, timestamp, node_id, soil_temperature, soil_moisture, air_temperature, air_humidity, light_level
        FROM sensor_readings
        WHERE id IN (SELECT MAX(id) FROM sensor_readings GROUP BY node_id)
        ORDER BY node_id
    ";

    let mut rows = conn
        .query(query, ())
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    let mut readings = Vec::new();
    while let Some(row) = rows
        .next()
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?
    {
        readings.push(SensorReadingResponse {
            id: row.get(0).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            timestamp: row.get(1).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            node_id: row.get(2).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            soil_temperature: row.get(3).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            soil_moisture: row.get(4).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            air_temperature: row.get::<Option<f64>>(5).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            air_humidity: row.get::<Option<f64>>(6).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            light_level: row.get::<Option<f64>>(7).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
        });
    }

    Ok(ApiResponse::Success(readings))
}

pub async fn get_sensor_history(
    State(state): State<Arc<AppState>>,
) -> Result<ApiResponse, ApiError> {
    let conn = state
        .db
        .connect()
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    let query = "
        SELECT id, timestamp, node_id, soil_temperature, soil_moisture, air_temperature, air_humidity, light_level
        FROM sensor_readings s
        WHERE s.id IN (
            SELECT id FROM sensor_readings
            WHERE node_id = s.node_id
            ORDER BY id DESC
            LIMIT 25
        )
        ORDER BY timestamp
    ";

    let mut rows = conn
        .query(query, ())
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?;

    let mut readings = Vec::new();
    while let Some(row) = rows
        .next()
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))?
    {
        readings.push(SensorReadingResponse {
            id: row.get(0).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            timestamp: row.get(1).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            node_id: row.get(2).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            soil_temperature: row.get(3).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            soil_moisture: row.get(4).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            air_temperature: row.get::<Option<f64>>(5).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            air_humidity: row.get::<Option<f64>>(6).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
            light_level: row.get::<Option<f64>>(7).map_err(|e| ApiError::InternalServerError(e.to_string()))?,
        });
    }

    Ok(ApiResponse::Success(readings))
}
