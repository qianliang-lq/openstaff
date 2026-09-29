use axum::{
    extract::Json,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Deserialize, Serialize)]
pub struct ChatRequest {
    pub provider: String,
    #[serde(default)]
    pub model: Option<String>,
    pub messages: Vec<ChatMessage>,
    #[serde(default = "default_stream")]
    pub stream: bool,
    #[serde(default)]
    pub temperature: Option<f32>,
}

fn default_stream() -> bool {
    false
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatResponse {
    pub id: String,
    pub provider: String,
    pub model: String,
    pub message: ChatMessage,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub usage: Option<UsageStats>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UsageStats {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

impl IntoResponse for ErrorResponse {
    fn into_response(self) -> axum::response::Response {
        (StatusCode::BAD_REQUEST, Json(self)).into_response()
    }
}

/// API chat endpoint - forwards to Gateway with headers
/// Desktop → POST /v1/chat (this) → Gateway POST /v1/chat
pub async fn chat_handler(
    headers: HeaderMap,
    Json(request): Json<ChatRequest>,
) -> Result<Json<ChatResponse>, impl IntoResponse> {
    // Extract provider key from header (sent by desktop)
    let provider_key = headers
        .get("X-OpenStaff-Provider-Key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    // Get Gateway URL from env
    let gateway_url =
        env::var("GATEWAY_SERVICE_URL").unwrap_or_else(|_| "http://localhost:3001".to_string());

    // Get service token for Gateway authentication
    let service_token =
        env::var("GATEWAY_SERVICE_TOKEN").unwrap_or_else(|_| "dev-token".to_string());

    let client = reqwest::Client::new();

    // Audit: log request metadata only (no key, no full body)
    tracing::info!(
        provider = %request.provider,
        model = %request.model.as_ref().unwrap_or(&"default".to_string()),
        message_count = request.messages.len(),
        has_provider_key = provider_key.is_some(),
        "Forwarding chat request to gateway"
    );

    let mut req_builder = client
        .post(format!("{}/v1/chat", gateway_url))
        .header("Authorization", format!("Bearer {}", service_token))
        .header("Content-Type", "application/json");

    // Forward provider key if present
    if let Some(key) = provider_key {
        req_builder = req_builder.header("X-OpenStaff-Provider-Key", key);
    }

    let response = req_builder.json(&request).send().await.map_err(|e| {
        tracing::error!(error = %e, "Failed to call gateway");
        (
            StatusCode::BAD_GATEWAY,
            Json(ErrorResponse {
                error: format!("Gateway request failed: {}", e),
            }),
        )
    })?;

    let status = response.status();

    if !status.is_success() {
        let error_body = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());

        tracing::warn!(
            status = status.as_u16(),
            error = %error_body,
            "Gateway returned error"
        );

        // Convert reqwest status to axum status
        let axum_status =
            StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

        return Err((axum_status, Json(ErrorResponse { error: error_body })));
    }

    let chat_response: ChatResponse = response.json().await.map_err(|e| {
        tracing::error!(error = %e, "Failed to parse gateway response");
        (
            StatusCode::BAD_GATEWAY,
            Json(ErrorResponse {
                error: format!("Invalid gateway response: {}", e),
            }),
        )
    })?;

    tracing::info!(
        provider = %chat_response.provider,
        model = %chat_response.model,
        request_id = %chat_response.id,
        "Chat request completed"
    );

    Ok(Json(chat_response))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_request_deserialize() {
        let json = r#"{
            "provider": "qwen",
            "messages": [{"role": "user", "content": "test"}]
        }"#;

        let req: ChatRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.provider, "qwen");
        assert_eq!(req.stream, false);
    }

    #[test]
    fn test_chat_response_roundtrip() {
        let response = ChatResponse {
            id: "test".to_string(),
            provider: "qwen".to_string(),
            model: "qwen-turbo".to_string(),
            message: ChatMessage {
                role: "assistant".to_string(),
                content: "Hello".to_string(),
            },
            usage: None,
        };

        let json = serde_json::to_string(&response).unwrap();
        let parsed: ChatResponse = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.id, "test");
    }
}
