//db.rs
use libsql::Connection;

pub async fn init_table(conn: &Connection) -> Result<(), libsql::Error> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            node_id TEXT NOT NULL,
            soil_temperature REAL NOT NULL,
            soil_moisture REAL NOT NULL,
            air_temperature REAL,
            air_humidity REAL,
            light_level REAL
        )",
        (),
    )
    .await?;
    Ok(())
}
