use crate::models::{
    Agent, ConnectorMeta, CreateAgentRequest, CreateMessageRequest, Message,
    UpdateAgentRequest, UpdateConnectorMetaRequest,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn list_agents(State(pool): State<SqlitePool>) -> Result<Json<Vec<Agent>>, StatusCode> {
    let agents = sqlx::query_as::<_, Agent>("SELECT * FROM agents ORDER BY created_at DESC")
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to list agents: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(agents))
}

pub async fn create_agent(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateAgentRequest>,
) -> Result<Json<Agent>, StatusCode> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let agent = Agent {
        id: id.clone(),
        name: payload.name,
        template_id: payload.template_id,
        duty: payload.duty,
        account_id: payload.account_id,
        status: "idle".to_string(),
        created_at: now.clone(),
        updated_at: now,
    };

    sqlx::query(
        "INSERT INTO agents (id, name, template_id, duty, account_id, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&agent.id)
    .bind(&agent.name)
    .bind(&agent.template_id)
    .bind(&agent.duty)
    .bind(&agent.account_id)
    .bind(&agent.status)
    .bind(&agent.created_at)
    .bind(&agent.updated_at)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to create agent: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    tracing::info!("✅ Agent created: {} ({})", agent.name, agent.id);

    Ok(Json(agent))
}

pub async fn update_agent(
    State(pool): State<SqlitePool>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateAgentRequest>,
) -> Result<Json<Agent>, StatusCode> {
    let now = Utc::now().to_rfc3339();

    let existing = sqlx::query_as::<_, Agent>("SELECT * FROM agents WHERE id = ?")
        .bind(&id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch agent: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or(StatusCode::NOT_FOUND)?;

    let name = payload.name.unwrap_or(existing.name);
    let duty = payload.duty.or(existing.duty);
    let status = payload.status.unwrap_or(existing.status);

    sqlx::query("UPDATE agents SET name = ?, duty = ?, status = ?, updated_at = ? WHERE id = ?")
        .bind(&name)
        .bind(&duty)
        .bind(&status)
        .bind(&now)
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to update agent: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let updated = Agent {
        id: existing.id,
        name,
        template_id: existing.template_id,
        duty,
        account_id: existing.account_id,
        status,
        created_at: existing.created_at,
        updated_at: now,
    };

    tracing::info!("✅ Agent updated: {}", updated.id);

    Ok(Json(updated))
}

pub async fn delete_agent(
    State(pool): State<SqlitePool>,
    Path(id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let result = sqlx::query("DELETE FROM agents WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete agent: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    sqlx::query("DELETE FROM messages WHERE agent_id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete agent messages: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    tracing::info!("✅ Agent deleted: {}", id);

    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_messages(
    State(pool): State<SqlitePool>,
    Path(agent_id): Path<String>,
) -> Result<Json<Vec<Message>>, StatusCode> {
    let messages = sqlx::query_as::<_, Message>(
        "SELECT * FROM messages WHERE agent_id = ? ORDER BY ts ASC",
    )
    .bind(&agent_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to list messages: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(messages))
}

pub async fn create_message(
    State(pool): State<SqlitePool>,
    Path(agent_id): Path<String>,
    Json(payload): Json<CreateMessageRequest>,
) -> Result<Json<Message>, StatusCode> {
    let id = Uuid::new_v4().to_string();
    let ts = Utc::now().to_rfc3339();

    let message = Message {
        id: id.clone(),
        agent_id: agent_id.clone(),
        thread_id: payload.thread_id,
        role: payload.role,
        body: payload.body,
        ts: ts.clone(),
        peer_agent_id: payload.peer_agent_id,
    };

    sqlx::query(
        "INSERT INTO messages (id, agent_id, thread_id, role, body, ts, peer_agent_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&message.id)
    .bind(&message.agent_id)
    .bind(&message.thread_id)
    .bind(&message.role)
    .bind(&message.body)
    .bind(&message.ts)
    .bind(&message.peer_agent_id)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to create message: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(message))
}

pub async fn get_connector_meta(
    State(pool): State<SqlitePool>,
) -> Result<Json<Vec<ConnectorMeta>>, StatusCode> {
    let metas = sqlx::query_as::<_, ConnectorMeta>("SELECT * FROM connector_meta")
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get connector meta: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(metas))
}

pub async fn update_connector_meta(
    State(pool): State<SqlitePool>,
    Json(payload): Json<UpdateConnectorMetaRequest>,
) -> Result<Json<ConnectorMeta>, StatusCode> {
    let configured = if payload.configured { 1 } else { 0 };

    sqlx::query(
        "INSERT INTO connector_meta (provider, configured, last_checked_at, account_label) 
         VALUES (?, ?, ?, ?) 
         ON CONFLICT(provider) DO UPDATE SET 
            configured = excluded.configured,
            last_checked_at = excluded.last_checked_at,
            account_label = excluded.account_label",
    )
    .bind(&payload.provider)
    .bind(configured)
    .bind(&payload.last_checked_at)
    .bind(&payload.account_label)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to update connector meta: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let meta = ConnectorMeta {
        provider: payload.provider,
        configured: configured as i64,
        last_checked_at: payload.last_checked_at,
        account_label: payload.account_label,
    };

    tracing::info!("✅ Connector meta updated: {}", meta.provider);

    Ok(Json(meta))
}
