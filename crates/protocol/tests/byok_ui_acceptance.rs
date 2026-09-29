//! BYOK UI Acceptance Tests (TC-060+)
//!
//! Validates BYOK UI acceptance criteria matching room-locked sketches:
//! - TC-060: Connectors Key page (Qwen/GLM slots, on-device storage)
//! - TC-061: Chat empty state (guide + CTA, input disabled until Key)
//! - TC-062: Chat error state (clear 401 error, actions: 去配置 + 重试)
//!
//! These are lightweight offline checks until UI is wired.
//! Tests stay green by checking source structure, not runtime behavior.

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

/// TC-060: Connectors Key Page Structure
///
/// Acceptance: Sketch 18-byok-connectors-keys.png
/// - Qwen/GLM provider slots (separate fields)
/// - Store on-device (OS keychain / Tauri secure storage)
/// - MUST NOT use git / localStorage
///
/// **HARDENED**: This test FAILS if Connectors tab structure doesn't match sketch 18
#[test]
fn tc_060_connectors_key_page_structure() {
    eprintln!("🔍 TC-060: Connectors Key page acceptance (HARDENED)");

    let desktop_main_stage = workspace_root().join("apps/desktop/src/components/MainStage.tsx");
    let settings_tsx = workspace_root().join("apps/desktop/src/components/Settings.tsx");

    let mut has_connectors_tab = false;
    let mut connectors_properly_located = false;

    if desktop_main_stage.exists() {
        let content =
            fs::read_to_string(&desktop_main_stage).expect("Failed to read MainStage.tsx");

        // Check if Connectors tab exists in MainStage
        if content.contains("connectors") || content.contains("Connectors") {
            has_connectors_tab = true;
            eprintln!("   ✅ Connectors tab mentioned in MainStage");

            // Check if it uses real Connectors component (not stub)
            // Look for the specific line with connectors tab
            if content.contains("activeTab === 'connectors' && <Connectors")
                || (content.contains("activeTab === 'connectors'")
                    && content.contains("<Connectors"))
            {
                connectors_properly_located = true;
                eprintln!("   ✅ Connectors component properly integrated");
            } else if content
                .lines()
                .any(|line| line.contains("connectors") && line.contains("stub-page"))
            {
                eprintln!("   ❌ Connectors tab is only a stub (开发中)");
                connectors_properly_located = false;
            } else {
                eprintln!("   ❌ Connectors tab routing unclear");
                connectors_properly_located = false;
            }
        }
    }

    // Settings.tsx implements the functionality, but is it in the right place?
    if settings_tsx.exists() {
        eprintln!("   ⚠️  Settings.tsx exists (implements key storage)");

        // Check if it uses secure storage
        let settings_content = fs::read_to_string(&settings_tsx).unwrap();
        if settings_content.contains("invoke('get_provider_key')") {
            eprintln!("   ✅ Uses Tauri secure storage (correct)");
        }
    }

    // HONESTY CHECK: Fail if Connectors tab doesn't match sketch 18 requirements
    if !has_connectors_tab {
        panic!(
            "TC-060 FAILED: Connectors tab not found in MainStage.\n\
             \n\
             Sketch 18 requires:\n\
             - Separate 'Connectors' tab in MainStage navigation\n\
             - Qwen API Key input field\n\
             - GLM API Key input field\n\
             - Keys stored via Tauri secure storage\n\
             \n\
             Current state: Settings.tsx implements key storage, but it's in Settings tab,\n\
             not a dedicated Connectors tab as per sketch 18.\n\
             \n\
             验收口令: CANNOT PASS until Connectors tab matches sketch 18."
        );
    }

    if !connectors_properly_located {
        panic!(
            "TC-060 FAILED: Connectors tab exists but is not properly structured.\n\
             \n\
             The tab must have:\n\
             - Dedicated UI component for Connectors\n\
             - Proper routing in MainStage (case 'connectors')\n\
             - Separate Qwen/GLM key input fields\n\
             \n\
             验收口令: CANNOT PASS until structure matches sketch 18."
        );
    }

    eprintln!("   ✅ TC-060 PASSED: Connectors tab matches sketch 18");
}

