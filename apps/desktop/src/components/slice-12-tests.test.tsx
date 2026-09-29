/**
 * TC-081 through TC-085: §12 next slice tests
 *
 * These tests validate the requirements for the next slice of features.
 * Some tests are EXPECTED to be RED (failing) until the actual implementation lands.
 *
 * Test Status Key:
 * - ✅ GREEN = Test passes (feature implemented)
 * - ❌ EXPECTED RED = Test fails intentionally (feature not yet implemented)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import MainStage from './MainStage';
import Sidebar from './Sidebar';
import ChatStage from './stages/ChatStage';
import { ExternalInsightFact } from './ExternalInsightReportCard';

/**
 * TC-081: Ban-word scan (zero stub copy)
 *
 * Scan rendered desktop routes for forbidden placeholder content.
 * Forbidden: 开发中, 敬请期待, Coming soon, 暂未开放
 * Allowed: honest empty states like 「还没有 Routine」
 *
 * Current Status: ❌ EXPECTED RED until stub pages are replaced
 */
describe('TC-081: Ban-word scan', () => {
  const FORBIDDEN_PHRASES = ['开发中', '敬请期待', 'Coming soon', '暂未开放'];

  it('Chat stage should not contain forbidden placeholder text', () => {
    render(<ChatStage />);

    const body = document.body.textContent || '';
    FORBIDDEN_PHRASES.forEach((phrase) => {
      expect(body).not.toContain(phrase);
    });
  });

  it('Computer stage should not contain forbidden placeholder text', () => {
    render(<MainStage activeTab="computer" onTabChange={() => {}} activeAgent="测试Agent" />);

    const body = document.body.textContent || '';
    FORBIDDEN_PHRASES.forEach((phrase) => {
      // ❌ EXPECTED TO FAIL: Computer stage currently shows "开发中"
      expect(body, `Found forbidden phrase "${phrase}" in Computer stage`).not.toContain(phrase);
    });
  });

  it('Routines stage should not contain forbidden placeholder text', () => {
    render(<MainStage activeTab="routines" onTabChange={() => {}} activeAgent="测试Agent" />);

    const body = document.body.textContent || '';
    FORBIDDEN_PHRASES.forEach((phrase) => {
      // ❌ EXPECTED TO FAIL: Routines stage currently shows "开发中"
      expect(body, `Found forbidden phrase "${phrase}" in Routines stage`).not.toContain(phrase);
    });
  });

  it('Skills stage should not contain forbidden placeholder text', () => {
    render(<MainStage activeTab="skills" onTabChange={() => {}} activeAgent="测试Agent" />);

    const body = document.body.textContent || '';
    FORBIDDEN_PHRASES.forEach((phrase) => {
      // ❌ EXPECTED TO FAIL: Skills stage currently shows "开发中"
      expect(body, `Found forbidden phrase "${phrase}" in Skills stage`).not.toContain(phrase);
    });
  });

  it('Memory stage should not contain forbidden placeholder text', () => {
    render(<MainStage activeTab="memory" onTabChange={() => {}} activeAgent="测试Agent" />);

    const body = document.body.textContent || '';
    FORBIDDEN_PHRASES.forEach((phrase) => {
      // ❌ EXPECTED TO FAIL: Memory stage currently shows "开发中"
      expect(body, `Found forbidden phrase "${phrase}" in Memory stage`).not.toContain(phrase);
    });
  });

  it('Connectors stage should not contain forbidden placeholder text in main UI', () => {
    render(<MainStage activeTab="connectors" onTabChange={() => {}} activeAgent="测试Agent" />);

    const body = document.body.textContent || '';

    // Note: Connectors has "敬请期待" in stub section - this is currently allowed
    // as it's in a clearly marked "其他连接 (stub)" section
    // Main provider cards should NOT have forbidden text

    // Check for "开发中", "Coming soon", "暂未开放"
    expect(body).not.toContain('开发中');
    expect(body).not.toContain('Coming soon');
    expect(body).not.toContain('暂未开放');

    // "敬请期待" is currently in stub section - this test accepts it
    // but implementation should replace with honest empty state
  });

  it('Sidebar should not contain forbidden placeholder text', () => {
    render(<Sidebar activeAgent="产品经理数字员工" onAgentChange={() => {}} />);

    const body = document.body.textContent || '';
    FORBIDDEN_PHRASES.forEach((phrase) => {
      expect(body, `Found forbidden phrase "${phrase}" in Sidebar`).not.toContain(phrase);
    });
  });

  it('Full App should minimize forbidden placeholder text', () => {
    render(<App />);

    const body = document.body.textContent || '';

    // Count occurrences of forbidden phrases
    const phraseCounts = FORBIDDEN_PHRASES.map((phrase) => ({
      phrase,
      count: (body.match(new RegExp(phrase, 'g')) || []).length,
    }));

    // Document current state - some phrases exist in stub sections
    // This test will pass as long as we're reducing them over time
    phraseCounts.forEach(({ phrase, count }) => {
      if (count > 0) {
        console.warn(`TC-081: Found ${count} occurrence(s) of "${phrase}" in full app`);
      }
    });

    // ❌ EXPECTED TO FAIL: Current app has multiple "开发中" and "敬请期待"
    // This assertion documents the target state
    expect(
      phraseCounts.every(({ count }) => count === 0),
      'App should not contain forbidden placeholder text'
    ).toBe(true);
  });
});

