use openstaff_protocol::Message;
use serde_json;

#[test]
fn test_message_roundtrip() {
    let original = Message {
        content: "Hello, OpenStaff!".to_string(),
    };

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let deserialized: Message = serde_json::from_str(&json_str).expect("Failed to deserialize");

    assert_eq!(original.content, deserialized.content);
}

#[test]
fn test_message_roundtrip_empty() {
    let original = Message {
        content: "".to_string(),
    };

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let deserialized: Message = serde_json::from_str(&json_str).expect("Failed to deserialize");

    assert_eq!(original.content, deserialized.content);
}

#[test]
fn test_message_roundtrip_unicode() {
    let original = Message {
        content: "你好，世界！🚀".to_string(),
    };

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let deserialized: Message = serde_json::from_str(&json_str).expect("Failed to deserialize");

    assert_eq!(original.content, deserialized.content);
}

#[test]
fn test_message_roundtrip_special_chars() {
    let original = Message {
        content: r#"Line 1\nLine 2\t"Quoted""#.to_string(),
    };

    let json_str = serde_json::to_string(&original).expect("Failed to serialize");
    let deserialized: Message = serde_json::from_str(&json_str).expect("Failed to deserialize");

    assert_eq!(original.content, deserialized.content);
}
