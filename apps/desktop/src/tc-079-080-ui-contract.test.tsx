/**
 * TC-079, TC-080: UI Contract Tests (Expected RED until encoding fixes land)
 * 
 * TC-079: 「立即跑一次」不可静默 - 点击后必须有可见反馈
 * TC-080: 四 Tab 无「开发中」- Computer/Routines/Skills/Memory 最小内容
 * 
 * NOTE: These tests may FAIL on current tip (expected behavior).
 * They document the UI contracts that product code must satisfy.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainStage from './components/MainStage';
import ChatStage from './components/stages/ChatStage';

describe('UI Contract Tests (TC-079+)', () => {
  describe('TC-079: 「立即跑一次」不可静默', () => {
    beforeEach(() => {
      // Mock fetch for scheduler and runtime
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should show visible feedback when 立即跑一次 is clicked - MainStage button', async () => {
      // Mock scheduler response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job_id: 'test-job-123' }),
      });

      render(
        <MainStage 
          activeTab="chat" 
          onTabChange={() => {}} 
          activeAgent="产品经理数字员工" 
        />
      );

      // Find 立即跑一次 button
      const fireButton = screen.getByText('立即跑一次');
      expect(fireButton).toBeInTheDocument();

      // Click button
      await userEvent.click(fireButton);

      // Contract: Must show visible feedback
      // Either: (A) 运行中文案/spinner, OR (B) success toast/report card, OR (C) failure red card
      
      // Check for running state (button text changes)
      await waitFor(() => {
        const runningButton = screen.queryByText('运行中...');
        expect(runningButton).toBeInTheDocument();
      }, { timeout: 1000 });

      // Contract satisfied: Button shows "运行中..." as visible feedback
    });

    it('should show visible feedback on failure - ChatStage button', async () => {
      // Mock fetch to fail (backend not running)
      (global.fetch as any).mockRejectedValueOnce(new Error('Failed to fetch'));

      render(
        <ChatStage 
          agentName="产品经理数字员工"
          onNavigateToConnectors={() => {}}
        />
      );

      // Find 立即跑一次 button in ChatStage
      const fireButton = screen.getByText(/立即跑一次/);
      
      // Click button
      await userEvent.click(fireButton);

      // Contract: Must show failure red card with "后端未起" or similar error
      await waitFor(() => {
        // Look for error indicator (❌ or "失败" or "未响应")
        const errorElements = screen.queryAllByText(/❌|失败|未响应|Scheduler/);
        expect(errorElements.length).toBeGreaterThan(0);
      }, { timeout: 2000 });

      // Contract satisfied: Shows visible error feedback
    });

    it('should show visible feedback on success - ChatStage with polling', async () => {
      // Mock scheduler fire success
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job_id: 'test-job-123' }),
      });

      // Mock runtime insights response (success)
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          job_status: 'completed',
          reconcile_status: 'PASS',
          facts: [
            {
              bucket: '竞对',
              title: 'Test fact',
              summary_zh: 'Test summary',
              url: 'https://example.com',
              tags: ['test'],
            },
          ],
          timestamp: '2026-09-29',
        }),
      });

      render(
        <ChatStage 
          agentName="产品经理数字员工"
          onNavigateToConnectors={() => {}}
        />
      );

      const fireButton = screen.getByText(/立即跑一次/);
      await userEvent.click(fireButton);

      // Contract: Must show success feedback (✅ or toast or report card)
      await waitFor(() => {
        // Look for success indicators
        const successElements = screen.queryAllByText(/✅|成功|已生成|条外部洞察/);
        expect(successElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // Contract satisfied: Shows visible success feedback
    });

    it('should maintain visible feedback throughout operation lifecycle', async () => {
      // Test that feedback is always visible: running → success/failure
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ job_id: 'test-job-123' }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            job_status: 'completed',
            reconcile_status: 'PASS',
            facts: [],
            timestamp: '2026-09-29',
          }),
        });

      render(
        <ChatStage 
          agentName="产品经理数字员工"
          onNavigateToConnectors={() => {}}
        />
      );

      const fireButton = screen.getByText(/立即跑一次/);
      
      // Before click: button enabled
      expect(fireButton).not.toBeDisabled();

      await userEvent.click(fireButton);

      // During operation: must show running state
      await waitFor(() => {
        const runningIndicator = screen.queryByText(/运行中|正在执行/);
        expect(runningIndicator).toBeInTheDocument();
      });

      // After completion: must show result (success or failure)
      await waitFor(() => {
        const resultIndicators = screen.queryAllByText(/✅|❌|成功|失败/);
        expect(resultIndicators.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // Contract: No silent failure - always visible feedback
    });
  });

  describe('TC-080: 四 Tab 无「开发中」', () => {
    it('Computer tab should not show 开发中 stub', () => {
      render(
        <MainStage 
          activeTab="computer" 
          onTabChange={() => {}} 
          activeAgent="产品经理数字员工" 
        />
      );

      // Contract: Page content must NOT contain "开发中" text
      const pageContent = screen.getByText(/Computer|计算机|沙箱/i).textContent || '';
      
      expect(pageContent).not.toMatch(/开发中/);
      
      // Alternative check: Should have minimum content (list, cards, or UI elements)
      // Not just a single stub div with "开发中"
      const stubIndicators = screen.queryAllByText(/开发中/);
      expect(stubIndicators).toHaveLength(0);
    });

    it('Routines tab should not show 开发中 stub', () => {
      render(
        <MainStage 
          activeTab="routines" 
          onTabChange={() => {}} 
          activeAgent="产品经理数字员工" 
        />
      );

      // Contract: Page content must NOT contain "开发中" text
      const stubIndicators = screen.queryAllByText(/开发中/);
      expect(stubIndicators.length).toBe(0);
      
      // Should have minimum content: routine list or cards
      // Not just empty stub page
    });

    it('Skills tab should not show 开发中 stub', () => {
      render(
        <MainStage 
          activeTab="skills" 
          onTabChange={() => {}} 
          activeAgent="产品经理数字员工" 
        />
      );

      // Contract: Page content must NOT contain "开发中" text
      const stubIndicators = screen.queryAllByText(/开发中/);
      expect(stubIndicators.length).toBe(0);
      
      // Should have minimum content: skills list or library UI
    });

    it('Memory tab should not show 开发中 stub', () => {
      render(
        <MainStage 
          activeTab="memory" 
          onTabChange={() => {}} 
          activeAgent="产品经理数字员工" 
        />
      );

      // Contract: Page content must NOT contain "开发中" text
      const stubIndicators = screen.queryAllByText(/开发中/);
      expect(stubIndicators.length).toBe(0);
      
      // Should have minimum content: memory/profile UI or cards
    });

    it('All four tabs should have minimum content (not just stub)', () => {
      const tabs: Array<'computer' | 'routines' | 'skills' | 'memory'> = [
        'computer',
        'routines', 
        'skills',
        'memory',
      ];

      tabs.forEach((tab) => {
        const { container, unmount } = render(
          <MainStage 
            activeTab={tab} 
            onTabChange={() => {}} 
            activeAgent="产品经理数字员工" 
          />
        );

        // Contract: Should have actual UI elements, not just stub text
        const stageContent = container.querySelector('.stage');
        expect(stageContent).toBeInTheDocument();

        // Check that stage has more than just stub-page div with text
        const stubPage = stageContent?.querySelector('.stub-page');
        
        if (stubPage) {
          // If stub-page exists, it should NOT contain "开发中"
          expect(stubPage.textContent).not.toMatch(/开发中/);
          
          // And should have actual content inside (not just single text node)
          const hasRealContent = 
            stubPage.children.length > 0 || 
            stubPage.querySelectorAll('button, input, .card, .list-item, ul, ol').length > 0;
          
          expect(hasRealContent).toBe(true);
        }

        unmount();
      });
    });

    it('Chat and Connectors tabs are exempt (may have content or stubs)', () => {
      // Contract: TC-080 only applies to Computer/Routines/Skills/Memory
      // Chat and Connectors are allowed to have any state (including stubs if not implemented)
      
      const chatRender = render(
        <MainStage 
          activeTab="chat" 
          onTabChange={() => {}} 
          activeAgent="产品经理数字员工" 
        />
      );
      
      // Chat should be implemented (not stub)
      const chatStage = chatRender.container.querySelector('.chat-stage');
      expect(chatStage).toBeInTheDocument(); // Chat is implemented
      
      chatRender.unmount();

      const connectorsRender = render(
        <MainStage 
          activeTab="connectors" 
          onTabChange={() => {}} 
          activeAgent="产品经理数字员工" 
        />
      );
      
      // Connectors should be implemented (not stub)
      const connectorsStage = connectorsRender.container.querySelector('.connectors-container');
      expect(connectorsStage).toBeInTheDocument(); // Connectors is implemented
      
      connectorsRender.unmount();
    });
  });
});
