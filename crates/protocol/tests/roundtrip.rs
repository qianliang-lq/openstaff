use openstaff_protocol::{EventEnvelope, EventPayload, HealthResponse, Message};
use serde_json;

#[test]
fn test_message_roundtrip() {
    let original = Message {
        content: "Hello, OpenStaff!".to_string(),
    };

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let deserialized: Message = serde_json::from_str(&json_str).expect("Failed to deserialize");

    assert_eq!(original, deserialized);
}

#[test]
fn test_message_roundtrip_empty() {
    let original = Message {
        content: "".to_string(),
    };

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let deserialized: Message = serde_json::from_str(&json_str).expect("Failed to deserialize");

    assert_eq!(original, deserialized);
}

#[test]
fn test_message_roundtrip_unicode() {
    let original = Message {
        content: "你好，世界！🚀".to_string(),
    };

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let deserialized: Message = serde_json::from_str(&json_str).expect("Failed to deserialize");

    assert_eq!(original, deserialized);
}

#[test]
fn test_event_envelope_roundtrip_message() {
    let original = EventEnvelope {
        event_id: "evt_123".to_string(),
        event_type: "message".to_string(),
        timestamp: 1727510400000,
        protocol_version: "1.0".to_string(),
        payload: EventPayload::Message(Message {
            content: "Test message".to_string(),
        }),
    };

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let deserialized: EventEnvelope =
        serde_json::from_str(&json_str).expect("Failed to deserialize");

    assert_eq!(original, deserialized);
    assert_eq!(deserialized.protocol_version, "1.0");
}

#[test]
fn test_event_envelope_roundtrip_state_change() {
    let original = EventEnvelope {
        event_id: "evt_456".to_string(),
        event_type: "agent_state_change".to_string(),
        timestamp: 1727510401000,
        protocol_version: "1.0".to_string(),
        payload: EventPayload::AgentStateChange {
            agent_id: "agent_001".to_string(),
            state: "active".to_string(),
        },
    };

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let deserialized: EventEnvelope =
        serde_json::from_str(&json_str).expect("Failed to deserialize");

    assert_eq!(original, deserialized);
    assert_eq!(deserialized.protocol_version, "1.0");
}

#[test]
fn test_event_envelope_roundtrip_tool_call() {
    let original = EventEnvelope {
        event_id: "evt_789".to_string(),
        event_type: "tool_call".to_string(),
        timestamp: 1727510402000,
        protocol_version: "1.0".to_string(),
        payload: EventPayload::ToolCall {
            tool_name: "write_file".to_string(),
            args: serde_json::json!({"path": "/tmp/test.txt", "content": "Hello"}),
        },
    };

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let deserialized: EventEnvelope =
        serde_json::from_str(&json_str).expect("Failed to deserialize");

    assert_eq!(original, deserialized);
    assert_eq!(deserialized.protocol_version, "1.0");
}

#[test]
fn test_event_envelope_roundtrip_approval_request() {
    let original = EventEnvelope {
        event_id: "evt_101".to_string(),
        event_type: "approval_request".to_string(),
        timestamp: 1727510403000,
        protocol_version: "1.0".to_string(),
        payload: EventPayload::ApprovalRequest {
            request_id: "req_001".to_string(),
            action: "execute_tool".to_string(),
        },
    };

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let deserialized: EventEnvelope =
        serde_json::from_str(&json_str).expect("Failed to deserialize");

    assert_eq!(original, deserialized);
    assert_eq!(deserialized.protocol_version, "1.0");
}

#[test]
fn test_health_response_roundtrip() {
    let original = HealthResponse::ok("api");

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let deserialized: HealthResponse =
        serde_json::from_str(&json_str).expect("Failed to deserialize");

    assert_eq!(original, deserialized);
    assert_eq!(deserialized.status, "ok");
    assert_eq!(deserialized.service, "api");
}

#[test]
fn test_health_response_json_format() {
    let health = HealthResponse::ok("gateway");
    let json = serde_json::to_value(&health).expect("Failed to serialize");

    assert_eq!(json["status"], "ok");
    assert_eq!(json["service"], "gateway");
    assert_eq!(json.as_object().unwrap().len(), 2);
}

#[test]
fn test_health_response_rejects_extra_fields() {
    // JSON with extra "version" field should fail to deserialize
    let json_with_extra = r#"{"status":"ok","service":"api","version":"1.0.0"}"#;
    let result: Result<HealthResponse, _> = serde_json::from_str(json_with_extra);
    assert!(
        result.is_err(),
        "HealthResponse should reject JSON with extra fields"
    );

    // JSON with only required fields should succeed
    let json_valid = r#"{"status":"ok","service":"api"}"#;
    let result: Result<HealthResponse, _> = serde_json::from_str(json_valid);
    assert!(
        result.is_ok(),
        "HealthResponse should accept JSON with only status and service"
    );
}

#[test]
fn test_event_envelope_protocol_version_field() {
    let original = EventEnvelope {
        event_id: "evt_version_test".to_string(),
        event_type: "version_test".to_string(),
        timestamp: 1727510404000,
        protocol_version: "2.1".to_string(),
        payload: EventPayload::Message(Message {
            content: "Testing protocol version".to_string(),
        }),
    };

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let json_value: serde_json::Value =
        serde_json::from_str(&json_str).expect("Failed to parse JSON");

    // With camelCase serialization, field is protocolVersion in JSON
    assert_eq!(json_value["protocolVersion"], "2.1");

    let deserialized: EventEnvelope =
        serde_json::from_str(&json_str).expect("Failed to deserialize");
    assert_eq!(deserialized.protocol_version, "2.1");
}
