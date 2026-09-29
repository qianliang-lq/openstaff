use axum::{
    extract::Json,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Deserialize)]
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

#[derive(Debug, Serialize)]
pub struct ChatResponse {
    pub id: String,
    pub provider: String,
    pub model: String,
    pub message: ChatMessage,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub usage: Option<UsageStats>,
}

#[derive(Debug, Serialize)]
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

pub async fn chat_completion(
    headers: HeaderMap,
    Json(request): Json<ChatRequest>,
) -> Result<Json<ChatResponse>, impl IntoResponse> {
    // Get API key from X-OpenStaff-Provider-Key header or env fallback
    let api_key = headers
        .get("X-OpenStaff-Provider-Key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .or_else(|| env::var("OPENSTAFF_LLM_API_KEY").ok())
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: "API key required".to_string(),
                }),
            )
        })?;

    // Verify Authorization header (service token)
    let auth_header = headers
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: "Authorization header required".to_string(),
                }),
            )
        })?;

    if !auth_header.starts_with("Bearer ") {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Invalid authorization format".to_string(),
            }),
        ));
    }

    // For MVP, accept any Bearer token (real validation in production)
    let _service_token = &auth_header[7..];

    // Audit log (no key, no full messages)
    tracing::info!(
        provider = %request.provider,
        model = %request.model.as_ref().unwrap_or(&"default".to_string()),
        message_count = request.messages.len(),
        "Chat request"
    );

    match request.provider.as_str() {
        "qwen" => qwen_completion(request, &api_key).await,
        "glm" => glm_completion(request, &api_key).await,
        _ => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: format!("Unsupported provider: {}", request.provider),
            }),
        )),
    }
}

async fn qwen_completion(
    request: ChatRequest,
    api_key: &str,
) -> Result<Json<ChatResponse>, (StatusCode, Json<ErrorResponse>)> {
    let base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    let model = request.model.unwrap_or_else(|| "qwen-turbo".to_string());

    let url = format!("{}/chat/completions", base_url);

    let client = reqwest::Client::new();
    let start = std::time::Instant::now();

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "model": model,
            "messages": request.messages,
            "stream": false,
            "temperature": request.temperature.unwrap_or(0.7),
        }))
        .send()
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                Json(ErrorResponse {
                    error: format!("Request failed: {}", e),
                }),
            )
        })?;

    let latency = start.elapsed().as_millis() as u64;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());

        tracing::warn!(
            provider = "qwen",
            model = %model,
            status = %status,
            latency_ms = latency,
            "Chat request failed"
        );

        return Err((
            StatusCode::BAD_GATEWAY,
            Json(ErrorResponse {
                error: format!("API error ({}): {}", status, error_text),
            }),
        ));
    }

    let result: serde_json::Value = response.json().await.map_err(|e| {
        (
            StatusCode::BAD_GATEWAY,
            Json(ErrorResponse {
                error: format!("Failed to parse response: {}", e),
            }),
        )
    })?;

    let message_obj = result["choices"][0]["message"].as_object().ok_or_else(|| {
        (
            StatusCode::BAD_GATEWAY,
            Json(ErrorResponse {
                error: "Invalid response format".to_string(),
            }),
        )
    })?;

    let usage = result["usage"].as_object().map(|u| UsageStats {
        prompt_tokens: u["prompt_tokens"].as_u64().unwrap_or(0) as u32,
        completion_tokens: u["completion_tokens"].as_u64().unwrap_or(0) as u32,
    });

    let request_id = result["id"].as_str().unwrap_or("unknown").to_string();

    tracing::info!(
        provider = "qwen",
        model = %model,
        request_id = %request_id,
        status = 200,
        latency_ms = latency,
        prompt_tokens = usage.as_ref().map(|u| u.prompt_tokens).unwrap_or(0),
        completion_tokens = usage.as_ref().map(|u| u.completion_tokens).unwrap_or(0),
        "Chat request completed"
    );

    Ok(Json(ChatResponse {
        id: request_id,
        provider: "qwen".to_string(),
        model,
        message: ChatMessage {
            role: message_obj["role"]
                .as_str()
                .unwrap_or("assistant")
                .to_string(),
            content: message_obj["content"].as_str().unwrap_or("").to_string(),
        },
        usage,
    }))
}

