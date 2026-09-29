use serde::Serialize;
use std::fs::{create_dir_all, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

#[derive(Debug, Serialize)]
pub struct AuditRecord {
    pub timestamp: String,
    pub request_id: String,
    pub agent_instance_id: String,
    pub routine_id: Option<String>,
    pub skill_id: String,
    pub purpose: String,
    pub method: String,
    pub url: String,
    pub final_url: String,
    pub status: u16,
    pub bytes: usize,
    pub latency_ms: u64,
    pub deny_reason: Option<String>,
}

pub fn ensure_audit_dir() -> anyhow::Result<()> {
    let audit_dir = get_audit_dir();
    create_dir_all(&audit_dir)?;
    tracing::info!("📝 Audit logs: {}", audit_dir.display());
    Ok(())
}

pub fn get_audit_dir() -> PathBuf {
    PathBuf::from("artifacts/gateway-audit")
}

pub fn write_audit_record(record: &AuditRecord) -> anyhow::Result<()> {
    let audit_dir = get_audit_dir();
    let log_file = audit_dir.join("egress-audit.jsonl");

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file)?;

    let json_line = serde_json::to_string(record)?;
    writeln!(file, "{}", json_line)?;

    tracing::debug!(
        "Audit: {} {} {} → {} ({}B, {}ms) {}",
        record.request_id,
        record.method,
        record.url,
        record.status,
        record.bytes,
        record.latency_ms,
        record
            .deny_reason
            .as_ref()
            .map(|r| format!("DENIED: {}", r))
            .unwrap_or_default()
    );

    Ok(())
}
