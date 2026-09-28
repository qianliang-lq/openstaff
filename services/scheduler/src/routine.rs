use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct FireRequest {
    #[serde(default = "default_routine_id")]
    pub routine_id: String,
    #[serde(default = "default_skill_id")]
    pub skill_id: String,
    #[serde(default = "default_trigger")]
    pub trigger: String,
}

fn default_routine_id() -> String {
    "external-insight-daily".to_string()
}

fn default_skill_id() -> String {
    "external-insight-public-search".to_string()
}

fn default_trigger() -> String {
    "manual".to_string()
}

#[derive(Debug, Serialize)]
pub struct FireResponse {
    pub fired: bool,
    pub job_id: String,
    pub routine_id: String,
    pub message: String,
}

pub async fn fire_external_insight(
    Json(req): Json<FireRequest>,
) -> Result<Json<FireResponse>, (StatusCode, String)> {
    let runtime_url =
        std::env::var("RUNTIME_URL").unwrap_or_else(|_| "http://localhost:3003".to_string());

    let job_id = format!("job_{}", Uuid::new_v4());
    let scheduled_for = Utc::now().to_rfc3339();

    tracing::info!(
        "🔥 Firing job {} for routine {} (skill: {}, trigger: {})",
        job_id,
        req.routine_id,
        req.skill_id,
        req.trigger
    );

    let client = reqwest::Client::new();
    let runtime_endpoint = format!("{}/v1/jobs/fire", runtime_url);

    let payload = serde_json::json!({
        "job_id": job_id,
        "routine_id": req.routine_id,
        "skill_id": req.skill_id,
        "trigger": req.trigger,
        "scheduled_for": scheduled_for,
        "payload": {}
    });

    match client.post(&runtime_endpoint).json(&payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status == 202 {
                tracing::info!("✅ Job {} accepted by runtime", job_id);
                Ok(Json(FireResponse {
                    fired: true,
                    job_id: job_id.clone(),
                    routine_id: req.routine_id.clone(),
                    message: format!("Job {} fired successfully", job_id),
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
