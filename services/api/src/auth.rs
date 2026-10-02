use axum::{
    extract::Request,
    http::{Method, StatusCode},
    middleware::Next,
    response::Response,
};

/// Authentication middleware that requires API key for mutating HTTP methods.
///
/// **Policy**:
/// - GET, HEAD, OPTIONS: public (no auth required)
/// - POST, PUT, PATCH, DELETE: require valid API key
///
/// **Auth Header**: `Authorization: Bearer <token>` or `X-Api-Key: <token>`
///
/// Returns 401 Unauthorized if:
/// - Mutating method is used without key
/// - Key is present but does not match `OPENSTAFF_API_KEY` env var
pub async fn require_api_key_for_writes(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let method = request.method();

    // Public methods: no auth required
    if matches!(method, &Method::GET | &Method::HEAD | &Method::OPTIONS) {
        return Ok(next.run(request).await);
    }

    // Mutating methods: require API key
    let configured_key = std::env::var("OPENSTAFF_API_KEY").ok();

    // If no key is configured, allow requests (local dev mode without auth)
    let Some(expected_key) = configured_key else {
        tracing::warn!(
            "OPENSTAFF_API_KEY not set - {} {} allowed without auth (insecure for production)",
            method,
            request.uri().path()
        );
        return Ok(next.run(request).await);
    };

    // Extract key from Authorization header or X-Api-Key header
    let headers = request.headers();
    let provided_key = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .or_else(|| headers.get("x-api-key").and_then(|v| v.to_str().ok()));

    match provided_key {
        Some(key) if key == expected_key => {
            tracing::debug!("✅ API key valid for {} {}", method, request.uri().path());
            Ok(next.run(request).await)
        }
        Some(_) => {
            tracing::warn!("❌ Invalid API key for {} {}", method, request.uri().path());
            Err(StatusCode::UNAUTHORIZED)
        }
        None => {
            tracing::warn!("❌ Missing API key for {} {}", method, request.uri().path());
            Err(StatusCode::UNAUTHORIZED)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        middleware,
        routing::get,
        Router,
    };
    use serial_test::serial;
    use tower::ServiceExt;

    async fn dummy_handler() -> &'static str {
        "ok"
    }

    fn test_app() -> Router {
        Router::new()
            .route(
                "/test",
                get(dummy_handler)
                    .post(dummy_handler)
                    .put(dummy_handler)
                    .patch(dummy_handler)
                    .delete(dummy_handler),
            )
            .layer(middleware::from_fn(require_api_key_for_writes))
    }

    #[tokio::test]
    #[serial]
    async fn test_get_without_key_is_allowed() {
        std::env::set_var("OPENSTAFF_API_KEY", "test-key-for-get-test");

        let app = test_app();
        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/test")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        std::env::remove_var("OPENSTAFF_API_KEY");
    }

    #[tokio::test]
    #[serial]
    async fn test_post_without_key_returns_401() {
        std::env::set_var("OPENSTAFF_API_KEY", "test-secret-key");

        let app = test_app();
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/test")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

        std::env::remove_var("OPENSTAFF_API_KEY");
    }

    #[tokio::test]
    #[serial]
    async fn test_post_with_wrong_key_returns_401() {
        std::env::set_var("OPENSTAFF_API_KEY", "test-secret-key-wrong");

        let app = test_app();
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/test")
                    .header("authorization", "Bearer wrong-key")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

        std::env::remove_var("OPENSTAFF_API_KEY");
    }

    #[tokio::test]
    #[serial]
    async fn test_post_with_correct_key_in_bearer_header() {
        std::env::set_var("OPENSTAFF_API_KEY", "test-secret-key-bearer");

        let app = test_app();
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/test")
                    .header("authorization", "Bearer test-secret-key-bearer")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        std::env::remove_var("OPENSTAFF_API_KEY");
    }

    #[tokio::test]
    #[serial]
    async fn test_post_with_correct_key_in_x_api_key_header() {
        std::env::set_var("OPENSTAFF_API_KEY", "test-secret-key-xapi");

        let app = test_app();
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/test")
                    .header("x-api-key", "test-secret-key-xapi")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        std::env::remove_var("OPENSTAFF_API_KEY");
    }

    #[tokio::test]
    #[serial]
    async fn test_delete_requires_auth() {
        std::env::set_var("OPENSTAFF_API_KEY", "test-secret-key-delete");

        let app_without_key = test_app();
        let response = app_without_key
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri("/test")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

        // With correct key
        let app_with_key = test_app();
        let response = app_with_key
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri("/test")
                    .header("authorization", "Bearer test-secret-key-delete")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        std::env::remove_var("OPENSTAFF_API_KEY");
    }

    #[tokio::test]
    #[serial]
    async fn test_put_requires_auth() {
        std::env::set_var("OPENSTAFF_API_KEY", "test-secret-key-put");

        let app_without_key = test_app();
        let response = app_without_key
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/test")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

        // With correct key
        let app_with_key = test_app();
        let response = app_with_key
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/test")
                    .header("x-api-key", "test-secret-key-put")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        std::env::remove_var("OPENSTAFF_API_KEY");
    }

    #[tokio::test]
    #[serial]
    async fn test_patch_requires_auth() {
        std::env::set_var("OPENSTAFF_API_KEY", "test-secret-key-patch");

        let app_without_key = test_app();
        let response = app_without_key
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri("/test")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

        // With correct key
        let app_with_key = test_app();
        let response = app_with_key
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri("/test")
                    .header("authorization", "Bearer test-secret-key-patch")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        std::env::remove_var("OPENSTAFF_API_KEY");
    }

    #[tokio::test]
    #[serial]
    async fn test_head_without_key_is_allowed() {
        std::env::set_var("OPENSTAFF_API_KEY", "test-key-for-head-test");

        let app = test_app();
        let response = app
            .oneshot(
                Request::builder()
                    .method("HEAD")
                    .uri("/test")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // HEAD on a route that only supports GET/POST/PUT/PATCH/DELETE may return 405
        // but the auth middleware should not block it
        assert_ne!(response.status(), StatusCode::UNAUTHORIZED);

        std::env::remove_var("OPENSTAFF_API_KEY");
    }
}
