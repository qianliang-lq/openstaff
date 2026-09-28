use serde::Serialize;
use std::fs::{create_dir_all, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

#[derive(Debug, Serialize)]
pub struct AuditRecord {
    pub timestamp: String,
    pub role: Option<String>,
    pub routine_id: Option<String>,
    pub url: String,
    pub status: u16,
    pub bytes: usize,
    pub operation: String,
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
        "Audit: {} {} → {} ({}B)",
        record.operation,
        record.url,
        record.status,
        record.bytes
    );

    Ok(())
}
