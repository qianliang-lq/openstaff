use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;
use std::sync::Arc;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

#[derive(Clone)]
struct AppState {
    version: String,
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    service: String,
    version: String,
}

async fn health_check(State(state): State<Arc<AppState>>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        service: "openstaff-runtime".to_string(),
        version: state.version.clone(),
    })
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

    let state = Arc::new(AppState {
        version: env!("CARGO_PKG_VERSION").to_string(),
    });

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3003".to_string());
    let addr = format!("0.0.0.0:{}", port);

    tracing::info!("🚀 OpenStaff Runtime Service v{}", env!("CARGO_PKG_VERSION"));
    tracing::info!("📡 Listening on http://{}", addr);
    tracing::info!("🏥 Health check: http://{}/health", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
