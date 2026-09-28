use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ExternalInsightFact {
    pub bucket: String,
    pub title: String,
    pub summary_zh: String,
    pub url: String,
    pub tags: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pdf_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReconcileResult {
    pub status: String,
    pub facts: Vec<ExternalInsightFact>,
    pub errors: Vec<String>,
}

pub fn should_emit_report_card(reconcile: &ReconcileResult) -> bool {
    reconcile.status == "PASS"
}

pub fn create_report_card_payload_if_passed(reconcile: &ReconcileResult) -> Option<Value> {
    if reconcile.status != "PASS" {
        return None;
    }

    let summary: Vec<String> = reconcile
        .facts
        .iter()
        .take(3)
        .map(|fact| fact.title.clone())
        .collect();

    Some(serde_json::json!({
        "reconcile_status": "PASS",
        "facts": reconcile.facts,
        "summary": summary,
    }))
}
