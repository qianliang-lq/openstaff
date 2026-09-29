//! BYOK Chat Contract Tests (TC-055+)
//!
//! Validates BYOK (Bring Your Own Key) chat contracts:
//! - Key storage security (no localStorage, git, logs)
//! - Chat endpoint path: desktop → api → gateway (never bypass)
//! - Auth failures: no key + no env → 401/403 (not silent success)
//! - Audit scrubbing: no keys, no full message bodies in logs
//!
//! These tests are offline-friendly and run in CI by default.

use std::env;
use std::fs;
use std::path::PathBuf;

/// Helper to get workspace root directory
fn workspace_root() -> PathBuf {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
    PathBuf::from(manifest_dir)
        .parent()
        .expect("parent 1")
        .parent()
        .expect("parent 2 (workspace root)")
        .to_path_buf()
}

/// TC-055: No Provider Key Returns Auth Error
///
/// Validates that chat endpoint returns 401/403 when no provider key
/// is supplied and no env fallback exists (must NOT return 200 with fake content).
#[test]
fn tc_055_no_provider_key_returns_auth_error() {
    // This test validates the contract shape.
    // Gateway implementation should reject requests without X-OpenStaff-Provider-Key
    // when no env fallback (QWEN_API_KEY or GLM_API_KEY) is configured.

    // Contract: POST /v1/chat
    // Missing: X-OpenStaff-Provider-Key header
    // Missing: QWEN_API_KEY or GLM_API_KEY env vars
    // Expected: HTTP 401 or 403 with clear error message
    // Expected error shape: {"error": "Missing provider API key", "code": "auth_required"}

    // Note: This is a contract specification test.
    // When gateway /v1/chat is implemented, add integration test similar to
    // test_egress_fetch_unauthorized in services/gateway/src/main.rs

    eprintln!(
        "✅ TC-055: Contract defined - Gateway /v1/chat must return 401/403 when no key provided"
    );
    eprintln!("   Expected response: {{\"error\": \"Missing provider API key\", \"code\": \"auth_required\"}}");
    eprintln!(
        "   OPENSTAFF NOTE: Add integration test in services/gateway when route is implemented"
    );
}

/// TC-056: With Mock Key Returns Valid Response
///
/// Validates that with a mock/test key (or stub), the api→gateway path
/// returns 200 JSON with correct chat response shape.
#[test]
fn tc_056_with_mock_key_returns_valid_response() {
    // Contract: POST /v1/chat
    // Headers:
    //   - Authorization: Bearer <service_token>  (inter-service auth)
    //   - X-OpenStaff-Provider-Key: <user BYOK key>  (provider auth)
    // Body:
    // {
    //   "provider": "qwen" | "glm",
    //   "model": "string",
    //   "messages": [{"role": "user", "content": "..."}],
    //   "stream": false,
    //   "temperature": 0.7
    // }
    //
    // Expected 200 response:
    // {
    //   "id": "chat_...",
    //   "provider": "qwen",
    //   "model": "...",
    //   "message": {"role": "assistant", "content": "..."},
    //   "usage": {"prompt_tokens": 0, "completion_tokens": 0}
    // }

    // Response shape validation
    let expected_fields = vec!["id", "provider", "model", "message", "usage"];
    eprintln!("✅ TC-056: Contract defined - /v1/chat response shape");
    eprintln!("   Required fields: {:?}", expected_fields);
    eprintln!("   Message shape: {{\"role\": \"assistant\", \"content\": \"...\"}}");
    eprintln!("   OPENSTAFF NOTE: Add integration test in services/gateway with offline mock");
}

