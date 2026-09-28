use crate::audit::{write_audit_record, AuditRecord};
use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct WebFetchRequest {
    pub url: String,
    #[serde(default)]
    pub role: Option<String>,
    #[serde(default)]
    pub routine_id: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct WebFetchResponse {
    pub url: String,
    pub status: u16,
    pub content: String,
    pub bytes: usize,
}

#[derive(Debug, Serialize)]
pub struct WebSearchResponse {
    pub query: String,
    pub results: Vec<SearchResult>,
    pub mode: String,
}

#[derive(Debug, Serialize)]
pub struct SearchResult {
    pub title: String,
    pub url: String,
    pub snippet: String,
}

pub async fn web_fetch(
    Json(req): Json<WebFetchRequest>,
) -> Result<Json<WebFetchResponse>, (StatusCode, String)> {
    let mode = std::env::var("OPENSTAFF_GATEWAY_EGRESS_MODE").unwrap_or_else(|_| "offline".to_string());

    let (status, content, bytes) = if mode == "live" {
        match reqwest::get(&req.url).await {
            Ok(response) => {
                let status = response.status().as_u16();
                let text = response
                    .text()
                    .await
                    .unwrap_or_else(|_| "Failed to read response body".to_string());
                let bytes = text.len();
                (status, text, bytes)
            }
            Err(e) => {
                return Err((
                    StatusCode::BAD_GATEWAY,
                    format!("Failed to fetch URL: {}", e),
                ))
            }
        }
    } else {
        let fixture_content = format!(
            "<!-- OFFLINE MODE: Fixture response for {} -->\n\
             <html><body><h1>Demo Fixture</h1>\n\
             <p>This is a demo response for offline mode.</p>\n\
             </body></html>",
            req.url
        );
        let bytes = fixture_content.len();
        (200, fixture_content, bytes)
    };

    let audit_record = AuditRecord {
        timestamp: Utc::now().to_rfc3339(),
        role: req.role.clone(),
        routine_id: req.routine_id.clone(),
        url: req.url.clone(),
        status,
        bytes,
        operation: "web_fetch".to_string(),
    };

    if let Err(e) = write_audit_record(&audit_record) {
        tracing::warn!("Failed to write audit record: {}", e);
    }

    Ok(Json(WebFetchResponse {
        url: req.url,
        status,
        content,
        bytes,
    }))
}

pub async fn web_search(
    Json(req): Json<WebFetchRequest>,
) -> Result<Json<WebSearchResponse>, (StatusCode, String)> {
    let mode = std::env::var("OPENSTAFF_GATEWAY_EGRESS_MODE").unwrap_or_else(|_| "offline".to_string());

    let results = if mode == "live" {
        vec![SearchResult {
            title: "Live search not implemented in MVP".to_string(),
            url: req.url.clone(),
            snippet: "Web search integration requires API keys. Using offline mode.".to_string(),
        }]
    } else {
        vec![
            SearchResult {
                title: "Demo Search Result 1".to_string(),
                url: format!("https://example.com/result1?q={}", req.url),
                snippet: "This is a demo search result for offline mode.".to_string(),
            },
            SearchResult {
                title: "Demo Search Result 2".to_string(),
                url: format!("https://example.com/result2?q={}", req.url),
                snippet: "Another demo result showing structured data.".to_string(),
            },
        ]
    };

    let audit_record = AuditRecord {
        timestamp: Utc::now().to_rfc3339(),
        role: req.role.clone(),
        routine_id: req.routine_id.clone(),
        url: req.url.clone(),
        status: 200,
        bytes: 0,
        operation: "web_search".to_string(),
    };

    if let Err(e) = write_audit_record(&audit_record) {
        tracing::warn!("Failed to write audit record: {}", e);
    }

    Ok(Json(WebSearchResponse {
        query: req.url,
        results,
        mode,
    }))
}