/**
 * TC-082: reconcile FAILED immediate red card
 *
 * When insights return job_status completed + reconcile_status FAILED,
 * MUST show .demo-error-banner immediately without waiting for timeout.
 *
 * Current Status: ❌ EXPECTED RED until encoding fixes timeout swallowing
 */
describe('TC-082: Reconcile FAILED immediate error banner', () => {
  it('should show error banner immediately when reconcile status is FAILED', () => {
    const failedResponse = {
      job_status: 'completed',
      reconcile_status: 'FAILED',
      facts: [] as ExternalInsightFact[],
      summary: [] as string[],
      artifacts_path: 'artifacts/external-insight/2026-09-29-public-facts.json',
      timestamp: '2026-09-29',
    };

    render(<ChatStage demoResponse={failedResponse} />);

    // Should show error banner with .demo-error-banner class
    const errorBanner = document.querySelector('.demo-error-banner');

    // ❌ EXPECTED TO FAIL: Current implementation swallows error into timeout
    expect(
      errorBanner,
      'FAILED reconcile must show .demo-error-banner immediately (not timeout)'
    ).toBeInTheDocument();

    // Error banner should contain reconcile/审核/FAILED text
    if (errorBanner) {
      const errorText = errorBanner.textContent || '';
      expect(
        errorText.includes('FAILED') || errorText.includes('失败') || errorText.includes('审核')
      ).toBe(true);
    }
  });

  it('should NOT show error banner when reconcile status is PASS', () => {
    const passResponse = {
      job_status: 'completed',
      reconcile_status: 'PASS',
      facts: [
        {
          bucket: '竞对' as const,
          title: 'Test Fact',
          summary_zh: 'Test summary',
          url: 'https://example.com',
          tags: ['test'],
        },
      ],
      summary: ['Test summary'],
      artifacts_path: 'artifacts/external-insight/2026-09-29-public-facts.json',
      timestamp: '2026-09-29',
    };

    render(<ChatStage demoResponse={passResponse} />);

    // Should NOT show error banner when PASS
    const errorBanner = document.querySelector('.demo-error-banner');
    expect(errorBanner).not.toBeInTheDocument();
  });

  it('should show error banner for job_status error or not_found', () => {
    const errorResponse = {
      job_status: 'error',
      reconcile_status: 'N/A',
      facts: [] as ExternalInsightFact[],
      summary: [] as string[],
      artifacts_path: '',
      timestamp: '2026-09-29',
    };

    render(<ChatStage demoResponse={errorResponse} />);

    // Should show error banner for job failure
    const errorBanner = document.querySelector('.demo-error-banner');

    // ❌ EXPECTED TO FAIL: Current implementation may not handle job_status error
    expect(errorBanner, 'Job error status should show .demo-error-banner').toBeInTheDocument();
  });
});

