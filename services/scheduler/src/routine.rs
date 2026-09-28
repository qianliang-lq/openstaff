use axum::{http::StatusCode, Json};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct FireRequest {
    #[serde(default = "default_skill")]
    pub skill: String,
}

fn default_skill() -> String {
    "external-insight-public-search".to_string()
}

#[derive(Debug, Serialize)]
pub struct FireResponse {
    pub fired: bool,
    pub skill: String,
    pub runtime_url: String,
    pub message: String,
}

pub async fn fire_external_insight(
    Json(req): Json<FireRequest>,
) -> Result<Json<FireResponse>, (StatusCode, String)> {
    let runtime_url = std::env::var("RUNTIME_URL")
        .unwrap_or_else(|_| "http://localhost:3003".to_string());

    tracing::info!(
        "🔥 Firing routine for skill: {} (runtime: {})",
        req.skill,
        runtime_url
    );

    let client = reqwest::Client::new();
    let runtime_endpoint = format!("{}/demo/external-insight/run", runtime_url);

    let payload = serde_json::json!({
        "use_fixture": true,
    });

    match client.post(&runtime_endpoint).json(&payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                tracing::info!("✅ Runtime executed successfully");
                Ok(Json(FireResponse {
                    fired: true,
                    skill: req.skill.clone(),
                    runtime_url: runtime_endpoint,
                    message: format!("Successfully fired {} routine", req.skill),
                }))
            } else {
                let error_text = response
                    .text()
                    .await
                    .unwrap_or_else(|_| "Unknown error".to_string());
                tracing::error!("Runtime returned error: {}", error_text);
                Err((
                    StatusCode::BAD_GATEWAY,
                    format!("Runtime error ({}): {}", status, error_text),
                ))
            }
        }
        Err(e) => {
            tracing::error!("Failed to call runtime: {}", e);
            Err((
                StatusCode::SERVICE_UNAVAILABLE,
                format!("Failed to reach runtime at {}: {}", runtime_url, e),
            ))
        }
    }
}