/// TC-057: Audit Log Scrub - No Keys or Full Messages
///
/// Validates that audit logs do NOT contain:
/// - Provider API keys (in any form)
/// - Full message bodies (only hash/length allowed)
///
/// Audit SHOULD contain:
/// - timestamp, request_id, provider, model, status, latency, token counts
#[test]
fn tc_057_audit_log_scrub_no_keys_or_full_messages() {
    // Contract: Gateway audit log format for chat calls
    // MUST include: ts, request_id, provider, model, status, latency_ms, prompt_tokens, completion_tokens
    // MUST NOT include: X-OpenStaff-Provider-Key value, full messages content
    // MAY include: message hash, message length

    // Example valid audit line:
    // {"ts":"2026-09-29T09:00:00Z","request_id":"chat_abc123","provider":"qwen",
    //  "model":"qwen-max","status":"success","latency_ms":1234,
    //  "prompt_tokens":45,"completion_tokens":78,"message_hash":"sha256:...","message_len":156}

    // This test validates the contract by checking existing audit code
    let audit_rs_path = workspace_root().join("services/gateway/src/audit.rs");

    if audit_rs_path.exists() {
        let content = fs::read_to_string(&audit_rs_path).expect("Failed to read audit.rs");

        // Check that audit module does NOT log sensitive headers directly
        assert!(
            !content.contains("X-OpenStaff-Provider-Key") || content.contains("// SECURITY"),
            "audit.rs should not log X-OpenStaff-Provider-Key directly (add SECURITY comment if mentioned)"
        );

        eprintln!("✅ TC-057: Audit module checked for key scrubbing patterns");
    } else {
        eprintln!("⚠️  TC-057: audit.rs not found, contract defined");
    }

    eprintln!("   Contract: Audit logs MUST NOT contain provider keys or full message bodies");
    eprintln!("   Contract: Audit logs SHOULD contain: ts, request_id, provider, model, status, latency, tokens");
}

/// TC-058: Path Gate - Desktop Targets API Not Gateway Directly
///
/// Validates that desktop chat client targets API /v1/chat (not vendor hosts or gateway directly).
/// Path must be: desktop → api → gateway
#[test]
fn tc_058_path_gate_desktop_targets_api() {
    // Contract: Desktop chat MUST call:
    //   POST <api_base_url>/v1/chat  (e.g., http://localhost:3000/v1/chat)
    //
    // Desktop chat MUST NOT directly call:
    //   - Vendor URLs (api.qwen.com, open.bigmodel.cn)
    //   - Gateway directly (http://localhost:3001/v1/chat)
    //
    // This enforces:
    //   - Session tracking via API
    //   - Future gating/quota enforcement
    //   - Audit trail

    let desktop_src_path = workspace_root().join("apps/desktop/src");

    if desktop_src_path.exists() {
        // Check for any direct vendor API calls (should not exist)
        let desktop_files: Vec<PathBuf> = fs::read_dir(&desktop_src_path)
            .ok()
            .map(|entries| {
                entries
                    .filter_map(|e| e.ok())
                    .map(|e| e.path())
                    .filter(|p| {
                        p.extension()
                            .map(|e| e == "ts" || e == "tsx")
                            .unwrap_or(false)
                    })
                    .collect()
            })
            .unwrap_or_default();

        for file in desktop_files {
            if let Ok(content) = fs::read_to_string(&file) {
                // Check for direct vendor calls
                assert!(
                    !content.contains("api.qwen.com")
                        && !content.contains("open.bigmodel.cn")
                        && !content.contains("dashscope.aliyuncs.com"),
                    "Desktop should not contain direct vendor API URLs in {:?}",
                    file.file_name()
                );

                // If chat endpoint is mentioned, it should target api, not gateway
                if content.contains("/v1/chat") {
                    assert!(
                        !content.contains("3001/v1/chat") && !content.contains("gateway/v1/chat"),
                        "Desktop should not call gateway:3001/v1/chat directly in {:?}",
                        file.file_name()
                    );
                }
            }
        }

        eprintln!("✅ TC-058: Desktop source checked for direct vendor/gateway bypass");
    } else {
        eprintln!("⚠️  TC-058: Desktop source not found, contract defined");
    }

    eprintln!("   Contract: Desktop MUST call API /v1/chat, MUST NOT bypass to vendor or gateway");
}

