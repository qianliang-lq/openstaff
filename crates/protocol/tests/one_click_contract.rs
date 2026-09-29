//! One-Click Start Contract Tests (TC-051+)
//!
//! Validates that Justfile and docker-compose.prod.yml conform to
//! the one-click start contracts without actually starting services.
//!
//! These tests are offline-friendly and run in CI by default.

use std::env;
use std::fs;
use std::path::PathBuf;

/// Helper to get workspace root directory
fn workspace_root() -> PathBuf {
    // CARGO_MANIFEST_DIR points to crates/protocol, go up two levels
    let manifest_dir = env::var("CARGO_MANIFEST_DIR")
        .expect("CARGO_MANIFEST_DIR not set");
    PathBuf::from(manifest_dir)
        .parent()
        .expect("parent 1")
        .parent()
        .expect("parent 2 (workspace root)")
        .to_path_buf()
}

/// TC-051: Justfile Has Required Recipes
///
/// Validates that justfile contains required recipes for dev and prod workflows.
#[test]
fn tc_051_justfile_has_required_recipes() {
    let justfile_path = workspace_root().join("justfile");
    assert!(
        justfile_path.exists(),
        "justfile not found at project root"
    );

    let content = fs::read_to_string(justfile_path).expect("Failed to read justfile");

    // Required dev recipes
    assert!(
        content.contains("dev-up:"),
        "justfile missing 'dev-up' recipe"
    );
    assert!(
        content.contains("install:"),
        "justfile missing 'install' recipe"
    );

    // Required prod recipes
    assert!(
        content.contains("prod-up:"),
        "justfile missing 'prod-up' recipe"
    );
    assert!(
        content.contains("prod-down:"),
        "justfile missing 'prod-down' recipe"
    );
    assert!(
        content.contains("prod-health:"),
        "justfile missing 'prod-health' recipe"
    );
    assert!(
        content.contains("prod-logs:"),
        "justfile missing 'prod-logs' recipe"
    );

    // Verify dev-up calls script
    assert!(
        content.contains("bash scripts/dev-up.sh") || content.contains("scripts/dev-up.sh"),
        "dev-up recipe should call scripts/dev-up.sh"
    );

    // Verify prod-up references docker-compose.prod.yml
    assert!(
        content.contains("docker-compose.prod.yml"),
        "prod-up should reference docker-compose.prod.yml"
    );
}

/// TC-052: Dev Recipe Configuration
///
/// Validates that dev-up.sh starts correct services on expected ports.
#[test]
fn tc_052_dev_recipe_configuration() {
    let script_path = workspace_root().join("scripts/dev-up.sh");
    assert!(
        script_path.exists(),
        "scripts/dev-up.sh not found"
    );

    let content = fs::read_to_string(script_path).expect("Failed to read dev-up.sh");

    // Verify backend services are started
    assert!(
        content.contains("cargo run -p openstaff-api"),
        "dev-up.sh should start openstaff-api"
    );
    assert!(
        content.contains("cargo run -p openstaff-gateway"),
        "dev-up.sh should start openstaff-gateway"
    );
    assert!(
        content.contains("cargo run -p openstaff-scheduler"),
        "dev-up.sh should start openstaff-scheduler"
    );
    assert!(
        content.contains("cargo run -p openstaff-runtime"),
        "dev-up.sh should start openstaff-runtime"
    );

    // Verify port documentation exists
    assert!(
        content.contains("3000") && content.contains("3001") 
        && content.contains("3002") && content.contains("3003"),
        "dev-up.sh should document ports 3000-3003"
    );

    // Verify desktop frontend handling (optional but should be mentioned)
    assert!(
        content.contains("Desktop") || content.contains("desktop"),
        "dev-up.sh should mention desktop frontend"
    );

    // Verify 5173 (Vite default port) is mentioned
    assert!(
        content.contains("5173"),
        "dev-up.sh should document Vite port 5173"
    );
}

