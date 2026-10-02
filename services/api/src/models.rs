use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub template_id: Option<String>,
    pub duty: Option<String>,
    pub account_id: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAgentRequest {
    pub name: String,
    pub template_id: Option<String>,
    pub duty: Option<String>,
    pub account_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAgentRequest {
    pub name: Option<String>,
    pub duty: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Message {
    pub id: String,
    pub agent_id: String,
    pub thread_id: Option<String>,
    pub role: String,
    pub body: String,
    pub ts: String,
    pub peer_agent_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMessageRequest {
    pub role: String,
    pub body: String,
    pub thread_id: Option<String>,
    pub peer_agent_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePeerMessageRequest {
    pub to_agent_id: String,
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ConnectorMeta {
    pub provider: String,
    pub configured: i64,
    pub last_checked_at: Option<String>,
    pub account_label: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateConnectorMetaRequest {
    pub provider: String,
    pub configured: bool,
    pub last_checked_at: Option<String>,
    pub account_label: Option<String>,
}

// Skill catalog
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SkillCatalog {
    pub skill_id: String,
    pub name: String,
    pub version: String,
    pub summary: Option<String>,
    pub triggers_json: Option<String>,
    pub updated_at: String,
}

// MCP catalog
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct McpCatalog {
    pub mcp_id: String,
    pub name: String,
    pub summary: Option<String>,
    pub updated_at: String,
}

// Agent skill mount
#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct AgentSkill {
    pub agent_id: String,
    pub skill_id: String,
    pub enabled: i64,
    pub updated_at: String,
}

// Agent MCP mount
#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct AgentMcp {
    pub agent_id: String,
    pub mcp_id: String,
    pub enabled: i64,
    pub status: String,
    pub config_json: Option<String>,
    pub last_checked_at: Option<String>,
    pub updated_at: String,
}

// Response: Agent skill with catalog info
#[derive(Debug, Serialize, Deserialize)]
pub struct AgentSkillResponse {
    pub skill_id: String,
    pub name: String,
    pub version: String,
    pub summary: Option<String>,
    pub enabled: bool,
}

// Response: Agent MCP with catalog info
#[derive(Debug, Serialize, Deserialize)]
pub struct AgentMcpResponse {
    pub mcp_id: String,
    pub name: String,
    pub summary: Option<String>,
    pub enabled: bool,
    pub status: String,
    pub last_checked_at: Option<String>,
}

// Skills API requests
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateAgentSkillRequest {
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrySkillResponse {
    pub ok: bool,
    pub message: String,
}

// MCP API requests
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateAgentMcpRequest {
    pub enabled: bool,
    pub config_json: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TestMcpResponse {
    pub ok: bool,
    pub status: String,
    pub message: String,
}

// List responses
#[derive(Debug, Serialize, Deserialize)]
pub struct ListAgentSkillsResponse {
    pub agent_id: String,
    pub items: Vec<AgentSkillResponse>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListAgentMcpResponse {
    pub agent_id: String,
    pub items: Vec<AgentMcpResponse>,
}