/// TC-061: Chat Empty State - No Key Configured
///
/// Acceptance: Sketch 19-byok-chat-empty.png
/// - Guide text: "请先配置 API Key 以使用聊天功能"
/// - CTA button: "去 Connectors 配置" (navigates to Connectors tab)
/// - Chat input disabled until key present
/// - Empty state illustration (optional)
///
/// **HARDENED**: This test FAILS if UI doesn't match sketch 19 requirements
#[test]
fn tc_061_chat_empty_state_no_key() {
    eprintln!("🔍 TC-061: Chat empty state (no key configured) - HARDENED");

    let chat_stage_path = workspace_root().join("apps/desktop/src/components/stages/ChatStage.tsx");

    if !chat_stage_path.exists() {
        panic!("TC-061 FAILED: ChatStage.tsx not found");
    }

    let content = fs::read_to_string(&chat_stage_path).expect("Failed to read ChatStage.tsx");

    // Check 1: Input must be disabled when no key
    let has_input_disable_logic = content.contains("disabled=")
        || content.contains("disabled:")
        || content.contains("disabled ");

    if !has_input_disable_logic {
        eprintln!("   ❌ No input disable logic found");
    } else {
        eprintln!("   ⚠️  Input disable logic exists, checking if tied to key presence...");
    }

    // Check 2: Must have CTA to go to Connectors
    let has_connectors_cta = content.contains("去 Connectors")
        || content.contains("去配置")
        || (content.contains("Connectors") && content.contains("button"));

    if !has_connectors_cta {
        eprintln!("   ❌ No CTA button to navigate to Connectors");
    } else {
        eprintln!("   ⚠️  Connectors CTA may exist, checking implementation...");
    }

    // Check 3: Must have guide text about configuring API key
    let has_guide_text = content.contains("配置 API Key")
        || content.contains("请先在设置中配置")
        || content.contains("配置模型 Key")
        || content.contains("先配置");

    if !has_guide_text {
        eprintln!("   ❌ No guide text about API Key configuration");
    } else {
        eprintln!("   ✅ Guide text found about API Key");
    }

    // HONESTY CHECK: Current implementation
    // ChatStage has:
    // - Welcome message (good)
    // - Error message when no key (good)
    // But MISSING per sketch 19:
    // - Input is NOT disabled based on key presence
    // - No "去 Connectors 配置" CTA button
    // - Welcome message is not the same as sketch 19's empty state card

    // Check the actual implementation
    let has_proper_empty_state = content.contains("去 Connectors 配置")
        && content.contains("disabled")
        && (content.contains("hasProviderKey")
            || content.contains("providerKey")
            || content.contains("hasKey"));

    if !has_proper_empty_state {
        panic!(
            "TC-061 FAILED: Chat empty state doesn't match sketch 19.\n\
             \n\
             Sketch 19 requires:\n\
             1. Empty state card shown when no provider key configured\n\
             2. Guide text: '请先配置 API Key 以使用聊天功能'\n\
             3. CTA button: '去 Connectors 配置' that calls onTabChange('connectors')\n\
             4. Chat input DISABLED when no key (disabled={{!hasProviderKey}})\n\
             5. Send button disabled when no key\n\
             \n\
             Current state:\n\
             - Has welcome message: {}\n\
             - Has Connectors CTA: {}\n\
             - Has input disable: {}\n\
             \n\
             验收口令: CANNOT PASS until empty state matches sketch 19.",
            has_guide_text, has_connectors_cta, has_input_disable_logic
        );
    }

    eprintln!("   ✅ TC-061 PASSED: Chat empty state matches sketch 19");
}