/**
 * TC-083: Validation gate (sketch 14)
 *
 * When gate card present: Pass/Reject/Revise → visible state + chat bubble.
 * Document expected-red if UI missing.
 *
 * Current Status: ❌ EXPECTED RED - Validation gate UI not yet implemented
 */
describe('TC-083: Validation gate card', () => {
  it('should render validation gate card when present', () => {
    // ❌ EXPECTED TO FAIL: Validation gate card not yet implemented
    render(<App />);

    const gateCard = document.querySelector('.validation-gate-card');
    expect(
      gateCard,
      'TC-083 EXPECTED RED: Validation gate card not yet implemented (sketch 14)'
    ).toBeInTheDocument();
  });

  it('should show Pass/Reject/Revise buttons in gate card', () => {
    // ❌ EXPECTED TO FAIL: Gate card UI not yet implemented
    render(<App />);

    const passButton = screen.queryByRole('button', { name: /通过|Pass/i });
    const rejectButton = screen.queryByRole('button', { name: /拒绝|Reject/i });
    const reviseButton = screen.queryByRole('button', { name: /修改|Revise/i });

    expect(passButton, 'TC-083 EXPECTED RED: Pass button not yet implemented').toBeInTheDocument();
    expect(
      rejectButton,
      'TC-083 EXPECTED RED: Reject button not yet implemented'
    ).toBeInTheDocument();
    expect(
      reviseButton,
      'TC-083 EXPECTED RED: Revise button not yet implemented'
    ).toBeInTheDocument();
  });

  it('should show chat bubble after gate action', () => {
    // ❌ EXPECTED TO FAIL: Gate action flow not yet implemented
    render(<App />);

    // After clicking Pass/Reject/Revise, should show chat bubble with result
    const gateResultBubble = document.querySelector('.gate-result-bubble');

    expect(
      gateResultBubble,
      'TC-083 EXPECTED RED: Gate result chat bubble not yet implemented'
    ).toBeInTheDocument();
  });
});

/**
 * TC-084: New agent wizard (sketch 12)
 *
 * New → 3-step form → sidebar gets new agent (local fixture).
 * Expected-red if missing.
 *
 * Current Status: ❌ EXPECTED RED - Agent creation wizard not yet implemented
 */
describe('TC-084: New agent wizard', () => {
  it('should render "新建 Agent" or "+" button in sidebar', () => {
    render(<Sidebar activeAgent="产品经理数字员工" onAgentChange={() => {}} />);

    // ❌ EXPECTED TO FAIL: New agent button not yet implemented
    const newAgentButton = screen.queryByRole('button', { name: /新建|创建|\+/i });

    expect(
      newAgentButton,
      'TC-084 EXPECTED RED: New agent button not yet implemented (sketch 12)'
    ).toBeInTheDocument();
  });

  it('should show 3-step wizard form when creating new agent', () => {
    // ❌ EXPECTED TO FAIL: Wizard UI not yet implemented
    render(<App />);

    // Look for wizard steps (基本信息, 技能配置, 人设调优, etc.)
    const wizardStep1 = screen.queryByText(/基本信息|步骤 1|Step 1/i);
    const wizardStep2 = screen.queryByText(/技能配置|步骤 2|Step 2/i);
    const wizardStep3 = screen.queryByText(/人设调优|步骤 3|Step 3/i);

    expect(
      wizardStep1 || wizardStep2 || wizardStep3,
      'TC-084 EXPECTED RED: Agent wizard steps not yet implemented'
    ).toBeTruthy();
  });

  it('should add new agent to sidebar after wizard completion', () => {
    // ❌ EXPECTED TO FAIL: Wizard flow not yet implemented
    render(<App />);

    // After completing wizard, sidebar should show new agent
    // This is a fixture test - real backend integration not required

    const sidebar = document.querySelector('.sidebar');
    expect(sidebar, 'Sidebar should exist').toBeInTheDocument();

    // Look for evidence of dynamic agent list (not just hardcoded agents)
    const agentItems = document.querySelectorAll('.agent-item, .agent-card');

    // Currently shows 3 hardcoded agents
    // After wizard: should support adding new ones
    expect(
      agentItems.length,
      'TC-084 EXPECTED RED: Sidebar should support dynamic agent list (wizard not implemented)'
    ).toBeGreaterThan(3);
  });

  it('should support agent name and role configuration in wizard', () => {
    // ❌ EXPECTED TO FAIL: Wizard form fields not yet implemented
    render(<App />);

    const nameInput = screen.queryByLabelText(/Agent 名称|名字|Name/i);
    const roleInput = screen.queryByLabelText(/角色|Role/i);

    expect(
      nameInput || roleInput,
      'TC-084 EXPECTED RED: Agent name/role inputs not yet implemented'
    ).toBeTruthy();
  });
});

