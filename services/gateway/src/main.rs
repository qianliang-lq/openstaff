mod audit;
mod bypass;

use axum::{routing::get, routing::post, Json, Router};
use openstaff_protocol::HealthResponse;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse::ok("gateway"))
}

async fn root() -> &'static str {
    "OpenStaff LLM Gateway Service - Use /health for health check"
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    audit::ensure_audit_dir()?;

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/v1/egress/fetch", post(bypass::egress_fetch))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);

    tracing::info!("🚀 OpenStaff LLM Gateway v{}", env!("CARGO_PKG_VERSION"));
    tracing::info!("📡 Listening on http://{}", addr);
    tracing::info!("🏥 Health check: http://{}/health", addr);
    tracing::info!("🌐 Public egress: POST /v1/egress/fetch");

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
        assert_eq!(health.service, "gateway");
    }

    #[test]
    fn test_health_response_json_contract() {
        let health = HealthResponse::ok("gateway");
        let json = serde_json::to_value(&health).unwrap();

        assert_eq!(json["status"], "ok");
        assert_eq!(json["service"], "gateway");
        assert_eq!(json.as_object().unwrap().len(), 2);
    }

    #[tokio::test]
    async fn test_egress_fetch_auth_and_request_shape() {
        std::env::set_var("RUNTIME_SERVICE_TOKEN", "test-token");
        std::env::set_var("OPENSTAFF_GATEWAY_EGRESS_MODE", "offline");

        let app = Router::new().route("/v1/egress/fetch", post(bypass::egress_fetch));

        let request_payload = serde_json::json!({
            "url": "https://example.com/page",
            "method": "GET",
            "max_bytes": 524288,
            "timeout_ms": 15000,
            "purpose": "external_insight",
            "routine_id": "routine-123",
            "skill_id": "external-insight-public-search",
            "agent_instance_id": "agent-456"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/egress/fetch")
                    .method("POST")
                    .header("content-type", "application/json")
                    .header("authorization", "Bearer test-token")
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

        assert!(response_json["request_id"]
            .as_str()
            .unwrap()
            .starts_with("eg_"));
        assert_eq!(response_json["status"], 200);
        assert_eq!(response_json["final_url"], "https://example.com/page");
        assert_eq!(response_json["content_type"], "text/html");
        assert!(response_json["body_text"]
            .as_str()
            .unwrap()
            .contains("Demo Fixture"));
        assert_eq!(response_json["truncated"], false);
        assert!(response_json["bytes"].as_u64().unwrap() > 0);
    }

    #[tokio::test]
    async fn test_egress_fetch_unauthorized() {
        std::env::set_var("RUNTIME_SERVICE_TOKEN", "valid-token");
        let app = Router::new().route("/v1/egress/fetch", post(bypass::egress_fetch));

        let request_payload = serde_json::json!({
            "url": "https://example.com/page",
            "skill_id": "test-skill",
            "agent_instance_id": "agent-123",
            "purpose": "test"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/egress/fetch")
                    .method("POST")
                    .header("content-type", "application/json")
                    .header("authorization", "Bearer wrong-token")
                    .body(Body::from(serde_json::to_string(&request_payload).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn test_egress_fetch_ssrf_rfc1918_blocked() {
        std::env::set_var("RUNTIME_SERVICE_TOKEN", "test-token");
        std::env::set_var("OPENSTAFF_GATEWAY_EGRESS_MODE", "offline");

        let app = Router::new().route("/v1/egress/fetch", post(bypass::egress_fetch));

        let private_ips = vec![
            "http://10.0.0.1",
            "http://172.16.0.1",
            "http://192.168.1.1",
            "http://127.0.0.1",
        ];

        for ip in private_ips {
            let request_payload = serde_json::json!({
                "url": ip,
                "skill_id": "test-skill",
                "agent_instance_id": "agent-123",
                "purpose": "test"
            });

            let response = app
                .clone()
                .oneshot(
                    Request::builder()
                        .uri("/v1/egress/fetch")
                        .method("POST")
                        .header("content-type", "application/json")
                        .header("authorization", "Bearer test-token")
                        .body(Body::from(serde_json::to_string(&request_payload).unwrap()))
                        .unwrap(),
                )
                .await
                .unwrap();

            assert_eq!(
                response.status(),
                StatusCode::FORBIDDEN,
                "SSRF check failed for {}",
                ip
            );
        }
    }

    #[tokio::test]
    async fn test_egress_fetch_ssrf_metadata_blocked() {
        std::env::set_var("RUNTIME_SERVICE_TOKEN", "test-token");
        std::env::set_var("OPENSTAFF_GATEWAY_EGRESS_MODE", "offline");

        let app = Router::new().route("/v1/egress/fetch", post(bypass::egress_fetch));

        let request_payload = serde_json::json!({
            "url": "http://169.254.169.254/latest/meta-data/",
            "skill_id": "test-skill",
            "agent_instance_id": "agent-123",
            "purpose": "test"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/egress/fetch")
                    .method("POST")
                    .header("content-type", "application/json")
                    .header("authorization", "Bearer test-token")
                    .body(Body::from(serde_json::to_string(&request_payload).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let error_text = String::from_utf8_lossy(&body);
        assert!(error_text.contains("metadata"));
    }

    #[tokio::test]
    async fn test_egress_fetch_response_fields_complete() {
        std::env::set_var("RUNTIME_SERVICE_TOKEN", "test-token");
        std::env::set_var("OPENSTAFF_GATEWAY_EGRESS_MODE", "offline");

        let app = Router::new().route("/v1/egress/fetch", post(bypass::egress_fetch));

        let request_payload = serde_json::json!({
            "url": "https://example.com/test",
            "method": "GET",
            "max_bytes": 1000,
            "timeout_ms": 5000,
            "purpose": "external_insight",
            "routine_id": "routine-789",
            "skill_id": "test-skill",
            "agent_instance_id": "agent-xyz"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/egress/fetch")
                    .method("POST")
                    .header("content-type", "application/json")
                    .header("authorization", "Bearer test-token")
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

        let required_fields = vec![
            "request_id",
            "status",
            "final_url",
            "content_type",
            "body_text",
            "truncated",
            "bytes",
        ];

        for field in required_fields {
            assert!(
                response_json.get(field).is_some(),
                "Missing required field: {}",
                field
            );
        }

        assert!(response_json["request_id"]
            .as_str()
            .unwrap()
            .starts_with("eg_"));
        assert!(response_json["status"].as_u64().is_some());
        assert!(response_json["final_url"].as_str().is_some());
        assert!(response_json["content_type"].as_str().is_some());
        assert!(response_json["body_text"].as_str().is_some());
        assert!(response_json["truncated"].as_bool().is_some());
        assert!(response_json["bytes"].as_u64().is_some());
    }
}
