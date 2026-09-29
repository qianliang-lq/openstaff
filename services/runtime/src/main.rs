mod demo;
mod external_insight;

use axum::{routing::get, routing::post, Json, Router};
use openstaff_protocol::HealthResponse;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse::ok("runtime"))
}

async fn root() -> &'static str {
    "OpenStaff Runtime Service - Use /health for health check"
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/v1/jobs/fire", post(demo::jobs_fire))
        .route("/v1/insights/latest", get(demo::get_latest_insight))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let port = std::env::var("PORT").unwrap_or_else(|_| "3003".to_string());
    let addr = format!("0.0.0.0:{}", port);

    tracing::info!(
        "🚀 OpenStaff Runtime Service v{}",
        env!("CARGO_PKG_VERSION")
    );
    tracing::info!("📡 Listening on http://{}", addr);
    tracing::info!("🏥 Health check: http://{}/health", addr);
    tracing::info!("🔥 Jobs endpoint: POST http://{}/v1/jobs/fire", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::util::ServiceExt;

    #[tokio::test]
    async fn test_health_endpoint_returns_ok() {
        let app = Router::new().route("/health", get(health_check));

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let health: HealthResponse = serde_json::from_slice(&body).unwrap();

        assert_eq!(health.status, "ok");
        assert_eq!(health.service, "runtime");
    }

    #[test]
    fn test_health_response_json_contract() {
        let health = HealthResponse::ok("runtime");
        let json = serde_json::to_value(&health).unwrap();

        assert_eq!(json["status"], "ok");
        assert_eq!(json["service"], "runtime");
        assert_eq!(json.as_object().unwrap().len(), 2);
    }

    #[tokio::test]
    async fn test_jobs_fire_accepts_and_returns_202() {
        let app = Router::new().route("/v1/jobs/fire", post(demo::jobs_fire));

        let request_payload = serde_json::json!({
            "job_id": "job_test_123",
            "routine_id": "external-insight-daily",
            "skill_id": "external-insight-public-search",
            "trigger": "manual",
            "scheduled_for": "2026-09-28T09:00:00+08:00",
            "payload": {}
        });

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/jobs/fire")
                    .method("POST")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&request_payload).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let response_json: serde_json::Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(response_json["job_id"], "job_test_123");
        assert_eq!(response_json["accepted"], true);
    }

    #[tokio::test]
    async fn test_jobs_fire_response_shape() {
        let app = Router::new().route("/v1/jobs/fire", post(demo::jobs_fire));

        let request_payload = serde_json::json!({
            "job_id": "job_shape_test",
            "routine_id": "routine-id",
            "skill_id": "skill-id",
            "trigger": "cron",
            "scheduled_for": "2026-09-28T10:00:00Z",
            "payload": {"custom": "data"}
        });

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/jobs/fire")
                    .method("POST")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&request_payload).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let response_json: serde_json::Value = serde_json::from_slice(&body).unwrap();

        assert!(response_json.get("job_id").is_some());
        assert!(response_json.get("accepted").is_some());
        assert_eq!(response_json["job_id"], "job_shape_test");
        assert_eq!(response_json["accepted"], true);
        assert_eq!(response_json.as_object().unwrap().len(), 2);
    }
}