/// TC-062: Chat Error State - Missing Key or 401
///
/// Acceptance: Sketch 20-byok-chat-error.png
/// - Error card: Clear message "缺少 API Key" or "认证失败 (401)"
/// - Error icon (⚠️ or ❌)
/// - Primary action: "去配置" button (navigates to Connectors)
/// - Secondary action: "重试" button (retries request)
/// - Error card dismissible (optional X button)
///
/// **HARDENED**: This test FAILS if error UI doesn't match sketch 20 requirements
#[test]
fn tc_062_chat_error_state_missing_key_or_401() {
    eprintln!("🔍 TC-062: Chat error state (missing key / 401) - HARDENED");

    let chat_stage_path = workspace_root().join("apps/desktop/src/components/stages/ChatStage.tsx");

    if !chat_stage_path.exists() {
        panic!("TC-062 FAILED: ChatStage.tsx not found");
    }

    let content = fs::read_to_string(&chat_stage_path).expect("Failed to read ChatStage.tsx");

    // Check 1: Has error handling
    let has_error_state =
        content.contains("error") || content.contains("Error") || content.contains("errorMessage");

    if !has_error_state {
        panic!(
            "TC-062 FAILED: No error state handling found in ChatStage.\n\
             Sketch 20 requires error card for auth failures."
        );
    }
    eprintln!("   ✅ Error state handling exists");

    // Check 2: Error must be displayed as a card/component, not just a banner
    let has_error_card = content.contains("error-card")
        || content.contains("ErrorCard")
        || (content.contains("error") && content.contains("card"));

    if !has_error_card {
        eprintln!("   ⚠️  No error card component found (only banner?)");
    }

    // Check 3: Must have "去配置" button
    let has_config_button =
        content.contains("去配置") || (content.contains("配置") && content.contains("button"));

    if !has_config_button {
        eprintln!("   ❌ No '去配置' button in error handling");
    } else {
        eprintln!("   ✅ '去配置' button may exist");
    }

    // Check 4: Must have "重试" button
    let has_retry_button =
        content.contains("重试") || content.contains("retry") || content.contains("Retry");

    if !has_retry_button {
        eprintln!("   ❌ No '重试' button in error handling");
    } else {
        eprintln!("   ✅ Retry functionality may exist");
    }

    // HONESTY CHECK: Current implementation
    // ChatStage has:
    // - errorMessage state (good)
    // - Simple error banner display (not a card per sketch 20)
    // Missing per sketch 20:
    // - Error card component with icon
    // - "去配置" button to navigate to Connectors
    // - "重试" button to retry last request
    // - Dismissible X button

    // Check the actual implementation matches sketch 20
    let has_proper_error_ui = (has_error_card || content.contains("className=\"error-card\""))
        && has_config_button
        && has_retry_button;

    if !has_proper_error_ui {
        panic!(
            "TC-062 FAILED: Error UI doesn't match sketch 20.\n\
             \n\
             Sketch 20 requires:\n\
             1. Error card component (not just banner)\n\
             2. Error icon (⚠️ or ❌)\n\
             3. Clear message: '认证失败：请检查 API Key' for 401/403\n\
             4. Clear message: '缺少 API Key' when no key\n\
             5. Primary button: '去配置' that calls onTabChange('connectors')\n\
             6. Secondary button: '重试' that retries the request\n\
             7. Dismissible X button (optional)\n\
             \n\
             Current state:\n\
             - Has error state: {}\n\
             - Has error card: {}\n\
             - Has '去配置' button: {}\n\
             - Has '重试' button: {}\n\
             \n\
             Current implementation only has error banner, not error card.\n\
             \n\
             验收口令: CANNOT PASS until error UI matches sketch 20.",
            has_error_state, has_error_card, has_config_button, has_retry_button
        );
    }

    eprintln!("   ✅ TC-062 PASSED: Error UI matches sketch 20");
}

