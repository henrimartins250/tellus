use libsql::Builder;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db = Builder::new_local("data.db").build().await?;
    let conn = db.connect()?;

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

    let nodes = ["node-1", "node-2"];
    let base = 1687920000.0; // unix ts for 2023-06-28

    for (i, node) in nodes.iter().enumerate() {
        for hour in 0..72 {
            let ts_secs = base + (hour as f64) * 3600.0;
            let ts = format_timestamp(ts_secs);

            let temp_base = if *node == "node-1" { 26.0 } else { 24.0 };
            let soil_temp = temp_base + (hour as f64 * 0.1).sin() * 3.0;
            let soil_moisture = 40.0 + (hour as f64 * 0.05).sin() * 15.0 + (i as f64) * 5.0;
            let air_temp = soil_temp + 2.0 + (hour as f64 * 0.03).cos() * 4.0;
            let air_humidity = 60.0 + (hour as f64 * 0.04).cos() * 10.0;
            let light = (800.0 + (hour as f64 * 0.1).sin() * 400.0).max(0.0);

            conn.execute(
                "INSERT INTO sensor_readings (timestamp, node_id, soil_temperature, soil_moisture, air_temperature, air_humidity, light_level)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                libsql::params![ts, *node, soil_temp, soil_moisture, air_temp, air_humidity, light],
            )
            .await?;
        }
    }

    println!("Seeded 144 readings (72 per node)");
    Ok(())
}

fn format_timestamp(unix: f64) -> String {
    let secs = unix as u64;
    let nanos = ((unix - secs as f64) * 1_000_000_000.0) as u32;
    let naive = time_to_datetime(secs);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
        naive.0, naive.1, naive.2, naive.3, naive.4, naive.5, nanos / 1_000_000
    )
}

fn time_to_datetime(secs: u64) -> (u64, u64, u64, u64, u64, u64) {
    let days = secs / 86400;
    let time = secs % 86400;
    let h = time / 3600;
    let m = (time % 3600) / 60;
    let s = time % 60;

    let mut y = 1970u64;
    let mut d = days;
    loop {
        let year_days = if is_leap(y) { 366 } else { 365 };
        if d < year_days {
            break;
        }
        d -= year_days;
        y += 1;
    }

    let months_days = if is_leap(y) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };

    let mut mo = 0u64;
    for days_in_month in months_days {
        if d < days_in_month {
            break;
        }
        d -= days_in_month;
        mo += 1;
    }

    (y, mo + 1, d + 1, h, m, s)
}

fn is_leap(y: u64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}
