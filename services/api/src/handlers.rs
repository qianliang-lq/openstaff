use crate::models::{
    Agent, AgentMcpResponse, AgentSkillResponse, ConnectorMeta, CreateAgentRequest,
    CreateMessageRequest, CreatePeerMessageRequest, ListAgentMcpResponse, ListAgentSkillsResponse,
    McpCatalog, Message, SkillCatalog, TestMcpResponse, TrySkillResponse, UpdateAgentMcpRequest,
    UpdateAgentRequest, UpdateAgentSkillRequest, UpdateConnectorMetaRequest,
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
    // Check if agent exists
    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM agents WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to check agent existence: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if exists == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    // Delete in correct order to avoid FK constraint violations
    // 1. Delete messages (FK to agents)
    sqlx::query("DELETE FROM messages WHERE agent_id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete agent messages: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // 2. Delete agent_skills (FK to agents)
    sqlx::query("DELETE FROM agent_skills WHERE agent_id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete agent skills: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // 3. Delete agent_mcp (FK to agents)
    sqlx::query("DELETE FROM agent_mcp WHERE agent_id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete agent mcp: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // 4. Finally delete agent
    sqlx::query("DELETE FROM agents WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete agent: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    tracing::info!("✅ Agent deleted: {}", id);

    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_messages(
    State(pool): State<SqlitePool>,
    Path(agent_id): Path<String>,
) -> Result<Json<Vec<Message>>, StatusCode> {
    let messages =
        sqlx::query_as::<_, Message>("SELECT * FROM messages WHERE agent_id = ? ORDER BY ts ASC")
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

// Skills handlers

pub async fn get_skills_catalog(
    State(pool): State<SqlitePool>,
) -> Result<Json<Vec<SkillCatalog>>, StatusCode> {
    let skills = sqlx::query_as::<_, SkillCatalog>("SELECT * FROM skill_catalog")
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get skills catalog: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(skills))
}

pub async fn list_agent_skills(
    State(pool): State<SqlitePool>,
    Path(agent_id): Path<String>,
) -> Result<Json<ListAgentSkillsResponse>, StatusCode> {
    // Get all skills from catalog and join with agent mounts
    let skills = sqlx::query_as::<_, (String, String, String, Option<String>, Option<i64>)>(
        r#"
        SELECT 
            sc.skill_id, sc.name, sc.version, sc.summary,
            COALESCE(ags.enabled, 0) as enabled
        FROM skill_catalog sc
        LEFT JOIN agent_skills ags ON sc.skill_id = ags.skill_id AND ags.agent_id = ?
        "#,
    )
    .bind(&agent_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to list agent skills: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let items = skills
        .into_iter()
        .map(
            |(skill_id, name, version, summary, enabled)| AgentSkillResponse {
                skill_id,
                name,
                version,
                summary,
                enabled: enabled.unwrap_or(0) == 1,
            },
        )
        .collect();

    Ok(Json(ListAgentSkillsResponse { agent_id, items }))
}

pub async fn update_agent_skill(
    State(pool): State<SqlitePool>,
    Path((agent_id, skill_id)): Path<(String, String)>,
    Json(payload): Json<UpdateAgentSkillRequest>,
) -> Result<StatusCode, StatusCode> {
    let now = Utc::now().to_rfc3339();
    let enabled = if payload.enabled { 1 } else { 0 };

    sqlx::query(
        r#"
        INSERT INTO agent_skills (agent_id, skill_id, enabled, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(agent_id, skill_id) DO UPDATE SET
            enabled = excluded.enabled,
            updated_at = excluded.updated_at
        "#,
    )
    .bind(&agent_id)
    .bind(&skill_id)
    .bind(enabled)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to update agent skill: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    tracing::info!(
        "✅ Agent skill updated: {} / {} = {}",
        agent_id,
        skill_id,
        enabled
    );

    Ok(StatusCode::OK)
}

pub async fn try_agent_skill(
    State(pool): State<SqlitePool>,
    Path((agent_id, skill_id)): Path<(String, String)>,
) -> Result<Json<TrySkillResponse>, StatusCode> {
    // Verify agent and skill exist
    let agent_exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM agents WHERE id = ?")
        .bind(&agent_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to check agent: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if agent_exists == 0 {
        return Ok(Json(TrySkillResponse {
            ok: false,
            message: format!("Agent {} not found", agent_id),
        }));
    }

    let skill_exists =
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM skill_catalog WHERE skill_id = ?")
            .bind(&skill_id)
            .fetch_one(&pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to check skill: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

    if skill_exists == 0 {
        return Ok(Json(TrySkillResponse {
            ok: false,
            message: format!("Skill {} not found", skill_id),
        }));
    }

    // Fixture: simulate skill execution
    let message = match skill_id.as_str() {
        "web-search" => "✅ Web search fixture: 找到 3 条结果 (模拟)".to_string(),
        "validation-gate" => "✅ Validation gate fixture: 审批卡已触发 (模拟)".to_string(),
        "doc-brief" => "✅ Doc brief fixture: Markdown 大纲已生成 (模拟)".to_string(),
        _ => format!("✅ Skill {} executed (fixture)", skill_id),
    };

    tracing::info!("🧪 Try skill: {} / {} → OK", agent_id, skill_id);

    Ok(Json(TrySkillResponse { ok: true, message }))
}

// MCP handlers

pub async fn get_mcp_catalog(
    State(pool): State<SqlitePool>,
) -> Result<Json<Vec<McpCatalog>>, StatusCode> {
    let mcps = sqlx::query_as::<_, McpCatalog>("SELECT * FROM mcp_catalog")
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get MCP catalog: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(mcps))
}

pub async fn list_agent_mcp(
    State(pool): State<SqlitePool>,
    Path(agent_id): Path<String>,
) -> Result<Json<ListAgentMcpResponse>, StatusCode> {
    // Get all MCPs from catalog and join with agent mounts
    let mcps = sqlx::query_as::<
        _,
        (
            String,
            String,
            Option<String>,
            Option<i64>,
            Option<String>,
            Option<String>,
        ),
    >(
        r#"
        SELECT 
            mc.mcp_id, mc.name, mc.summary,
            agm.enabled, agm.status, agm.last_checked_at
        FROM mcp_catalog mc
        LEFT JOIN agent_mcp agm ON mc.mcp_id = agm.mcp_id AND agm.agent_id = ?
        "#,
    )
    .bind(&agent_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to list agent MCP: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let items = mcps
        .into_iter()
        .map(
            |(mcp_id, name, summary, enabled, status, last_checked_at)| AgentMcpResponse {
                mcp_id,
                name,
                summary,
                enabled: enabled.unwrap_or(0) == 1,
                status: status.unwrap_or_else(|| "disconnected".to_string()),
                last_checked_at,
            },
        )
        .collect();

    Ok(Json(ListAgentMcpResponse { agent_id, items }))
}

pub async fn update_agent_mcp(
    State(pool): State<SqlitePool>,
    Path((agent_id, mcp_id)): Path<(String, String)>,
    Json(payload): Json<UpdateAgentMcpRequest>,
) -> Result<StatusCode, StatusCode> {
    let now = Utc::now().to_rfc3339();
    let enabled = if payload.enabled { 1 } else { 0 };

    sqlx::query(
        r#"
        INSERT INTO agent_mcp (agent_id, mcp_id, enabled, status, config_json, updated_at)
        VALUES (?, ?, ?, 'disconnected', ?, ?)
        ON CONFLICT(agent_id, mcp_id) DO UPDATE SET
            enabled = excluded.enabled,
            config_json = excluded.config_json,
            updated_at = excluded.updated_at
        "#,
    )
    .bind(&agent_id)
    .bind(&mcp_id)
    .bind(enabled)
    .bind(&payload.config_json)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to update agent MCP: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    tracing::info!("✅ Agent MCP updated: {} / {}", agent_id, mcp_id);

    Ok(StatusCode::OK)
}

pub async fn test_agent_mcp(
    State(pool): State<SqlitePool>,
    Path((agent_id, mcp_id)): Path<(String, String)>,
) -> Result<Json<TestMcpResponse>, StatusCode> {
    let now = Utc::now().to_rfc3339();

    // Verify agent and MCP exist
    let agent_exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM agents WHERE id = ?")
        .bind(&agent_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to check agent: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if agent_exists == 0 {
        return Ok(Json(TestMcpResponse {
            ok: false,
            status: "error".to_string(),
            message: format!("Agent {} not found", agent_id),
        }));
    }

    let mcp_exists =
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM mcp_catalog WHERE mcp_id = ?")
            .bind(&mcp_id)
            .fetch_one(&pool)
            .await
            .map_err(|e| {
                tracing::error!("Failed to check MCP: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

    if mcp_exists == 0 {
        return Ok(Json(TestMcpResponse {
            ok: false,
            status: "error".to_string(),
            message: format!("MCP {} not found", mcp_id),
        }));
    }

    // Fixture: simulate MCP connection test
    let (status, message) = match mcp_id.as_str() {
        "github" => ("connected", "✅ GitHub MCP connected (fixture)"),
        _ => ("connected", "✅ MCP connected (fixture)"),
    };

    // Update status in database
    sqlx::query(
        r#"
        INSERT INTO agent_mcp (agent_id, mcp_id, enabled, status, last_checked_at, updated_at)
        VALUES (?, ?, 0, ?, ?, ?)
        ON CONFLICT(agent_id, mcp_id) DO UPDATE SET
            status = excluded.status,
            last_checked_at = excluded.last_checked_at,
            updated_at = excluded.updated_at
        "#,
    )
    .bind(&agent_id)
    .bind(&mcp_id)
    .bind(status)
    .bind(&now)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to update MCP status: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    tracing::info!("🧪 Test MCP: {} / {} → {}", agent_id, mcp_id, status);

    Ok(Json(TestMcpResponse {
        ok: true,
        status: status.to_string(),
        message: message.to_string(),
    }))
}

// Peer message handler (agent-to-agent)

pub async fn create_peer_message(
    State(pool): State<SqlitePool>,
    Path(from_agent_id): Path<String>,
    Json(payload): Json<CreatePeerMessageRequest>,
) -> Result<StatusCode, StatusCode> {
    let now = Utc::now().to_rfc3339();

    // Verify both agents exist
    let from_exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM agents WHERE id = ?")
        .bind(&from_agent_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to check from agent: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if from_exists == 0 {
        tracing::warn!("From agent not found: {}", from_agent_id);
        return Err(StatusCode::NOT_FOUND);
    }

    let to_exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM agents WHERE id = ?")
        .bind(&payload.to_agent_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to check to agent: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if to_exists == 0 {
        tracing::warn!("To agent not found: {}", payload.to_agent_id);
        return Err(StatusCode::NOT_FOUND);
    }

    // Write two messages (double-sided storage):
    // 1. Message in from_agent's inbox (peer = to_agent)
    let from_msg_id = Uuid::new_v4().to_string();
    sqlx::query(
        r#"
        INSERT INTO messages (id, agent_id, role, body, peer_agent_id, ts)
        VALUES (?, ?, 'agent', ?, ?, ?)
        "#,
    )
    .bind(&from_msg_id)
    .bind(&from_agent_id)
    .bind(&payload.body)
    .bind(&payload.to_agent_id)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to insert from message: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // 2. Message in to_agent's inbox (peer = from_agent)
    let to_msg_id = Uuid::new_v4().to_string();
    sqlx::query(
        r#"
        INSERT INTO messages (id, agent_id, role, body, peer_agent_id, ts)
        VALUES (?, ?, 'agent', ?, ?, ?)
        "#,
    )
    .bind(&to_msg_id)
    .bind(&payload.to_agent_id)
    .bind(&payload.body)
    .bind(&from_agent_id)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("Failed to insert to message: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    tracing::info!(
        "✅ Peer message delivered: {} → {} (double-sided)",
        from_agent_id,
        payload.to_agent_id
    );

    Ok(StatusCode::CREATED)
}
