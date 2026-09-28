use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Message {
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EventEnvelope {
    pub event_id: String,
    pub event_type: String,
    pub timestamp: u64,
    pub protocol_version: String,
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

    #[test]
    fn test_event_envelope_json_format() {
        let env = EventEnvelope {
            event_id: "e1".to_string(),
            event_type: "test.message".to_string(),
            timestamp: 1234567890,
            protocol_version: "1.0".to_string(),
            payload: EventPayload::Message(Message {
                content: "hello".to_string(),
            }),
        };
        let json = serde_json::to_string(&env).unwrap();
        println!("EventEnvelope JSON: {}", json);
        
        let env2 = EventEnvelope {
            event_id: "e2".to_string(),
            event_type: "agent.state".to_string(),
            timestamp: 1234567890,
            protocol_version: "1.0".to_string(),
            payload: EventPayload::AgentStateChange {
                agent_id: "agent1".to_string(),
                state: "running".to_string(),
            },
        };
        let json2 = serde_json::to_string(&env2).unwrap();
        println!("AgentStateChange JSON: {}", json2);
    }
}
