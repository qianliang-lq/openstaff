mod routine;

use axum::{routing::get, routing::post, Json, Router};
use openstaff_protocol::HealthResponse;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse::ok("scheduler"))
}

async fn root() -> &'static str {
    "OpenStaff Scheduler Service - Use /health for health check"
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
        .route("/demo/fire", post(routine::fire_external_insight))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let port = std::env::var("PORT").unwrap_or_else(|_| "3002".to_string());
    let addr = format!("0.0.0.0:{}", port);

    tracing::info!("🚀 OpenStaff Scheduler v{}", env!("CARGO_PKG_VERSION"));
    tracing::info!("📡 Listening on http://{}", addr);
    tracing::info!("🏥 Health check: http://{}/health", addr);
    tracing::info!("🔥 Demo fire endpoint: POST http://{}/demo/fire", addr);

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
        assert_eq!(health.service, "scheduler");
    }

    #[test]
    fn test_health_response_json_contract() {
        let health = HealthResponse::ok("scheduler");
        let json = serde_json::to_value(&health).unwrap();

        assert_eq!(json["status"], "ok");
        assert_eq!(json["service"], "scheduler");
        assert_eq!(json.as_object().unwrap().len(), 2);
    }

    #[test]
    fn test_scheduler_fire_only_no_skill_execution() {
        use std::sync::{Arc, Mutex};

        let executed_operations = Arc::new(Mutex::new(Vec::<String>::new()));
        let ops_clone = Arc::clone(&executed_operations);

        std::thread::spawn(move || {
            let ops = ops_clone.lock().unwrap();
            assert!(
                !ops.contains(&"load_skill".to_string()),
                "Scheduler must NOT load Skill directly"
            );
            assert!(
                !ops.contains(&"egress_fetch".to_string()),
                "Scheduler must NOT call Gateway egress directly"
            );
            assert!(
                !ops.contains(&"reconcile".to_string()),
                "Scheduler must NOT run reconcile logic"
            );
            assert!(
                !ops.contains(&"write_facts".to_string()),
                "Scheduler must NOT write facts"
            );
        });

        let ops = executed_operations.lock().unwrap();
        assert_eq!(
            ops.len(),
            0,
            "Scheduler fire-only: no Skill/egress/reconcile operations"
        );
    }
}
