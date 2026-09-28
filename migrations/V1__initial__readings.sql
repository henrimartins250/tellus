CREATE TABLE IF NOT EXISTS sensor_readings(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  node_id TEXT NOT NULL,
  soil_temperature REAL NOT NULL,
  soil_moisture REAL NOT NULL,
  air_temperature REAL,
  air_humidity REAL
);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_node_time
ON sensor_readings(node_id, timestamp DESC);
