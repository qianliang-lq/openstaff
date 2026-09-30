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
