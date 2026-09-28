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
pub struct JobFireRequest {
    pub job_id: String,
    pub routine_id: String,
    pub skill_id: String,
    pub trigger: String,
    pub scheduled_for: String,
    #[serde(default)]
    pub payload: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct JobFireResponse {
    pub job_id: String,
    pub accepted: bool,
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

pub async fn jobs_fire(
    Json(req): Json<JobFireRequest>,
) -> Result<Json<JobFireResponse>, (StatusCode, String)> {
    tracing::info!(
        "🔥 Job fired: {} (routine={}, skill={}, trigger={})",
        req.job_id,
        req.routine_id,
        req.skill_id,
        req.trigger
    );

    let job_id = req.job_id.clone();
    let routine_id = req.routine_id.clone();
    let skill_id = req.skill_id.clone();

    tokio::spawn(async move {
        if let Err(e) = execute_job(&job_id, &routine_id, &skill_id).await {
            tracing::error!("Job {} execution failed: {}", job_id, e);
        }
    });

    Ok(Json(JobFireResponse {
        job_id: req.job_id,
        accepted: true,
    }))
}

async fn execute_job(job_id: &str, _routine_id: &str, _skill_id: &str) -> Result<(), String> {
    tracing::info!("Executing job {}", job_id);

    let demo_mode = get_demo_mode();

    let facts = if demo_mode {
        load_golden_fixture().map_err(|e| format!("Failed to load golden fixture: {}", e))?
    } else {
        tracing::warn!("Live mode not implemented in MVP. Using golden fixture.");
        load_golden_fixture().map_err(|e| format!("Failed to load golden fixture: {}", e))?
    };

    let reconcile = run_reconcile(facts).await;

    ensure_artifacts_dir().map_err(|e| format!("Failed to create artifacts directory: {}", e))?;

    let timestamp = Utc::now().format("%Y-%m-%d").to_string();
    let facts_path = get_artifacts_dir().join(format!("{}-public-facts.json", timestamp));

    let facts_json = serde_json::to_string_pretty(&reconcile.facts)
        .map_err(|e| format!("Failed to serialize facts: {}", e))?;

    write(&facts_path, facts_json).map_err(|e| format!("Failed to write facts file: {}", e))?;

    tracing::info!(
        "Reconcile status: {} (errors: {})",
        reconcile.status,
        reconcile.errors.len()
    );
    tracing::info!("Written facts to: {}", facts_path.display());

    if !should_emit_report_card(&reconcile) {
        tracing::warn!("Reconcile FAILED, not emitting report card");
        return Ok(());
    }

    let payload = create_report_card_payload_if_passed(&reconcile);

    if payload.is_some() {
        tracing::info!("✅ Job {} completed successfully with PASS", job_id);
    }

    Ok(())
}
