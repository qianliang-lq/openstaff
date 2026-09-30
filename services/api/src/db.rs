use anyhow::Result;
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::path::Path;
use tracing::info;

pub async fn init_database(database_url: &str) -> Result<SqlitePool> {
    let url = if database_url.starts_with("sqlite:") {
        database_url.to_string()
    } else {
        format!("sqlite:{}", database_url)
    };

    let db_path = url.trim_start_matches("sqlite:");
    if let Some(parent) = Path::new(db_path).parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(&url)
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
