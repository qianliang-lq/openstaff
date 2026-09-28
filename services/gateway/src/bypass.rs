use crate::audit::{write_audit_record, AuditRecord};
use axum::{http::{HeaderMap, StatusCode}, Json};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::time::Instant;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct EgressFetchRequest {
    pub url: String,
    #[serde(default = "default_method")]
    pub method: String,
    #[serde(default = "default_max_bytes")]
    pub max_bytes: usize,
    #[serde(default = "default_timeout_ms")]
    pub timeout_ms: u64,
    pub purpose: String,
    #[serde(default)]
    pub routine_id: Option<String>,
    pub skill_id: String,
    pub agent_instance_id: String,
}

fn default_method() -> String {
    "GET".to_string()
}

fn default_max_bytes() -> usize {
    524288 // 512 KiB
}

fn default_timeout_ms() -> u64 {
    15000
}

#[derive(Debug, Serialize)]
pub struct EgressFetchResponse {
    pub request_id: String,
    pub status: u16,
    pub final_url: String,
    pub content_type: String,
    pub body_text: String,
    pub truncated: bool,
    pub bytes: usize,
}

fn is_ssrf_blocked(url: &str) -> Option<String> {
    match url::Url::parse(url) {
        Ok(parsed) => {
            if let Some(host) = parsed.host_str() {
                if host == "169.254.169.254" {
                    return Some("metadata endpoint blocked".to_string());
                }

                if let Ok(ip) = host.parse::<std::net::IpAddr>() {
                    match ip {
                        std::net::IpAddr::V4(v4) => {
                            if v4.is_private() || v4.is_loopback() {
                                return Some("RFC1918 private network blocked".to_string());
                            }
                        }
                        std::net::IpAddr::V6(v6) => {
                            if v6.is_loopback() {
                                return Some("loopback blocked".to_string());
                            }
                        }
                    }
                }
            }
            None
        }
        Err(_) => Some("invalid URL".to_string()),
    }
}

fn extract_bearer_token(headers: &HeaderMap) -> Option<String> {
    headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(|s| s.to_string())
}

pub async fn egress_fetch(
    headers: HeaderMap,
    Json(req): Json<EgressFetchRequest>,
) -> Result<Json<EgressFetchResponse>, (StatusCode, String)> {
    let expected_token =
        std::env::var("RUNTIME_SERVICE_TOKEN").unwrap_or_else(|_| "dev-runtime-token".to_string());

    let token = extract_bearer_token(&headers)
        .ok_or((StatusCode::UNAUTHORIZED, "Missing Bearer token".to_string()))?;

    if token != expected_token {
        return Err((StatusCode::UNAUTHORIZED, "Invalid token".to_string()));
    }

    if req.method != "GET" && req.method != "HEAD" {
        return Err((
            StatusCode::BAD_REQUEST,
            "Only GET and HEAD methods allowed".to_string(),
        ));
    }

    if req.max_bytes > 524288 {
        return Err((
            StatusCode::BAD_REQUEST,
            "max_bytes exceeds limit (524288)".to_string(),
        ));
    }

    let request_id = format!("eg_{}", Uuid::new_v4());
    let start = Instant::now();

    if let Some(deny_reason) = is_ssrf_blocked(&req.url) {
        let latency_ms = start.elapsed().as_millis() as u64;

        let audit_record = AuditRecord {
            timestamp: Utc::now().to_rfc3339(),
            request_id: request_id.clone(),
            agent_instance_id: req.agent_instance_id.clone(),
            routine_id: req.routine_id.clone(),
            skill_id: req.skill_id.clone(),
            purpose: req.purpose.clone(),
            method: req.method.clone(),
            url: req.url.clone(),
            final_url: req.url.clone(),
            status: 0,
            bytes: 0,
            latency_ms,
            deny_reason: Some(deny_reason.clone()),
        };

        if let Err(e) = write_audit_record(&audit_record) {
            tracing::warn!("Failed to write audit record: {}", e);
        }

        return Err((StatusCode::FORBIDDEN, deny_reason));
    }

    let mode =
        std::env::var("OPENSTAFF_GATEWAY_EGRESS_MODE").unwrap_or_else(|_| "offline".to_string());

    let (status, final_url, content_type, mut body_text, bytes) = if mode == "live" {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_millis(req.timeout_ms))
            .build()
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let response = client
            .get(&req.url)
            .send()
            .await
            .map_err(|e| (StatusCode::BAD_GATEWAY, format!("Fetch failed: {}", e)))?;

        let status = response.status().as_u16();
        let final_url = response.url().to_string();
        let content_type = response
            .headers()
            .get("content-type")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("application/octet-stream")
            .to_string();

        let text = response
            .text()
            .await
            .map_err(|e| (StatusCode::BAD_GATEWAY, format!("Read body failed: {}", e)))?;

        let bytes = text.len();
        (status, final_url, content_type, text, bytes)
    } else {
        let fixture_content = format!(
            "<!-- OFFLINE MODE: Fixture response for {} -->\n\
             <html><body><h1>Demo Fixture</h1>\n\
             <p>This is a demo response for offline mode.</p>\n\
             <p>Purpose: {}</p>\n\
             </body></html>",
            req.url, req.purpose
        );
        let bytes = fixture_content.len();
        (
            200,
            req.url.clone(),
            "text/html".to_string(),
            fixture_content,
            bytes,
        )
    };

    let truncated = body_text.len() > req.max_bytes;
    if truncated {
        body_text.truncate(req.max_bytes);
    }

    let latency_ms = start.elapsed().as_millis() as u64;

    let audit_record = AuditRecord {
        timestamp: Utc::now().to_rfc3339(),
        request_id: request_id.clone(),
        agent_instance_id: req.agent_instance_id.clone(),
        routine_id: req.routine_id.clone(),
        skill_id: req.skill_id.clone(),
        purpose: req.purpose.clone(),
        method: req.method.clone(),
        url: req.url.clone(),
        final_url: final_url.clone(),
        status,
        bytes,
        latency_ms,
        deny_reason: None,
    };

    if let Err(e) = write_audit_record(&audit_record) {
        tracing::warn!("Failed to write audit record: {}", e);
    }

    Ok(Json(EgressFetchResponse {
        request_id,
        status,
        final_url,
        content_type,
        body_text,
        truncated,
        bytes,
    }))
}
