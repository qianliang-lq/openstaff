/**
 * Create Agent Wizard Contract Tests (§15 建岗真路径)
 *
 * These tests verify the create agent wizard flow:
 * - Step 1: Select role template (≥4 templates including 产品经理)
 * - Step 2: Set name and duty
 * - Step 3: Prepare sandbox with visible success/failure feedback
 *
 * Brief: /workspace/briefs/openstaff/15-create-agent-path.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import Sidebar from './Sidebar';

// Mock fetch for API calls
const mockFetch = vi.fn();

describe('Create Agent Wizard Contract Tests (§15)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = mockFetch;
    
    // Default: empty agents list from API
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Empty Sidebar (Cold Start)', () => {
    it('should show empty state when API returns no agents', async () => {
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/v1/agents'),
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(screen.getByText('还没有数字员工')).toBeInTheDocument();
      });

      expect(screen.getByText(/点击上方.*创建/)).toBeInTheDocument();

      const emptyState = document.querySelector('.empty-state');
      expect(emptyState, 'Must show empty state from API, not localStorage').toBeInTheDocument();
    });

    it('should NOT have pre-seeded agents in sidebar', async () => {
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const preSeededNames = ['产品经理数字员工', '运营专家', '研发协作'];
      preSeededNames.forEach((name) => {
        expect(
          screen.queryByText(name),
          `Must NOT pre-seed "${name}" - sidebar should start empty from API`
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Wizard Entry', () => {
    it('should open wizard when clicking "+" button in sidebar', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      // Wait for API load to complete
      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton.textContent).toBe('+');

      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('创建数字员工')).toBeInTheDocument();
      });

      const wizardModal = document.querySelector('.wizard-modal');
      expect(wizardModal).toBeInTheDocument();
    });

    it('should NOT show placeholder text in wizard', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('创建数字员工')).toBeInTheDocument();
      });

      const forbiddenPhrases = ['开发中', '敬请期待', 'Coming Soon'];
      forbiddenPhrases.forEach((phrase) => {
        expect(screen.queryByText(new RegExp(phrase, 'i'))).not.toBeInTheDocument();
      });
    });
  });

  describe('Step 1: Role Template Selection', () => {
    it('should show ≥4 role template cards', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        const roleCards = document.querySelectorAll('.role-card');
        expect(
          roleCards.length,
          `Must have ≥4 role templates, found ${roleCards.length}`
        ).toBeGreaterThanOrEqual(4);
      });
    });

    it('should include 产品经理 template card', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });
    });

    it('should show preset skills for 产品经理 template', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const skillBadges = document.querySelectorAll('.skill-badge');
      expect(skillBadges.length).toBeGreaterThan(0);

      const hasValidationGate = Array.from(skillBadges).some(
        (badge) =>
          badge.textContent?.includes('validation-gate') ||
          badge.textContent?.includes('web-research')
      );
      expect(hasValidationGate).toBe(true);
    });

    it('should show step indicator at step 1', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('选择模板')).toBeInTheDocument();
      });

      const stepIndicators = document.querySelectorAll('.step-indicator.active');
      expect(stepIndicators.length).toBe(1);
    });

    it('should NOT allow proceeding without selecting a template', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('选择模板')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /^下一步$/i });
      expect(nextButton).toBeDisabled();
    });

    it('should enable "下一步" after selecting a template', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const roleCards = document.querySelectorAll('.role-card');
      expect(roleCards.length).toBeGreaterThan(0);

      await user.click(roleCards[0] as HTMLElement);

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /^下一步$/i });
        expect(nextButton).not.toBeDisabled();
      });
    });
  });

  describe('Step 2: Name and Duty', () => {
    it('should pre-fill name and duty after selecting template', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const pmCard = screen.getByText('产品经理').closest('.role-card');
      expect(pmCard).toBeInTheDocument();

      await user.click(pmCard as HTMLElement);

      const nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('设置名称与职责')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Agent 名称/i) as HTMLInputElement;
      expect(nameInput.value).toContain('产品经理');

      const dutyInput = screen.getByLabelText(/职责描述/i) as HTMLTextAreaElement;
      expect(dutyInput.value.length).toBeGreaterThan(0);
    });

    it('should allow editing name and duty', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const roleCards = document.querySelectorAll('.role-card');
      await user.click(roleCards[0] as HTMLElement);

      const nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Agent 名称/i);
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Agent 名称/i);
      await user.clear(nameInput);
      await user.type(nameInput, '自定义产品经理');

      expect((nameInput as HTMLInputElement).value).toBe('自定义产品经理');
    });

    it('should NOT allow proceeding without name', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const roleCards = document.querySelectorAll('.role-card');
      await user.click(roleCards[0] as HTMLElement);

      let nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('设置名称与职责')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Agent 名称/i);
      await user.clear(nameInput);

      nextButton = screen.getByRole('button', { name: /^下一步$/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Step 3: Prepare Sandbox', () => {
    it('should show "准备沙箱" step with confirmation info', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const roleCards = document.querySelectorAll('.role-card');
      await user.click(roleCards[0] as HTMLElement);

      let nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('设置名称与职责')).toBeInTheDocument();
      });

      nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        const prepareStep = document.querySelector('.wizard-step h3');
        expect(prepareStep?.textContent).toBe('准备沙箱');
      });

      expect(screen.getByText(/即将为该 Agent 创建专属工作环境/)).toBeInTheDocument();
    });

    it('should show "创建并准备沙箱" button at step 3', async () => {
      const user = userEvent.setup();
      render(<Sidebar activeAgent="" onAgentChange={() => {}} />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const roleCards = document.querySelectorAll('.role-card');
      await user.click(roleCards[0] as HTMLElement);

      let nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        nextButton = screen.getByRole('button', { name: /^下一步$/i });
        expect(nextButton).toBeInTheDocument();
      });

      await user.click(nextButton);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
        expect(submitButton).toBeInTheDocument();
      });
    });
  });

  describe('Success Path', () => {
    it('should show "创建中..." state when submitting', async () => {
      const user = userEvent.setup();
      render(<App />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const pmCard = screen.getByText('产品经理').closest('.role-card');
      await user.click(pmCard as HTMLElement);

      let nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        nextButton = screen.getByRole('button', { name: /^下一步$/i });
        expect(nextButton).toBeInTheDocument();
      });

      await user.click(nextButton);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
        expect(submitButton).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
      await user.click(submitButton);

      await waitFor(
        () => {
          const creatingButton = screen.getByRole('button', { name: /创建中/i });
          expect(creatingButton, '「创建中...」 button must be visible').toBeInTheDocument();
          expect(creatingButton, '「创建中...」 button must be disabled').toBeDisabled();
        },
        { timeout: 500 }
      );
    });

    it('should show new agent in sidebar after successful creation', async () => {
      const user = userEvent.setup();
      render(<App />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const pmCard = screen.getByText('产品经理').closest('.role-card');
      await user.click(pmCard as HTMLElement);

      let nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Agent 名称/i);
        expect(nameInput).toBeInTheDocument();
      });

      const testAgentName = `测试产品经理_${Date.now()}`;
      const nameInput = screen.getByLabelText(/Agent 名称/i);
      await user.clear(nameInput);
      await user.type(nameInput, testAgentName);

      nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
        expect(submitButton).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
      await user.click(submitButton);

      await waitFor(
        () => {
          const agentInSidebar = screen.getByText(testAgentName);
          expect(agentInSidebar, 'New agent name must be visible in sidebar').toBeInTheDocument();

          const activeAgentItem = document.querySelector('.agent-item.active');
          expect(
            activeAgentItem,
            'New agent must be selected (.agent-item.active)'
          ).toBeInTheDocument();
          expect(activeAgentItem?.textContent, 'Active agent must have the created name').toContain(
            testAgentName
          );

          const emptyState = document.querySelector('.empty-state');
          expect(
            emptyState,
            'Empty state must disappear after creating first agent'
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should go from 0 to 1 agent in sidebar (empty → create → 1 agent)', async () => {
      const user = userEvent.setup();
      render(<App />);

      const emptyState = document.querySelector('.empty-state');
      expect(emptyState, 'Should start with empty sidebar').toBeInTheDocument();

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const pmCard = screen.getByText('产品经理').closest('.role-card');
      await user.click(pmCard as HTMLElement);

      let nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        nextButton = screen.getByRole('button', { name: /^下一步$/i });
        expect(nextButton).toBeInTheDocument();
      });

      await user.click(nextButton);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
        expect(submitButton).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
      await user.click(submitButton);

      await waitFor(
        () => {
          const agentItems = document.querySelectorAll('.agent-item');
          expect(agentItems.length, 'Should have exactly 1 agent after first creation').toBe(1);

          const emptyStateAfter = document.querySelector('.empty-state');
          expect(emptyStateAfter, 'Empty state should be gone').not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should show success toast after creation', async () => {
      const user = userEvent.setup();

      // Mock API createAgent success
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/v1/agents') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: `agent-${Date.now()}`,
              name: '产品经理数字员工',
              template_id: 'pm',
              duty: '需求挖掘、撰写 PRD',
              status: 'idle',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }),
          });
        }
        // List agents (empty initially)
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      });

      render(<App />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const roleCards = document.querySelectorAll('.role-card');
      await user.click(roleCards[0] as HTMLElement);

      let nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        nextButton = screen.getByRole('button', { name: /^下一步$/i });
        expect(nextButton).toBeInTheDocument();
      });

      await user.click(nextButton);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
        expect(submitButton).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
      await user.click(submitButton);

      await waitFor(
        () => {
          const successToast = document.querySelector('.success-toast');
          expect(successToast, 'Success toast must be visible after API creation').toBeInTheDocument();
          expect(successToast?.textContent, 'Success toast must contain 已创建').toContain(
            '已创建'
          );
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Failure Path', () => {
    it('should show error banner on creation failure', async () => {
      const user = userEvent.setup();

      (
        window as unknown as { __OPENSTAFF_FORCE_CREATE_FAIL__?: boolean }
      ).__OPENSTAFF_FORCE_CREATE_FAIL__ = true;

      render(<App />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const roleCards = document.querySelectorAll('.role-card');
      await user.click(roleCards[0] as HTMLElement);

      let nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        nextButton = screen.getByRole('button', { name: /^下一步$/i });
        expect(nextButton).toBeInTheDocument();
      });

      await user.click(nextButton);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
        expect(submitButton).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
      await user.click(submitButton);

      await waitFor(
        () => {
          const errorBanner = document.querySelector('.error-banner');
          expect(
            errorBanner,
            '.error-banner must appear on failure (injectable hook active)'
          ).toBeInTheDocument();

          const errorText = errorBanner?.textContent || '';
          expect(errorText, 'Error banner must contain failure reason').toMatch(
            /本地存储失败|失败|错误/
          );
        },
        { timeout: 3000 }
      );

      delete (window as unknown as { __OPENSTAFF_FORCE_CREATE_FAIL__?: boolean })
        .__OPENSTAFF_FORCE_CREATE_FAIL__;
    });

    it('should allow closing error banner', async () => {
      const user = userEvent.setup();

      (
        window as unknown as { __OPENSTAFF_FORCE_CREATE_FAIL__?: boolean }
      ).__OPENSTAFF_FORCE_CREATE_FAIL__ = true;

      render(<App />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const roleCards = document.querySelectorAll('.role-card');
      await user.click(roleCards[0] as HTMLElement);

      let nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        nextButton = screen.getByRole('button', { name: /^下一步$/i });
        expect(nextButton).toBeInTheDocument();
      });

      await user.click(nextButton);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
        expect(submitButton).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
      await user.click(submitButton);

      await waitFor(
        () => {
          const errorBanner = document.querySelector('.error-banner');
          expect(errorBanner).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      await waitFor(() => {
        const closeButton = document.querySelector('.error-banner button');
        expect(closeButton, 'Error banner must have close button').toBeTruthy();
      });

      const closeButton = document.querySelector('.error-banner button');
      await user.click(closeButton as HTMLElement);

      await waitFor(() => {
        const errorBanner = document.querySelector('.error-banner');
        expect(errorBanner).not.toBeInTheDocument();
      });

      delete (window as unknown as { __OPENSTAFF_FORCE_CREATE_FAIL__?: boolean })
        .__OPENSTAFF_FORCE_CREATE_FAIL__;
    });

    it('should NOT silently fail on error', async () => {
      const user = userEvent.setup();

      (
        window as unknown as { __OPENSTAFF_FORCE_CREATE_FAIL__?: boolean }
      ).__OPENSTAFF_FORCE_CREATE_FAIL__ = true;

      render(<App />);

      const addButton = screen.getByRole('button', { name: /创建 Agent/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('产品经理')).toBeInTheDocument();
      });

      const roleCards = document.querySelectorAll('.role-card');
      await user.click(roleCards[0] as HTMLElement);

      let nextButton = screen.getByRole('button', { name: /^下一步$/i });
      await user.click(nextButton);

      await waitFor(() => {
        nextButton = screen.getByRole('button', { name: /^下一步$/i });
        expect(nextButton).toBeInTheDocument();
      });

      await user.click(nextButton);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
        expect(submitButton).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /创建并准备沙箱/i });
      await user.click(submitButton);

      await waitFor(
        () => {
          const errorBanner = document.querySelector('.error-banner');
          expect(errorBanner, 'Must show visible error feedback (not silent failure)').toBeTruthy();

          const errorText = errorBanner?.textContent || '';
          expect(errorText.length, 'Error banner must have text content').toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      delete (window as unknown as { __OPENSTAFF_FORCE_CREATE_FAIL__?: boolean })
        .__OPENSTAFF_FORCE_CREATE_FAIL__;
    });
  });
});

/**
 * Manual Testing Hook Documentation
 *
 * To test the create agent failure path manually in browser console:
 *
 * 1. Set failure hook:
 *    window.__OPENSTAFF_FORCE_CREATE_FAIL__ = true
 *
 * 2. Create an agent through the wizard (will fail with error banner)
 *
 * 3. Reset to normal behavior:
 *    delete window.__OPENSTAFF_FORCE_CREATE_FAIL__
 *
 * Default behavior (hook not set): Create always succeeds
 */
