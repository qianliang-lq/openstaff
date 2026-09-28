use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Message {
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct EventEnvelope {
    pub event_id: String,
    pub event_type: String,
    pub timestamp: u64,
    pub payload: EventPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "data")]
pub enum EventPayload {
    Message(Message),
    AgentStateChange {
        agent_id: String,
        state: String,
    },
    ToolCall {
        tool_name: String,
        args: serde_json::Value,
    },
    ApprovalRequest {
        request_id: String,
        action: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct HealthResponse {
    pub status: String,
    pub service: String,
}

impl HealthResponse {
    pub fn ok(service: &str) -> Self {
        Self {
            status: "ok".to_string(),
            service: service.to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_creation() {
        let msg = Message {
            content: "test".to_string(),
        };
        assert_eq!(msg.content, "test");
    }

    #[test]
    fn test_health_response_builder() {
        let health = HealthResponse::ok("api");
        assert_eq!(health.status, "ok");
        assert_eq!(health.service, "api");
    }
}
