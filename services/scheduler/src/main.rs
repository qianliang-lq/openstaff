use axum::{routing::get, Json, Router};
use serde::Serialize;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    service: String,
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        service: "scheduler".to_string(),
    })
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
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let port = std::env::var("PORT").unwrap_or_else(|_| "3002".to_string());
    let addr = format!("0.0.0.0:{}", port);

    tracing::info!("🚀 OpenStaff Scheduler v{}", env!("CARGO_PKG_VERSION"));
    tracing::info!("📡 Listening on http://{}", addr);
    tracing::info!("🏥 Health check: http://{}/health", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
