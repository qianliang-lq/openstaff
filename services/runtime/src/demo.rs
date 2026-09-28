use crate::external_insight::{
    create_report_card_payload_if_passed, should_emit_report_card, ExternalInsightFact,
    ReconcileResult,
};
use axum::{http::StatusCode, Json};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs::{create_dir_all, write};
use std::path::PathBuf;

#[derive(Debug, Deserialize)]
pub struct DemoRequest {
    #[serde(default)]
    pub use_fixture: bool,
}

#[derive(Debug, Serialize)]
pub struct DemoResponse {
    pub reconcile_status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub facts: Option<Vec<ExternalInsightFact>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<Vec<String>>,
    pub artifacts_path: String,
    pub timestamp: String,
}

fn get_demo_mode() -> bool {
    std::env::var("OPENSTAFF_INSIGHT_DEMO")
        .unwrap_or_else(|_| "1".to_string())
        .trim()
        == "1"
}

fn get_artifacts_dir() -> PathBuf {
    PathBuf::from("artifacts/external-insight")
}

fn ensure_artifacts_dir() -> anyhow::Result<()> {
    let dir = get_artifacts_dir();
    create_dir_all(&dir)?;
    Ok(())
}

fn load_golden_fixture() -> anyhow::Result<Vec<ExternalInsightFact>> {
    let fixture_path = "tests/fixtures/external-insight-golden-facts.json";
    let content = std::fs::read_to_string(fixture_path)?;
    let facts: Vec<ExternalInsightFact> = serde_json::from_str(&content)?;
    Ok(facts)
}

async fn run_reconcile(facts: Vec<ExternalInsightFact>) -> ReconcileResult {
    let mut errors = Vec::new();

    for (idx, fact) in facts.iter().enumerate() {
        if fact.bucket.is_empty() {
            errors.push(format!("Fact {} has empty bucket", idx));
        }
        if fact.title.is_empty() {
            errors.push(format!("Fact {} has empty title", idx));
        }
        if fact.tags.is_empty() {
            errors.push(format!("Fact {} has empty tags", idx));
        }
    }

    let status = if errors.is_empty() { "PASS" } else { "FAILED" };

    ReconcileResult {
        status: status.to_string(),
        facts,
        errors,
    }
}

pub async fn run_external_insight(
    Json(req): Json<DemoRequest>,
) -> Result<Json<DemoResponse>, (StatusCode, String)> {
    let demo_mode = get_demo_mode() || req.use_fixture;

    tracing::info!(
        "Running external-insight demo (demo_mode={}, use_fixture={})",
        demo_mode,
        req.use_fixture
    );

    let facts = if demo_mode {
        load_golden_fixture().map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load golden fixture: {}", e),
            )
        })?
    } else {
        return Err((
            StatusCode::NOT_IMPLEMENTED,
            "Live mode not implemented in MVP. Set OPENSTAFF_INSIGHT_DEMO=1 or use_fixture=true"
                .to_string(),
        ));
    };

    let reconcile = run_reconcile(facts).await;

    ensure_artifacts_dir().map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to create artifacts directory: {}", e),
        )
    })?;

    let timestamp = Utc::now().format("%Y-%m-%d").to_string();
    let facts_path = get_artifacts_dir().join(format!("{}-public-facts.json", timestamp));

    let facts_json = serde_json::to_string_pretty(&reconcile.facts).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to serialize facts: {}", e),
        )
    })?;

    write(&facts_path, facts_json).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to write facts file: {}", e),
        )
    })?;

    tracing::info!(
        "Reconcile status: {} (errors: {})",
        reconcile.status,
        reconcile.errors.len()
    );
    tracing::info!("Written facts to: {}", facts_path.display());

    if !should_emit_report_card(&reconcile) {
        tracing::warn!("Reconcile FAILED, not emitting report card");
        return Ok(Json(DemoResponse {
            reconcile_status: reconcile.status,
            facts: None,
            summary: None,
            artifacts_path: facts_path.to_string_lossy().to_string(),
            timestamp,
        }));
    }

    let payload = create_report_card_payload_if_passed(&reconcile);

    match payload {
        Some(_) => {
            let facts = reconcile.facts;
            let summary: Vec<String> = facts.iter().take(3).map(|f| f.title.clone()).collect();

            Ok(Json(DemoResponse {
                reconcile_status: "PASS".to_string(),
                facts: Some(facts),
                summary: Some(summary),
                artifacts_path: facts_path.to_string_lossy().to_string(),
                timestamp,
            }))
        }
        None => Ok(Json(DemoResponse {
            reconcile_status: reconcile.status,
            facts: None,
            summary: None,
            artifacts_path: facts_path.to_string_lossy().to_string(),
            timestamp,
        })),
    }
}