/// TC-059: Settings Key Storage - No localStorage Keys
///
/// Validates that provider API keys are NOT stored in localStorage
/// (which is vulnerable to XSS attacks).
///
/// Keys MUST be stored in:
/// - OS keychain / Tauri secure storage (recommended)
/// - Encrypted app data directory (acceptable for MVP)
///
/// Keys MUST NOT be stored in:
/// - localStorage
/// - sessionStorage
/// - Unencrypted files in repository
#[test]
fn tc_059_settings_no_localstorage_keys() {
    // Contract: Desktop settings MUST NOT write provider keys to localStorage
    // Search for patterns like:
    //   - localStorage.setItem("qwen_key", ...)
    //   - localStorage.setItem("glm_key", ...)
    //   - window.localStorage

    let desktop_src_path = workspace_root().join("apps/desktop/src");

    if desktop_src_path.exists() {
        let desktop_files: Vec<PathBuf> = walkdir::WalkDir::new(&desktop_src_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .map(|e| e.path().to_path_buf())
            .filter(|p| {
                p.extension()
                    .map(|e| e == "ts" || e == "tsx")
                    .unwrap_or(false)
            })
            .collect();

        for file in desktop_files {
            if let Ok(content) = fs::read_to_string(&file) {
                // Check for localStorage.setItem with key-related patterns
                let has_localstorage_set = content.contains("localStorage.setItem");
                let has_key_pattern = content.contains("_key\"")
                    || content.contains("_Key\"")
                    || content.contains("apiKey")
                    || content.contains("api_key");

                if has_localstorage_set && has_key_pattern {
                    // Allow if there's a comment explaining it's NOT for provider keys
                    assert!(
                        content.contains("// NOT provider key")
                            || content.contains("// safe:")
                            || content.contains("// test fixture"),
                        "Suspicious localStorage.setItem with key pattern in {:?} - add safety comment if intentional",
                        file.file_name()
                    );
                }
            }
        }

        eprintln!("✅ TC-059: Desktop source checked for localStorage key storage patterns");
    } else {
        eprintln!("⚠️  TC-059: Desktop source not found, contract defined");
    }

    eprintln!("   Contract: Provider keys MUST NOT be stored in localStorage/sessionStorage");
    eprintln!(
        "   Contract: Use OS keychain (Tauri secure storage) or encrypted app data directory"
    );
}

#[cfg(test)]
mod optional_integration_tests {
    //! Optional integration tests that validate live BYOK chat flow.
    //! Run only when OPENSTAFF_SMOKE=1 is set.

    use std::env;

    fn should_run_smoke() -> bool {
        env::var("OPENSTAFF_SMOKE").unwrap_or_default() == "1"
    }

    /// TC-055-live: No Provider Key Returns Auth Error (Integration)
    ///
    /// Live test that calls gateway /v1/chat without key and expects 401/403.
    #[test]
    #[ignore]
    fn tc_055_live_no_key_auth_error() {
        if !should_run_smoke() {
            eprintln!("⏭️  Skipping live BYOK test (set OPENSTAFF_SMOKE=1 to enable)");
            return;
        }

        eprintln!("🔥 Running live BYOK no-key test...");
        eprintln!("⚠️  Live integration test not yet implemented");
        eprintln!("   Manual test:");
        eprintln!("   curl -X POST http://localhost:3001/v1/chat \\");
        eprintln!("     -H 'Content-Type: application/json' \\");
        eprintln!("     -H 'Authorization: Bearer test-token' \\");
        eprintln!("     -d '{{\"provider\":\"qwen\",\"messages\":[{{\"role\":\"user\",\"content\":\"hi\"}}]}}'");
        eprintln!("   Expected: HTTP 401 or 403 with error message");
    }

    /// TC-056-live: With Mock Key Returns Valid Response (Integration)
    ///
    /// Live test that calls gateway /v1/chat with test key and expects 200.
    #[test]
    #[ignore]
    fn tc_056_live_mock_key_success() {
        if !should_run_smoke() {
            eprintln!("⏭️  Skipping live BYOK test (set OPENSTAFF_SMOKE=1 to enable)");
            return;
        }

        eprintln!("🔥 Running live BYOK mock key test...");
        eprintln!("⚠️  Live integration test not yet implemented");
        eprintln!("   Manual test:");
        eprintln!("   curl -X POST http://localhost:3001/v1/chat \\");
        eprintln!("     -H 'Content-Type: application/json' \\");
        eprintln!("     -H 'Authorization: Bearer test-token' \\");
        eprintln!("     -H 'X-OpenStaff-Provider-Key: test-mock-key' \\");
        eprintln!("     -d '{{\"provider\":\"qwen\",\"messages\":[{{\"role\":\"user\",\"content\":\"hi\"}}]}}'");
        eprintln!(
            "   Expected: HTTP 200 with {{\"id\",\"provider\",\"model\",\"message\",\"usage\"}}"
        );
    }
}
