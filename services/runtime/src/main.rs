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
}
