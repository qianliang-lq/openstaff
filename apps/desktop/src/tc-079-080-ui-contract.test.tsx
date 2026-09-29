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
      
      // Mock scrollIntoView for ChatStage
      Element.prototype.scrollIntoView = vi.fn();
      
      // Mock Tauri environment for ChatStage key checks
      (window as any).__TAURI__ = {
        core: {
          invoke: vi.fn().mockResolvedValue('mock-api-key'),
        },
      };
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

    it('should have fire button in ChatStage toolbar', () => {
      // Simple contract check: ChatStage has「立即跑一次」button
      render(
        <ChatStage 
          agentName="产品经理数字员工"
          onNavigateToConnectors={() => {}}
        />
      );

      // Contract: Button exists (feedback implementation tested via MainStage)
      const fireButton = screen.queryByText(/立即跑一次/);
      expect(fireButton).toBeInTheDocument();
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