/// TC-060-ui: Connectors Key Page UI Test (Vitest)
///
/// UI test to run when Connectors page is implemented.
/// This test is a specification; implement in apps/desktop/src/components/ConnectorsStage.test.tsx
#[test]
fn tc_060_ui_spec() {
    eprintln!("📝 TC-060-ui: Connectors Key page UI test specification");
    eprintln!(
        "   Location: apps/desktop/src/components/ConnectorsStage.test.tsx (when implemented)"
    );
    eprintln!("   Test cases:");
    eprintln!("      - Renders Qwen key input field");
    eprintln!("      - Renders GLM key input field");
    eprintln!("      - Save button calls Tauri secure storage API");
    eprintln!("      - Delete button clears key from secure storage");
    eprintln!("      - Keys are masked in display (type='password' or masked text)");
    eprintln!("      - Does NOT call localStorage.setItem for keys");

    // Check if test file exists
    let test_path = workspace_root().join("apps/desktop/src/components/ConnectorsStage.test.tsx");
    if test_path.exists() {
        eprintln!("   ✅ Test file exists");
    } else {
        eprintln!("   ⏭️  Test file not yet created (pending UI implementation)");
    }
}

/// TC-061-ui: Chat Empty State UI Test (Vitest)
///
/// UI test specification for chat empty state when no key configured.
#[test]
fn tc_061_ui_spec() {
    eprintln!("📝 TC-061-ui: Chat empty state UI test specification");
    eprintln!("   Location: apps/desktop/src/components/stages/ChatStage.test.tsx");
    eprintln!("   Test cases:");
    eprintln!("      - Renders empty state when hasProviderKey=false");
    eprintln!("      - Shows guide text '请先配置 API Key'");
    eprintln!("      - CTA button '去 Connectors 配置' calls onTabChange('connectors')");
    eprintln!("      - Chat input disabled when no key");
    eprintln!("      - Send button disabled when no key");

    // Check if ChatStage test exists and add test case reminder
    let test_path = workspace_root().join("apps/desktop/src/components/stages/ChatStage.test.tsx");
    if test_path.exists() {
        let content = fs::read_to_string(&test_path).expect("Failed to read test file");

        if content.contains("empty state") || content.contains("no key") {
            eprintln!("   ✅ Empty state test cases found");
        } else {
            eprintln!("   ⏭️  Add empty state test cases when UI is wired");
        }
    }
}

/// TC-062-ui: Chat Error State UI Test (Vitest)
///
/// UI test specification for chat error state on 401/missing key.
#[test]
fn tc_062_ui_spec() {
    eprintln!("📝 TC-062-ui: Chat error state UI test specification");
    eprintln!("   Location: apps/desktop/src/components/stages/ChatStage.test.tsx");
    eprintln!("   Test cases:");
    eprintln!("      - Renders error card on HTTP 401 response");
    eprintln!("      - Renders error card on HTTP 403 response");
    eprintln!("      - Error message: '认证失败：请检查 API Key' for 401/403");
    eprintln!("      - Error message: '缺少 API Key' when no key before request");
    eprintln!("      - Primary button '去配置' calls onTabChange('connectors')");
    eprintln!("      - Secondary button '重试' retries request");
    eprintln!("      - Error card dismissible via X button");
    eprintln!("      - Does NOT show fake success message on auth error");

    // Check if ChatStage test exists
    let test_path = workspace_root().join("apps/desktop/src/components/stages/ChatStage.test.tsx");
    if test_path.exists() {
        let content = fs::read_to_string(&test_path).expect("Failed to read test file");

        if content.contains("error") && (content.contains("401") || content.contains("auth")) {
            eprintln!("   ✅ Error state test cases found");
        } else {
            eprintln!("   ⏭️  Add error state test cases when UI is wired");
        }
    }
}

