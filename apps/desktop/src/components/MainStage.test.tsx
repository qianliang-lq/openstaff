import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainStage from './MainStage';

describe('MainStage', () => {
  beforeEach(() => {
    // Mock scrollIntoView (not available in jsdom)
    Element.prototype.scrollIntoView = vi.fn();

    // Reset fetch mock
    global.fetch = vi.fn();
  });

  it('should render all tabs', () => {
    const onTabChange = () => {};
    render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Computer')).toBeInTheDocument();
    expect(screen.getByText('Routines')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Connectors')).toBeInTheDocument();
    expect(screen.getByText('Memory')).toBeInTheDocument();
  });

  it('should display ChatStage when chat tab is active', () => {
    const onTabChange = () => {};
    render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

    const chatStage = document.querySelector('.chat-stage');
    expect(chatStage).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    const onTabChange = () => {};
    render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

    const activeTab = document.querySelector('.tab.active');
    expect(activeTab).toBeInTheDocument();
    expect(activeTab?.textContent).toBe('Chat');
  });

  // TC-079/080: MainStage 「立即跑一次」 click feedback (real UI)
  describe('TC-079/080: MainStage fire button click feedback', () => {
    it('shows running state on button text after click', async () => {
      const user = userEvent.setup();
      const onTabChange = () => {};

      // Mock scheduler fire to resolve slowly
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url === 'http://localhost:3002/demo/fire') {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ accepted: true }),
              });
            }, 100);
          });
        }
        // Mock insights polling to fail (no result yet)
        return Promise.resolve({
          ok: false,
          status: 404,
        });
      });

      render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

      // Find MainStage button specifically (in tabbar, not ChatStage)
      const tabbar = document.querySelector('.tabbar');
      expect(tabbar).toBeInTheDocument();

      const fireButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('立即跑一次') && !btn.textContent?.includes('Demo')
      );
      expect(fireButton).toBeTruthy();
      expect(fireButton).not.toBeDisabled();

      await user.click(fireButton as HTMLElement);

      // MUST show visible running state: button text changes to "运行中..."
      await waitFor(
        () => {
          expect(fireButton?.textContent).toBe('运行中...');
          expect(fireButton).toBeDisabled();
        },
        { timeout: 500 }
      );
    });

    it('shows error banner when scheduler returns error', async () => {
      const user = userEvent.setup();
      const onTabChange = () => {};

      // Mock scheduler to return error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

      // Find MainStage button specifically
      const fireButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('立即跑一次') && !btn.textContent?.includes('Demo')
      );
      expect(fireButton).toBeTruthy();

      await user.click(fireButton as HTMLElement);

      // MUST show visible error banner with ❌ and error text
      await waitFor(
        () => {
          const errorBanner = document.querySelector('.demo-error-banner');
          expect(errorBanner).toBeInTheDocument();

          const errorIcon = document.querySelector('.error-icon');
          expect(errorIcon?.textContent).toContain('❌');

          const errorText = document.querySelector('.error-text');
          expect(errorText?.textContent).toMatch(/Scheduler|服务|错误|后端/i);
        },
        { timeout: 3000 }
      );

      // Button should be re-enabled
      await waitFor(() => {
        expect(fireButton).not.toBeDisabled();
      });
    });

    it('shows error banner when fetch rejects (network error)', async () => {
      const user = userEvent.setup();
      const onTabChange = () => {};

      // Mock fetch to reject
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

      // Find MainStage button specifically
      const fireButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('立即跑一次') && !btn.textContent?.includes('Demo')
      );
      expect(fireButton).toBeTruthy();

      await user.click(fireButton as HTMLElement);

      // MUST show visible error banner
      await waitFor(
        () => {
          const errorBanner = document.querySelector('.demo-error-banner');
          expect(errorBanner).toBeInTheDocument();

          const errorIcon = document.querySelector('.error-icon');
          expect(errorIcon?.textContent).toContain('❌');
        },
        { timeout: 3000 }
      );
    });

    it('allows dismissing error banner via close button', async () => {
      const user = userEvent.setup();
      const onTabChange = () => {};

      // Mock fetch to reject
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

      // Find MainStage button specifically
      const fireButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('立即跑一次') && !btn.textContent?.includes('Demo')
      );
      expect(fireButton).toBeTruthy();

      await user.click(fireButton as HTMLElement);

      // Wait for error banner
      await waitFor(() => {
        const errorBanner = document.querySelector('.demo-error-banner');
        expect(errorBanner).toBeInTheDocument();
      });

      // Click close button
      const closeButton = document.querySelector('.error-close');
      expect(closeButton).toBeInTheDocument();
      await user.click(closeButton as HTMLElement);

      // Error banner should be dismissed
      await waitFor(() => {
        const errorBanner = document.querySelector('.demo-error-banner');
        expect(errorBanner).not.toBeInTheDocument();
      });
    });

    it('shows error banner on timeout (max polls exceeded)', async () => {
      const user = userEvent.setup();
      const onTabChange = () => {};

      // Mock scheduler fire to succeed but insights polling to never complete
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url === 'http://localhost:3002/demo/fire') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ accepted: true }),
          });
        }
        // Mock insights to always return empty/not ready (no reconcile_status or empty facts)
        return Promise.resolve({
          ok: true,
          json: async () => ({ reconcile_status: null, facts: [] }),
        });
      });

      render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

      // Find MainStage button specifically
      const fireButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('立即跑一次') && !btn.textContent?.includes('Demo')
      );
      expect(fireButton).toBeTruthy();

      await user.click(fireButton as HTMLElement);

      // MUST show timeout error banner after max polls
      await waitFor(
        () => {
          const errorBanner = document.querySelector('.demo-error-banner');
          expect(errorBanner).toBeInTheDocument();

          const errorText = document.querySelector('.error-text');
          expect(errorText?.textContent).toMatch(/超时|timeout/i);
        },
        { timeout: 12000 } // 10 polls * 1 second + buffer
      );
    }, 15000); // Test timeout: 15 seconds

    it('shows error banner on reconcile failure (after timeout)', async () => {
      const user = userEvent.setup();
      const onTabChange = () => {};

      // Mock scheduler fire to succeed and insights to return FAILED reconcile
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url === 'http://localhost:3002/demo/fire') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ accepted: true }),
          });
        }
        // Mock insights to return FAILED reconcile (should stop immediately)
        return Promise.resolve({
          ok: true,
          json: async () => ({
            reconcile_status: 'FAILED',
            facts: [],
          }),
        });
      });

      render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

      // Find MainStage button specifically
      const fireButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('立即跑一次') && !btn.textContent?.includes('Demo')
      );
      expect(fireButton).toBeTruthy();

      await user.click(fireButton as HTMLElement);

      // FAILED reconcile should show error immediately (not wait for timeout)
      await waitFor(
        () => {
          const errorBanner = document.querySelector('.demo-error-banner');
          expect(errorBanner).toBeInTheDocument();

          const errorText = document.querySelector('.error-text');
          expect(errorText?.textContent).toMatch(/未通过审核|FAILED/i);
        },
        { timeout: 5000 }
      );
    }, 10000); // Test timeout: 15 seconds
  });
});
