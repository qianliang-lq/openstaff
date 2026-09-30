use anyhow::Result;
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::path::Path;
use tracing::info;

/// Parse SQLite URL and return (connection_url, file_path)
/// Handles:
/// - `sqlite:./data/db.sqlite` -> relative path
/// - `sqlite:///absolute/path/db.sqlite` -> absolute path (3 slashes)
/// - `./data/db.sqlite` -> bare relative path
/// - `/absolute/path/db.sqlite` -> bare absolute path
/// Automatically appends `?mode=rwc` if no query params present
fn parse_sqlite_url(input: &str) -> Result<(String, String)> {
    let input = input.trim();

    // Check if it starts with sqlite: scheme
    if input.starts_with("sqlite:") {
        let after_scheme = &input[7..]; // Skip "sqlite:"

        // Extract path and query
        let (path_part, query_part) = if let Some(q_idx) = after_scheme.find('?') {
            (&after_scheme[..q_idx], Some(&after_scheme[q_idx..]))
        } else {
            (after_scheme, None)
        };

        // Handle sqlite:/// (absolute) vs sqlite: or sqlite:/ (relative)
        let file_path = if path_part.starts_with("//") {
            // sqlite:///abs/path -> /abs/path (remove leading //)
            path_part.trim_start_matches("//").to_string()
        } else {
            // sqlite:./rel or sqlite:/rel -> keep as-is
            path_part.trim_start_matches('/').to_string()
        };

        // Rebuild connection URL with mode=rwc if no query
        let connection_url = if let Some(query) = query_part {
            format!("sqlite:{}{}", path_part, query)
        } else {
            format!("sqlite:{}?mode=rwc", path_part)
        };

        Ok((connection_url, file_path))
    } else {
        // Bare path without scheme
        let (path_part, query_part) = if let Some(q_idx) = input.find('?') {
            (&input[..q_idx], Some(&input[q_idx..]))
        } else {
            (input, None)
        };

        let connection_url = if let Some(query) = query_part {
            format!("sqlite:{}{}", path_part, query)
        } else {
            format!("sqlite:{}?mode=rwc", path_part)
        };

        Ok((connection_url, path_part.to_string()))
    }
}

pub async fn init_database(database_url: &str) -> Result<SqlitePool> {
    // Parse database URL and extract file path
    let (connection_url, db_path) = parse_sqlite_url(database_url)?;

    // Ensure parent directory exists
    if let Some(parent) = Path::new(&db_path).parent() {
        if !parent.as_os_str().is_empty() {
            tokio::fs::create_dir_all(parent).await?;
        }
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(&connection_url)
        .await?;

    info!("📦 Database connected: {}", db_path);

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            template_id TEXT,
            duty TEXT,
            account_id TEXT,
            status TEXT DEFAULT 'idle',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            thread_id TEXT,
            role TEXT NOT NULL,
            body TEXT NOT NULL,
            ts TEXT NOT NULL,
            peer_agent_id TEXT,
            FOREIGN KEY (agent_id) REFERENCES agents(id)
        )
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON messages(agent_id)
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS connector_meta (
            provider TEXT PRIMARY KEY,
            configured INTEGER DEFAULT 0,
            last_checked_at TEXT,
            account_label TEXT
        )
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS agent_skills (
            agent_id TEXT NOT NULL,
            skill_id TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            PRIMARY KEY (agent_id, skill_id),
            FOREIGN KEY (agent_id) REFERENCES agents(id)
        )
        "#,
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS agent_mcp (
            agent_id TEXT NOT NULL,
            mcp_id TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            config_json TEXT,
            PRIMARY KEY (agent_id, mcp_id),
            FOREIGN KEY (agent_id) REFERENCES agents(id)
        )
        "#,
    )
    .execute(&pool)
    .await?;

    info!("✅ Database schema initialized");

    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_sqlite_url_absolute_three_slashes() {
        let (url, path) = parse_sqlite_url("sqlite:///opt/openstaff/data/db.sqlite").unwrap();
        assert_eq!(url, "sqlite:///opt/openstaff/data/db.sqlite?mode=rwc");
        assert_eq!(path, "/opt/openstaff/data/db.sqlite");
    }

    #[test]
    fn test_parse_sqlite_url_relative() {
        let (url, path) = parse_sqlite_url("sqlite:./data/openstaff.db").unwrap();
        assert_eq!(url, "sqlite:./data/openstaff.db?mode=rwc");
        assert_eq!(path, "./data/openstaff.db");
    }

    #[test]
    fn test_parse_sqlite_url_with_existing_query() {
        let (url, path) = parse_sqlite_url("sqlite:./data/db.sqlite?mode=rwc").unwrap();
        assert_eq!(url, "sqlite:./data/db.sqlite?mode=rwc");
        assert_eq!(path, "./data/db.sqlite");
    }

    #[test]
    fn test_parse_sqlite_url_bare_relative_path() {
        let (url, path) = parse_sqlite_url("./data/openstaff.db").unwrap();
        assert_eq!(url, "sqlite:./data/openstaff.db?mode=rwc");
        assert_eq!(path, "./data/openstaff.db");
    }

    #[test]
    fn test_parse_sqlite_url_bare_absolute_path() {
        let (url, path) = parse_sqlite_url("/opt/openstaff/data/openstaff.db").unwrap();
        assert_eq!(url, "sqlite:/opt/openstaff/data/openstaff.db?mode=rwc");
        assert_eq!(path, "/opt/openstaff/data/openstaff.db");
    }
}