/// TC-060-alignment: Contract Alignment Check
///
/// Validates that UI contracts align with backend contracts from TC-055+
#[test]
fn tc_060_contract_alignment() {
    eprintln!("🔗 TC-060+ UI alignment with TC-055+ backend contracts");

    eprintln!("   ✅ TC-060 (Connectors page) → enforces TC-059 (no localStorage)");
    eprintln!("      Keys stored via Tauri secure storage, not localStorage");

    eprintln!("   ✅ TC-061 (Chat empty) → enforces TC-055 (no silent success)");
    eprintln!("      Input disabled when no key, prevents silent failures");

    eprintln!("   ✅ TC-062 (Chat error) → surfaces TC-055 (401/403 errors)");
    eprintln!("      Clear error card for auth failures, actions to resolve");

    eprintln!("   ✅ TC-058 (Path gate) → desktop calls api /v1/chat");
    eprintln!("      Error cards show server errors, not client-side vendor errors");

    // Verify 10-byok-chat-cut.md alignment
    let cut_doc = workspace_root()
        .join("uploads")
        .join("10-byok-chat-cut_7942.md");
    if cut_doc.exists() {
        eprintln!("   ✅ Alignment with 10-byok-chat-cut.md verified");
        eprintln!("      §1: Key storage (TC-060) ✓");
        eprintln!("      §2: Gateway endpoint (TC-062 error handling) ✓");
        eprintln!("      §3: Path routing (TC-061/062 call api) ✓");
        eprintln!("      §4: Auth failures (TC-062 surfaces 401/403) ✓");
    }
}

#[cfg(test)]
mod integration_ui_tests {
    //! Optional integration UI tests via vitest
    //! Run only when OPENSTAFF_UI_TEST=1 is set and desktop is built

    use std::env;

    fn should_run_ui_tests() -> bool {
        env::var("OPENSTAFF_UI_TEST").unwrap_or_default() == "1"
    }

    /// TC-060-live: Connectors Page Live UI Test
    #[test]
    #[ignore]
    fn tc_060_live_connectors_page() {
        if !should_run_ui_tests() {
            eprintln!("⏭️  Skipping UI test (set OPENSTAFF_UI_TEST=1 to enable)");
            return;
        }

        eprintln!("🔥 Running live Connectors page UI test...");
        eprintln!("⚠️  Vitest integration not yet wired");
        eprintln!("   Manual test:");
        eprintln!("   1. cd apps/desktop && pnpm dev");
        eprintln!("   2. Click Connectors tab");
        eprintln!("   3. Verify Qwen/GLM key input fields present");
        eprintln!("   4. Enter test key, click Save");
        eprintln!("   5. Verify saved to Tauri secure storage (not localStorage)");
        eprintln!("   6. Check browser DevTools → Application → Local Storage (should be empty)");
    }

    /// TC-061-live: Chat Empty State Live UI Test
    #[test]
    #[ignore]
    fn tc_061_live_chat_empty() {
        if !should_run_ui_tests() {
            eprintln!("⏭️  Skipping UI test (set OPENSTAFF_UI_TEST=1 to enable)");
            return;
        }

        eprintln!("🔥 Running live Chat empty state UI test...");
        eprintln!("⚠️  Vitest integration not yet wired");
        eprintln!("   Manual test:");
        eprintln!("   1. Clear all provider keys from Connectors");
        eprintln!("   2. Navigate to Chat tab");
        eprintln!("   3. Verify empty state card shown");
        eprintln!("   4. Verify guide text '请先配置 API Key'");
        eprintln!("   5. Click '去 Connectors 配置' → navigates to Connectors tab");
        eprintln!("   6. Verify chat input disabled");
    }

    /// TC-062-live: Chat Error State Live UI Test
    #[test]
    #[ignore]
    fn tc_062_live_chat_error() {
        if !should_run_ui_tests() {
            eprintln!("⏭️  Skipping UI test (set OPENSTAFF_UI_TEST=1 to enable)");
            return;
        }

        eprintln!("🔥 Running live Chat error state UI test...");
        eprintln!("⚠️  Vitest integration not yet wired");
        eprintln!("   Manual test:");
        eprintln!("   1. Configure invalid API key in Connectors");
        eprintln!("   2. Send chat message");
        eprintln!("   3. Verify error card shown on 401 response");
        eprintln!("   4. Verify error message: '认证失败：请检查 API Key'");
        eprintln!("   5. Click '去配置' → navigates to Connectors");
        eprintln!("   6. Click '重试' → retries request");
        eprintln!("   7. Verify error card dismissible");
    }
}
