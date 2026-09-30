mod chat;
mod db;
mod handlers;
mod models;

use axum::{
    routing::{get, patch, post},
    Json, Router,
};
use openstaff_protocol::{HealthResponse, Message};
use serde::{Deserialize, Serialize};
use tower_http::{cors::CorsLayer, trace::TraceLayer};

#[derive(Serialize)]
struct EchoResponse {
    message: Message,
}

#[derive(Deserialize)]
struct EchoRequest {
    content: String,
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse::ok("api"))
}

async fn echo_handler(Json(payload): Json<EchoRequest>) -> Json<EchoResponse> {
    Json(EchoResponse {
        message: Message {
            content: payload.content,
        },
    })
}

async fn root() -> &'static str {
    "OpenStaff API Service - Use /health for health check"
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    let database_url =
        std::env::var("OPENSTAFF_DATABASE_URL").unwrap_or_else(|_| "./data/openstaff.db".to_string());

    let pool = db::init_database(&database_url).await?;

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/api/v1/echo", post(echo_handler))
        .route("/v1/chat", post(chat::chat_handler))
        .route("/v1/agents", get(handlers::list_agents).post(handlers::create_agent))
        .route(
            "/v1/agents/:id",
            patch(handlers::update_agent).delete(handlers::delete_agent),
        )
        .route(
            "/v1/agents/:id/messages",
            get(handlers::list_messages).post(handlers::create_message),
        )
        .route(
            "/v1/connectors/meta",
            get(handlers::get_connector_meta).put(handlers::update_connector_meta),
        )
        .with_state(pool)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{}", port);

    tracing::info!("🚀 OpenStaff API Service v{}", env!("CARGO_PKG_VERSION"));
    tracing::info!("📡 Listening on http://{}", addr);
    tracing::info!("🏥 Health check: http://{}/health", addr);
    tracing::info!("💬 Chat forwarding: POST /v1/chat");
    tracing::info!("📊 Database: {}", database_url);

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
        assert_eq!(health.service, "api");
    }

    #[test]
    fn test_health_response_json_contract() {
        let health = HealthResponse::ok("api");
        let json = serde_json::to_value(&health).unwrap();

        assert_eq!(json["status"], "ok");
        assert_eq!(json["service"], "api");
        assert_eq!(json.as_object().unwrap().len(), 2);
    }
}