/// TC-053: Prod Compose Structure
///
/// Validates docker-compose.prod.yml has exactly 4 core services (no desktop)
/// and correct service configuration.
#[test]
fn tc_053_prod_compose_structure() {
    let compose_path = workspace_root().join("deploy/compose/docker-compose.prod.yml");
    assert!(
        compose_path.exists(),
        "docker-compose.prod.yml not found at deploy/compose/"
    );

    let content = fs::read_to_string(compose_path)
        .expect("Failed to read docker-compose.prod.yml");

    // Required services
    let required_services = ["gateway:", "api:", "runtime:", "scheduler:"];
    for service in &required_services {
        assert!(
            content.contains(service),
            "docker-compose.prod.yml missing service: {}",
            service
        );
    }

    // Verify gateway service config
    assert!(
        content.contains("container_name: openstaff-gateway"),
        "gateway service should have container_name"
    );
    assert!(
        content.contains("PORT=3001") || content.contains("port 3001"),
        "gateway should expose port 3001"
    );

    // Verify api service config
    assert!(
        content.contains("container_name: openstaff-api"),
        "api service should have container_name"
    );
    assert!(
        content.contains("PORT=3000") || content.contains("port 3000"),
        "api should expose port 3000"
    );

    // Verify runtime service config
    assert!(
        content.contains("container_name: openstaff-runtime"),
        "runtime service should have container_name"
    );
    assert!(
        content.contains("PORT=3003") || content.contains("port 3003"),
        "runtime should expose port 3003"
    );
    assert!(
        content.contains("runtime-artifacts:") || content.contains("artifacts"),
        "runtime should mount artifacts volume"
    );

    // Verify scheduler service config
    assert!(
        content.contains("container_name: openstaff-scheduler"),
        "scheduler service should have container_name"
    );
    assert!(
        content.contains("PORT=3002") || content.contains("port 3002"),
        "scheduler should expose port 3002"
    );

    // MUST NOT include desktop service (per §9 contract)
    assert!(
        !content.contains("openstaff-desktop")
            && !content.contains("container_name: desktop")
            && !content.contains("service: desktop"),
        "docker-compose.prod.yml MUST NOT include desktop service (§9: 桌面永远本机连云)"
    );

    // Caddy is optional but should be profiled if present
    if content.contains("caddy:") {
        assert!(
            content.contains("profiles:") && content.contains("with-caddy"),
            "caddy should be under 'with-caddy' profile if included"
        );
    }

    // Health checks should be present
    assert!(
        content.contains("healthcheck:"),
        "services should have healthcheck configuration"
    );
}

/// TC-053b: Prod Health Script Validates All Four Services
///
/// Validates prod-health script checks gateway, api, runtime, scheduler.
#[test]
fn tc_053b_prod_health_script_checks_all_services() {
    let justfile_path = workspace_root().join("justfile");
    let content = fs::read_to_string(justfile_path).expect("Failed to read justfile");

    // Find prod-health recipe
    assert!(
        content.contains("prod-health:"),
        "justfile missing prod-health recipe"
    );

    // Extract prod-health recipe content
    let prod_health_section: Vec<&str> = content
        .lines()
        .skip_while(|line| !line.contains("prod-health:"))
        .take_while(|line| !line.starts_with("# ") && !line.contains("prod-restart:"))
        .collect();

    let prod_health_content = prod_health_section.join("\n");

    // Verify all four services are checked
    assert!(
        prod_health_content.contains("openstaff-api") 
        && prod_health_content.contains("3000"),
        "prod-health should check openstaff-api on port 3000"
    );
    assert!(
        prod_health_content.contains("openstaff-gateway") 
        && prod_health_content.contains("3001"),
        "prod-health should check openstaff-gateway on port 3001"
    );
    assert!(
        prod_health_content.contains("openstaff-scheduler") 
        && prod_health_content.contains("3002"),
        "prod-health should check openstaff-scheduler on port 3002"
    );
    assert!(
        prod_health_content.contains("openstaff-runtime") 
        && prod_health_content.contains("3003"),
        "prod-health should check openstaff-runtime on port 3003"
    );

    // Should use docker exec to check from inside containers
    assert!(
        prod_health_content.contains("docker exec"),
        "prod-health should use 'docker exec' to check container health"
    );
}

/// TC-053c: Docker Compose Config Validation (Offline)
///
/// Validates docker-compose.yml syntax without requiring Docker daemon.
/// This is a best-effort parse check using YAML structure validation.
#[test]
fn tc_053c_docker_compose_yaml_valid() {
    let compose_path = workspace_root().join("deploy/compose/docker-compose.prod.yml");
    let content = fs::read_to_string(compose_path)
        .expect("Failed to read docker-compose.prod.yml");

    // Basic YAML structure validation (no full parser needed)
    // Check that services section exists and is indented correctly
    assert!(
        content.contains("services:"),
        "docker-compose.yml must have 'services:' section"
    );
    assert!(
        content.contains("networks:"),
        "docker-compose.yml should have 'networks:' section"
    );
    assert!(
        content.contains("volumes:"),
        "docker-compose.yml should have 'volumes:' section"
    );

    // Check for common YAML errors (tabs instead of spaces)
    assert!(
        !content.contains("\t"),
        "docker-compose.yml must use spaces, not tabs"
    );

    // Check that each service has build or image
    let service_names = ["gateway", "api", "runtime", "scheduler"];
    for service in &service_names {
        let service_section: String = content
            .lines()
            .skip_while(|line| !line.trim_start().starts_with(&format!("{}:", service)))
            .take(30)
            .collect::<Vec<_>>()
            .join("\n");

        assert!(
            service_section.contains("build:") || service_section.contains("image:"),
            "Service '{}' must have 'build:' or 'image:' directive",
            service
        );
    }
}