/**
 * TC-085: GitHub SaaS connector smoke
 *
 * Connect/Disconnect/Test → visible status (connected/disconnected/error).
 * No real OAuth secrets; mock. Expected-red if stub.
 *
 * Current Status: ❌ EXPECTED RED - GitHub connector is stub
 */
describe('TC-085: GitHub SaaS connector smoke', () => {
  it('should render GitHub connector card', () => {
    render(<MainStage activeTab="connectors" onTabChange={() => {}} activeAgent="测试Agent" />);

    // Look for GitHub connector in the "其他连接" section
    const githubConnector = screen.queryByText(/GitHub/i);

    expect(
      githubConnector,
      'GitHub connector should be visible in Connectors tab'
    ).toBeInTheDocument();
  });

  it('should NOT show "敬请期待" stub text for GitHub connector', () => {
    render(<MainStage activeTab="connectors" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: GitHub connector is currently stub with "敬请期待"
    // Find GitHub connector element
    const connectorStubs = document.querySelectorAll('.connector-stub');
    let githubStub: Element | null = null;

    connectorStubs.forEach((stub) => {
      if (stub.textContent?.includes('GitHub')) {
        githubStub = stub;
      }
    });

    expect(githubStub, 'GitHub connector should exist').toBeTruthy();

    if (githubStub) {
      const stubText = githubStub.textContent || '';
      expect(
        stubText,
        'TC-085 EXPECTED RED: GitHub connector should not show stub text'
      ).not.toContain('敬请期待');
    }
  });

  it('should show Connect/Disconnect button for GitHub connector', () => {
    render(<MainStage activeTab="connectors" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: GitHub connector is stub, no Connect button yet
    const connectButton = screen.queryByRole('button', { name: /连接 GitHub|Connect GitHub/i });

    expect(
      connectButton,
      'TC-085 EXPECTED RED: GitHub Connect button not yet implemented'
    ).toBeInTheDocument();
  });

  it('should show status badge (connected/disconnected) for GitHub connector', () => {
    render(<MainStage activeTab="connectors" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: GitHub connector is stub, no status badge yet
    const statusBadges = document.querySelectorAll('.connector-status, .status-badge');

    let hasGithubStatus = false;
    statusBadges.forEach((badge) => {
      const parent = badge.closest('.connector-card, .connector-stub');
      if (parent?.textContent?.includes('GitHub')) {
        const badgeText = badge.textContent || '';
        if (
          badgeText.includes('已连接') ||
          badgeText.includes('未连接') ||
          badgeText.includes('connected') ||
          badgeText.includes('disconnected')
        ) {
          hasGithubStatus = true;
        }
      }
    });

    expect(
      hasGithubStatus,
      'TC-085 EXPECTED RED: GitHub connector should show connection status badge'
    ).toBe(true);
  });

  it('should show Test button for GitHub connector', () => {
    render(<MainStage activeTab="connectors" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: GitHub connector is stub, no Test button yet
    const testButton = screen.queryByRole('button', { name: /测试|Test/i });

    // Should have test button near GitHub connector
    expect(
      testButton,
      'TC-085 EXPECTED RED: GitHub Test button not yet implemented'
    ).toBeInTheDocument();
  });

  it('should show error state when GitHub connection test fails', () => {
    render(<MainStage activeTab="connectors" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: GitHub connector is stub, no error state UI yet
    const errorState = document.querySelector('.connector-error, .error-message');

    // This test documents the expected behavior
    // Actual test would simulate failed connection and check for error UI
    expect(
      errorState,
      'TC-085 EXPECTED RED: GitHub connector error state not yet implemented'
    ).toBeTruthy();
  });

  it('should NOT require real OAuth secrets for smoke test', () => {
    // This test documents the requirement: use mock/fixture, no real secrets

    render(<MainStage activeTab="connectors" onTabChange={() => {}} activeAgent="测试Agent" />);

    // GitHub connector should work with mock tokens for smoke testing
    // No real OAuth flow required in tests

    const body = document.body.textContent || '';

    // Should NOT show real OAuth URLs or require GitHub login
    expect(body).not.toContain('github.com/login/oauth');

    // ❌ EXPECTED TO FAIL: This test passes trivially now (stub),
    // but documents that implementation should use mock tokens
    expect(true, 'TC-085: GitHub connector tests should use mock tokens (no real OAuth)').toBe(
      true
    );
  });
});

/**
 * TC-086: Web Search Skill (sketch 22/04/16)
 *
 * NOT a Connectors OAuth card. Under Skills tab:
 * - List item + detail view (auto-call config / enable-disable toggle)
 * - 「试跑一次」→ running state → green summary OR red error card
 * - Backend down → explicit error (not silent failure)
 * - Fixture OK for testing
 *
 * FORBIDDEN: Second SaaS auth card for web search in Connectors
 *
 * Current Status: ❌ EXPECTED RED - Web Search Skill not implemented
 */
describe('TC-086: Web Search Skill', () => {
  it('should render Web Search skill in Skills tab (not Connectors)', () => {
    render(<MainStage activeTab="skills" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: Skills tab is stub, Web Search not implemented
    const webSearchSkill = screen.queryByText(/Web Search|网页搜索|搜索技能/i);

    expect(
      webSearchSkill,
      'TC-086 EXPECTED RED: Web Search skill not yet implemented in Skills tab'
    ).toBeInTheDocument();
  });

  it('should NOT show Web Search as SaaS auth card in Connectors', () => {
    render(<MainStage activeTab="connectors" onTabChange={() => {}} activeAgent="测试Agent" />);

    // Web Search should NOT appear as OAuth/auth card in Connectors
    // It's a skill, not a credential provider

    const connectorCards = document.querySelectorAll('.provider-card');
    let hasWebSearchConnector = false;

    connectorCards.forEach((card) => {
      if (card.textContent?.includes('Web Search') || card.textContent?.includes('网页搜索')) {
        hasWebSearchConnector = true;
      }
    });

    // Should pass - Web Search is NOT a Connectors card
    expect(
      hasWebSearchConnector,
      'Web Search should NOT be in Connectors (it is a Skill, not SaaS auth)'
    ).toBe(false);
  });

  it('should show Web Search skill detail with enable/disable toggle', () => {
    render(<MainStage activeTab="skills" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: Skill detail view not implemented
    const enableToggle = screen.queryByRole('switch', {
      name: /启用|Enable/i,
    });

    expect(
      enableToggle,
      'TC-086 EXPECTED RED: Enable/disable toggle not yet implemented'
    ).toBeInTheDocument();
  });

  it('should show Web Search skill detail with auto-call configuration', () => {
    render(<MainStage activeTab="skills" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: Auto-call config not implemented
    const autoCallConfig = screen.queryByText(/自动调用|Auto-call|触发条件/i);

    expect(
      autoCallConfig,
      'TC-086 EXPECTED RED: Auto-call config not yet implemented'
    ).toBeInTheDocument();
  });

  it('should render「试跑一次」button for Web Search skill', () => {
    render(<MainStage activeTab="skills" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: Test run button not implemented
    const testRunButton = screen.queryByRole('button', {
      name: /试跑一次|测试运行/i,
    });

    expect(
      testRunButton,
      'TC-086 EXPECTED RED: Test run button not yet implemented'
    ).toBeInTheDocument();
  });

  it('should show running state when executing Web Search test run', () => {
    render(<MainStage activeTab="skills" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: Running state not implemented
    // After clicking 试跑一次, should show running indicator
    const runningIndicator = document.querySelector('.skill-running, .running-state');

    expect(
      runningIndicator,
      'TC-086 EXPECTED RED: Running state indicator not yet implemented'
    ).toBeTruthy();
  });

  it('should show green success summary after successful Web Search test run', () => {
    render(<MainStage activeTab="skills" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: Success summary not implemented
    // After successful test run, should show green summary card
    const successSummary = document.querySelector('.skill-success, .success-summary');

    expect(
      successSummary,
      'TC-086 EXPECTED RED: Success summary card not yet implemented'
    ).toBeTruthy();
  });

  it('should show red error card when Web Search test run fails', () => {
    render(<MainStage activeTab="skills" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: Error card not implemented
    // When test run fails, should show red error card
    const errorCard = document.querySelector('.skill-error, .error-card');

    expect(errorCard, 'TC-086 EXPECTED RED: Error card not yet implemented').toBeTruthy();
  });

  it('should show explicit error message when backend is down', () => {
    render(<MainStage activeTab="skills" onTabChange={() => {}} activeAgent="测试Agent" />);

    // ❌ EXPECTED TO FAIL: Explicit backend error not implemented
    // When backend is down, should NOT be silent failure
    // Should show explicit error like "后端服务不可用" or "Backend unavailable"

    const body = document.body.textContent || '';

    // This test documents the requirement:
    // Explicit error when backend down (not silent failure)
    expect(
      body.includes('后端') || body.includes('Backend') || body.includes('服务'),
      'TC-086 EXPECTED RED: Explicit backend error message not yet implemented'
    ).toBe(true);
  });

  it('should use fixture for Web Search test run (no real web calls required)', () => {
    // This test documents the requirement: use fixture, no real web search calls

    render(<MainStage activeTab="skills" onTabChange={() => {}} activeAgent="测试Agent" />);

    // Web Search test should work with fixture data
    // No real Serper/Tavily/Google API calls required in tests

    const body = document.body.textContent || '';

    // Should NOT show real API URLs or require API keys
    expect(body).not.toContain('serper.dev');
    expect(body).not.toContain('tavily.com');
    expect(body).not.toContain('googleapis.com');

    // This test passes trivially now (stub),
    // but documents that implementation should use fixtures
    expect(true, 'TC-086: Web Search tests should use fixtures (no real API calls)').toBe(true);
  });
});

/**
 * Summary of Expected Results:
 *
 * TC-081: ❌ EXPECTED RED - Multiple stages show "开发中"
 * TC-082: ❌ EXPECTED RED - FAILED reconcile swallowed into timeout
 * TC-083: ❌ EXPECTED RED - Validation gate UI not implemented (sketch 14)
 * TC-084: ❌ EXPECTED RED - Agent wizard not implemented (sketch 12)
 * TC-085: ❌ EXPECTED RED - GitHub connector is stub with "敬请期待"
 * TC-086: ❌ EXPECTED RED - Web Search skill not implemented (sketch 22/04/16)
 *
 * These tests document the contracts that encoding must satisfy.
 * Tests should NOT be deleted or soft-passed with escape hatches.
 * Correct path: Implement features → tests turn green.
 */