async fn glm_completion(
    request: ChatRequest,
    api_key: &str,
) -> Result<Json<ChatResponse>, (StatusCode, Json<ErrorResponse>)> {
    let base_url = "https://open.bigmodel.cn/api/paas/v4";
    let model = request.model.unwrap_or_else(|| "glm-4-flash".to_string());

    let url = format!("{}/chat/completions", base_url);

    let client = reqwest::Client::new();
    let start = std::time::Instant::now();

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "model": model,
            "messages": request.messages,
            "stream": false,
            "temperature": request.temperature.unwrap_or(0.7),
        }))
        .send()
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                Json(ErrorResponse {
                    error: format!("Request failed: {}", e),
                }),
            )
        })?;

    let latency = start.elapsed().as_millis() as u64;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());

        tracing::warn!(
            provider = "glm",
            model = %model,
            status = %status,
            latency_ms = latency,
            "Chat request failed"
        );

        return Err((
            StatusCode::BAD_GATEWAY,
            Json(ErrorResponse {
                error: format!("API error ({}): {}", status, error_text),
            }),
        ));
    }

    let result: serde_json::Value = response.json().await.map_err(|e| {
        (
            StatusCode::BAD_GATEWAY,
            Json(ErrorResponse {
                error: format!("Failed to parse response: {}", e),
            }),
        )
    })?;

    let message_obj = result["choices"][0]["message"].as_object().ok_or_else(|| {
        (
            StatusCode::BAD_GATEWAY,
            Json(ErrorResponse {
                error: "Invalid response format".to_string(),
            }),
        )
    })?;

    let usage = result["usage"].as_object().map(|u| UsageStats {
        prompt_tokens: u["prompt_tokens"].as_u64().unwrap_or(0) as u32,
        completion_tokens: u["completion_tokens"].as_u64().unwrap_or(0) as u32,
    });

    let request_id = result["id"].as_str().unwrap_or("unknown").to_string();

    tracing::info!(
        provider = "glm",
        model = %model,
        request_id = %request_id,
        status = 200,
        latency_ms = latency,
        prompt_tokens = usage.as_ref().map(|u| u.prompt_tokens).unwrap_or(0),
        completion_tokens = usage.as_ref().map(|u| u.completion_tokens).unwrap_or(0),
        "Chat request completed"
    );

    Ok(Json(ChatResponse {
        id: request_id,
        provider: "glm".to_string(),
        model,
        message: ChatMessage {
            role: message_obj["role"]
                .as_str()
                .unwrap_or("assistant")
                .to_string(),
            content: message_obj["content"].as_str().unwrap_or("").to_string(),
        },
        usage,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_request_deserialize() {
        let json = r#"{
            "provider": "qwen",
            "model": "qwen-turbo",
            "messages": [
                {"role": "user", "content": "Hello"}
            ],
            "stream": false,
            "temperature": 0.8
        }"#;

        let request: ChatRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.provider, "qwen");
        assert_eq!(request.model, Some("qwen-turbo".to_string()));
        assert_eq!(request.messages.len(), 1);
        assert_eq!(request.stream, false);
        assert_eq!(request.temperature, Some(0.8));
    }

    #[test]
    fn test_chat_request_defaults() {
        let json = r#"{
            "provider": "glm",
            "messages": [
                {"role": "user", "content": "Test"}
            ]
        }"#;

        let request: ChatRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.stream, false);
        assert_eq!(request.temperature, None);
        assert_eq!(request.model, None);
    }

    #[test]
    fn test_chat_response_serialize() {
        let response = ChatResponse {
            id: "chat_123".to_string(),
            provider: "qwen".to_string(),
            model: "qwen-turbo".to_string(),
            message: ChatMessage {
                role: "assistant".to_string(),
                content: "Hello!".to_string(),
            },
            usage: Some(UsageStats {
                prompt_tokens: 10,
                completion_tokens: 5,
            }),
        };

        let json = serde_json::to_value(&response).unwrap();
        assert_eq!(json["id"], "chat_123");
        assert_eq!(json["provider"], "qwen");
        assert_eq!(json["message"]["content"], "Hello!");
        assert_eq!(json["usage"]["prompt_tokens"], 10);
    }
}