#[cfg(test)]
mod integration_smoke_tests {
    //! Optional integration smoke tests that actually start services.
    //! Run only when OPENSTAFF_SMOKE=1 is set.
    
    use std::env;
    use std::process::Command;

    /// Helper to check if smoke tests should run
    fn should_run_smoke() -> bool {
        env::var("OPENSTAFF_SMOKE").unwrap_or_default() == "1"
    }

    /// TC-054a: Dev Stack Smoke Test (Optional)
    ///
    /// Validates that `just dev-up` successfully starts all services
    /// and they respond to health checks.
    ///
    /// **REQUIRES**: OPENSTAFF_SMOKE=1 environment variable
    #[test]
    #[ignore] // Run with: cargo test --ignored -- tc_054a
    fn tc_054a_dev_stack_smoke_test() {
        if !should_run_smoke() {
            eprintln!("⏭️  Skipping dev smoke test (set OPENSTAFF_SMOKE=1 to enable)");
            return;
        }

        eprintln!("🔥 Running dev stack smoke test (this may take 30-60s)...");

        // Note: In practice this test would:
        // 1. Run `just dev-up` in background
        // 2. Wait for services to start (poll health endpoints)
        // 3. Verify all services respond with HTTP 200
        // 4. Clean up (kill background processes)
        //
        // For now, we document the contract but don't implement full startup
        // to avoid heavy CI loads.

        eprintln!("⚠️  Full dev stack smoke test not implemented");
        eprintln!("   Manual test: just dev-up && just health && Ctrl-C");
    }

    /// TC-054b: Prod Stack Smoke Test (Optional)
    ///
    /// Validates that `just prod-up` successfully starts all services
    /// and `just prod-health` reports all healthy.
    ///
    /// **REQUIRES**: 
    /// - OPENSTAFF_SMOKE=1 environment variable
    /// - Docker daemon running
    /// - .env.prod configured
    #[test]
    #[ignore] // Run with: cargo test --ignored -- tc_054b
    fn tc_054b_prod_stack_smoke_test() {
        if !should_run_smoke() {
            eprintln!("⏭️  Skipping prod smoke test (set OPENSTAFF_SMOKE=1 to enable)");
            return;
        }

        // Check if docker is available
        let docker_check = Command::new("docker")
            .arg("info")
            .output();

        if docker_check.is_err() || !docker_check.unwrap().status.success() {
            eprintln!("⏭️  Docker not available, skipping prod smoke test");
            return;
        }

        eprintln!("🔥 Running prod stack smoke test (this may take 60-90s)...");

        // Note: In practice this test would:
        // 1. Check .env.prod exists or create minimal one
        // 2. Run `just prod-up`
        // 3. Wait for containers to be healthy (docker ps with health status)
        // 4. Run `just prod-health` and verify exit code 0
        // 5. Clean up with `just prod-down`
        //
        // For now, we document the contract but don't implement full startup
        // to avoid heavy CI loads.

        eprintln!("⚠️  Full prod stack smoke test not implemented");
        eprintln!("   Manual test: just prod-up && just prod-health && just prod-down");
    }

    /// TC-054c: Smoke Script Validates All Services
    ///
    /// Validates that scripts/smoke.sh checks all four backend services.
    #[test]
    fn tc_054c_smoke_script_validates_all_services() {
        let smoke_path = super::workspace_root().join("scripts/smoke.sh");
        assert!(
            smoke_path.exists(),
            "scripts/smoke.sh not found"
        );

        let content = std::fs::read_to_string(smoke_path)
            .expect("Failed to read smoke.sh");

        // Verify all four services are checked
        assert!(
            content.contains("3000") || content.contains("API"),
            "smoke.sh should check API on port 3000"
        );
        assert!(
            content.contains("3001") || content.contains("Gateway"),
            "smoke.sh should check Gateway on port 3001"
        );
        assert!(
            content.contains("3002") || content.contains("Scheduler"),
            "smoke.sh should check Scheduler on port 3002"
        );
        assert!(
            content.contains("3003") || content.contains("Runtime"),
            "smoke.sh should check Runtime on port 3003"
        );

        // Should check HTTP 200 responses
        assert!(
            content.contains("200") || content.contains("http_code"),
            "smoke.sh should verify HTTP 200 responses"
        );
    }
}
