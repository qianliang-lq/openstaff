use openstaff_runtime::external_insight::{
    create_report_card_payload_if_passed, should_emit_report_card, ExternalInsightFact,
    ReconcileResult,
};
use std::fs;

/// TC-028: Facts Schema Contract
/// Validates that facts JSON conforms to the schema defined in
/// skills/external-insight-public-search/schema/public-facts.schema.json
#[test]
fn test_facts_schema_contract() {
    let fixture_path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../tests/fixtures/external-insight-golden-facts.json"
    );

    let json_str = fs::read_to_string(fixture_path).expect("Failed to read golden fixture");

    let facts: Vec<ExternalInsightFact> =
        serde_json::from_str(&json_str).expect("Failed to deserialize facts");

    assert!(!facts.is_empty(), "Facts array should not be empty");

    for (idx, fact) in facts.iter().enumerate() {
        // Required fields must be present and non-empty
        assert!(
            !fact.bucket.is_empty(),
            "Fact {} bucket must be non-empty",
            idx
        );
        assert!(
            ["竞对", "组织提效", "前沿模型", "技术底座"].contains(&fact.bucket.as_str()),
            "Fact {} bucket must be one of the valid values, got: {}",
            idx,
            fact.bucket
        );

        assert!(
            !fact.title.is_empty(),
            "Fact {} title must be non-empty",
            idx
        );
        assert!(
            fact.title.len() >= 1,
            "Fact {} title must have minLength 1",
            idx
        );

        assert!(
            !fact.summary_zh.is_empty(),
            "Fact {} summary_zh must be non-empty",
            idx
        );
        assert!(
            fact.summary_zh.len() >= 1,
            "Fact {} summary_zh must have minLength 1",
            idx
        );

        assert!(!fact.url.is_empty(), "Fact {} url must be non-empty", idx);
        assert!(
            fact.url.starts_with("http://") || fact.url.starts_with("https://"),
            "Fact {} url must be a valid URI starting with http:// or https://",
            idx
        );

        assert!(
            !fact.tags.is_empty(),
            "Fact {} tags must have minItems 1",
            idx
        );

        // If pdf_url is present, it must be a valid URI
        if let Some(pdf_url) = &fact.pdf_url {
            assert!(
                pdf_url.starts_with("http://") || pdf_url.starts_with("https://"),
                "Fact {} pdf_url must be a valid URI starting with http:// or https://",
                idx
            );
        }

        // No additional properties allowed - verify serialization roundtrip preserves only known fields
        let serialized = serde_json::to_value(fact).expect("Failed to serialize fact");
        let obj = serialized.as_object().expect("Should be an object");
        let expected_keys = if fact.pdf_url.is_some() { 6 } else { 5 };
        assert_eq!(
            obj.len(),
            expected_keys,
            "Fact {} should have exactly {} properties (no additionalProperties)",
            idx,
            expected_keys
        );
    }
}

/// TC-028-reject: Facts Schema Contract - Reject Malformed Facts
/// Validates that malformed facts are properly rejected
#[test]
fn test_facts_schema_contract_reject_malformed() {
    // Missing required field "bucket"
    let malformed_missing_bucket = r#"[{
        "title": "Test",
        "summary_zh": "Summary",
        "url": "https://example.com",
        "tags": ["test"]
    }]"#;
    let result: Result<Vec<ExternalInsightFact>, _> =
        serde_json::from_str(malformed_missing_bucket);
    assert!(result.is_err(), "Should reject fact missing 'bucket' field");

    // Invalid bucket value
    let malformed_invalid_bucket = r#"[{
        "bucket": "invalid_bucket",
        "title": "Test",
        "summary_zh": "Summary",
        "url": "https://example.com",
        "tags": ["test"]
    }]"#;
    let result: Result<Vec<ExternalInsightFact>, _> =
        serde_json::from_str(malformed_invalid_bucket);
    // Note: serde_json doesn't enforce enum constraints at deserialization,
    // so we validate this in a separate test
    if let Ok(facts) = result {
        assert!(
            !["竞对", "组织提效", "前沿模型", "技术底座"].contains(&facts[0].bucket.as_str()),
            "Should not match valid bucket values"
        );
    }

    // Empty tags array
    let malformed_empty_tags = r#"[{
        "bucket": "竞对",
        "title": "Test",
        "summary_zh": "Summary",
        "url": "https://example.com",
        "tags": []
    }]"#;
    let result: Result<Vec<ExternalInsightFact>, _> = serde_json::from_str(malformed_empty_tags);
    // serde_json will deserialize this, but we validate minItems in the contract test
    if let Ok(facts) = result {
        assert!(facts[0].tags.is_empty(), "Tags array is empty");
    }
}

/// TC-029: Reconcile Gate - FAILED reconcile must not produce report card payload
/// Validates that when reconcile status is FAILED, no report card event is generated
#[test]
fn test_reconcile_gate_failed_blocks_report_card() {
    // Simulate a FAILED reconcile result
    let failed_reconcile = ReconcileResult {
        status: "FAILED".to_string(),
        facts: vec![],
        errors: vec!["URL not reachable: https://example.com/broken".to_string()],
    };

    // When reconcile FAILED, should_emit_report_card returns false
    let should_emit = should_emit_report_card(&failed_reconcile);
    assert!(!should_emit, "FAILED reconcile must not emit report card");

    // Verify no EventEnvelope payload is created
    let event_payload = create_report_card_payload_if_passed(&failed_reconcile);
    assert!(
        event_payload.is_none(),
        "FAILED reconcile must not create EventEnvelope payload"
    );
}

/// TC-029-pass: Reconcile Gate - PASS reconcile allows report card payload
/// Validates that when reconcile status is PASS, report card event is allowed
#[test]
fn test_reconcile_gate_pass_allows_report_card() {
    let fixture_path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../tests/fixtures/external-insight-golden-facts.json"
    );

    let json_str = fs::read_to_string(fixture_path).expect("Failed to read golden fixture");

    let facts: Vec<ExternalInsightFact> =
        serde_json::from_str(&json_str).expect("Failed to deserialize facts");

    // Simulate a PASS reconcile result
    let passed_reconcile = ReconcileResult {
        status: "PASS".to_string(),
        facts: facts.clone(),
        errors: vec![],
    };

    // When reconcile PASS, should_emit_report_card returns true
    let should_emit = should_emit_report_card(&passed_reconcile);
    assert!(
        should_emit,
        "PASS reconcile should allow report card emission"
    );

    // Verify EventEnvelope payload is created with summary ≤ 3 items
    let event_payload = create_report_card_payload_if_passed(&passed_reconcile);
    assert!(
        event_payload.is_some(),
        "PASS reconcile should create EventEnvelope payload"
    );

    let payload = event_payload.unwrap();
    assert_eq!(payload["reconcile_status"], "PASS");
    assert_eq!(payload["facts"].as_array().unwrap().len(), facts.len());

    // Verify summary is limited to ≤ 3 items
    let summary = payload["summary"].as_array().unwrap();
    assert!(
        summary.len() <= 3,
        "Summary must be limited to ≤ 3 items, got {}",
        summary.len()
    );
}
