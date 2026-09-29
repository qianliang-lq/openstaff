use axum::{extract::Json, http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    pub provider: String,
    #[serde(default)]
    pub model: Option<String>,
    pub messages: Vec<ChatMessage>,
    #[serde(default)]
    pub api_key: Option<String>,
    #[serde(default)]
    pub base_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct ChatResponse {
    pub message: ChatMessage,
    pub model: String,
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
    Json(request): Json<ChatRequest>,
) -> Result<Json<ChatResponse>, impl IntoResponse> {
    let api_key = request
        .api_key
        .clone()
        .or_else(|| env::var("OPENSTAFF_LLM_API_KEY").ok())
        .ok_or_else(|| ErrorResponse {
            error: "API key required".to_string(),
        })?;

    match request.provider.as_str() {
        "qwen" => qwen_completion(request, &api_key).await,
        "glm" => glm_completion(request, &api_key).await,
        _ => Err(ErrorResponse {
            error: format!("Unsupported provider: {}", request.provider),
        }),
    }
}

async fn qwen_completion(
    request: ChatRequest,
    api_key: &str,
) -> Result<Json<ChatResponse>, ErrorResponse> {
    let base_url = request
        .base_url
        .unwrap_or_else(|| "https://dashscope.aliyuncs.com/compatible-mode/v1".to_string());
    let model = request.model.unwrap_or_else(|| "qwen-turbo".to_string());

    let url = format!("{}/chat/completions", base_url);

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "model": model,
            "messages": request.messages,
        }))
        .send()
        .await
        .map_err(|e| ErrorResponse {
            error: format!("Request failed: {}", e),
        })?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(ErrorResponse {
            error: format!("API error ({}): {}", status, error_text),
        });
    }

    let result: serde_json::Value = response.json().await.map_err(|e| ErrorResponse {
        error: format!("Failed to parse response: {}", e),
    })?;

    let message = result["choices"][0]["message"]
        .as_object()
        .ok_or_else(|| ErrorResponse {
            error: "Invalid response format".to_string(),
        })?;

    Ok(Json(ChatResponse {
        message: ChatMessage {
            role: message["role"].as_str().unwrap_or("assistant").to_string(),
            content: message["content"].as_str().unwrap_or("").to_string(),
        },
        model,
    }))
}

async fn glm_completion(
    request: ChatRequest,
    api_key: &str,
) -> Result<Json<ChatResponse>, ErrorResponse> {
    let base_url = request
        .base_url
        .unwrap_or_else(|| "https://open.bigmodel.cn/api/paas/v4".to_string());
    let model = request.model.unwrap_or_else(|| "glm-4-flash".to_string());

    let url = format!("{}/chat/completions", base_url);

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "model": model,
            "messages": request.messages,
        }))
        .send()
        .await
        .map_err(|e| ErrorResponse {
            error: format!("Request failed: {}", e),
        })?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(ErrorResponse {
            error: format!("API error ({}): {}", status, error_text),
        });
    }

    let result: serde_json::Value = response.json().await.map_err(|e| ErrorResponse {
        error: format!("Failed to parse response: {}", e),
    })?;

    let message = result["choices"][0]["message"]
        .as_object()
        .ok_or_else(|| ErrorResponse {
            error: "Invalid response format".to_string(),
        })?;

    Ok(Json(ChatResponse {
        message: ChatMessage {
            role: message["role"].as_str().unwrap_or("assistant").to_string(),
            content: message["content"].as_str().unwrap_or("").to_string(),
        },
        model,
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
            ]
        }"#;

        let request: ChatRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.provider, "qwen");
        assert_eq!(request.model, Some("qwen-turbo".to_string()));
        assert_eq!(request.messages.len(), 1);
    }

    #[test]
    fn test_chat_request_with_api_key() {
        let json = r#"{
            "provider": "glm",
            "messages": [
                {"role": "user", "content": "Test"}
            ],
            "api_key": "test-key"
        }"#;

        let request: ChatRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.api_key, Some("test-key".to_string()));
    }
}
