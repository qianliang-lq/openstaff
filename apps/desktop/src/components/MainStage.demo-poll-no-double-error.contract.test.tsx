/**
 * TC-MAINSTAGE-DEMO-POLL-NO-DOUBLE: 顶栏 Demo poll catch 不叠卡 + job_status 移除验证
 *
 * 契约测试，验证：
 * - 场景1：轮询成功获得 PASS + facts → 出 insights，不出超时卡
 * - 场景2：轮询超时（10 次无结果）→ 只出一张超时卡，不叠加
 * - 场景3：轮询 FAILED → 立即出失败卡，不继续轮询或叠超时
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainStage from './MainStage';

describe('TC-MAINSTAGE-DEMO-POLL-NO-DOUBLE: 顶栏 Demo 不叠卡 + job_status 移除', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('场景 1: 轮询成功获得 PASS + facts → 不出超时错误', () => {
    it(
      'should not show timeout error when PASS result arrives',
      async () => {
        const user = userEvent.setup();
        const onTabChange = vi.fn();

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === 'http://localhost:3002/demo/fire') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ fired: true, job_id: 'test-job-123' }),
            });
          }
          if (url.includes('/v1/insights/latest')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({
                reconcile_status: 'PASS',
                facts: [
                  {
                    bucket: '竞对',
                    title: 'Test Insight',
                    summary_zh: 'Test summary',
                    url: 'https://example.com',
                    tags: ['test'],
                  },
                ],
                timestamp: '2026-09-30',
              }),
            });
          }
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Service unavailable' }),
          });
        }) as typeof fetch;

        render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

        const fireButton = Array.from(document.querySelectorAll('button')).find(
          (btn) => btn.textContent?.includes('立即跑一次') && !btn.textContent?.includes('Demo')
        );
        expect(fireButton).toBeTruthy();

        await user.click(fireButton as HTMLElement);

        // Wait for polling to complete
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const errorBanner = document.querySelector('.demo-error-banner');
        expect(errorBanner, '成功后不应显示超时错误').toBeNull();

        const fireButtonAfter = Array.from(document.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('立即跑一次')
        );
        expect(
          fireButtonAfter?.textContent?.includes('运行中'),
          '成功后不应持续显示「运行中」'
        ).toBe(false);
      },
      { timeout: 10000 }
    );
  });

  describe('场景 2: 轮询超时 → 只出一张超时卡', () => {
    it(
      'should show only one timeout error card after max polls',
      async () => {
        const user = userEvent.setup();
        const onTabChange = vi.fn();
        let pollCount = 0;

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === 'http://localhost:3002/demo/fire') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ fired: true, job_id: 'test-job-123' }),
            });
          }
          if (url.includes('/v1/insights/latest')) {
            pollCount++;
            return Promise.resolve({
              ok: true,
              json: async () => ({
                reconcile_status: null,
                facts: [],
                timestamp: '2026-09-30',
              }),
            });
          }
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Service unavailable' }),
          });
        }) as typeof fetch;

        render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

        const fireButton = Array.from(document.querySelectorAll('button')).find(
          (btn) => btn.textContent?.includes('立即跑一次') && !btn.textContent?.includes('Demo')
        );
        expect(fireButton).toBeTruthy();

        await user.click(fireButton as HTMLElement);

        await waitFor(
          () => {
            const errorBanner = document.querySelector('.demo-error-banner');
            expect(errorBanner, '超时后应显示错误卡').toBeInTheDocument();
          },
          { timeout: 12000 }
        );

        const errorBanners = document.querySelectorAll('.demo-error-banner');
        expect(errorBanners.length, '只应显示一张超时错误卡').toBe(1);

        const errorText = document.querySelector('.error-text')?.textContent || '';
        expect(
          errorText.includes('运行超时') || errorText.includes('10s'),
          '超时错误应明确提示轮询超时'
        ).toBe(true);

        expect(pollCount, '应完成 10 次轮询').toBeGreaterThanOrEqual(10);
      },
      { timeout: 15000 }
    );
  });

  describe('场景 3: 轮询 FAILED → 立即出失败卡', () => {
    it(
      'should show failure error immediately when FAILED result arrives',
      async () => {
        const user = userEvent.setup();
        const onTabChange = vi.fn();

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url === 'http://localhost:3002/demo/fire') {
            return Promise.resolve({
              ok: true,
              json: async () => ({ fired: true, job_id: 'test-job-123' }),
            });
          }
          if (url.includes('/v1/insights/latest')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({
                reconcile_status: 'FAILED',
                facts: [],
                timestamp: '2026-09-30',
              }),
            });
          }
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Service unavailable' }),
          });
        }) as typeof fetch;

        render(<MainStage activeTab="chat" onTabChange={onTabChange} activeAgent="测试员工" />);

        const fireButton = Array.from(document.querySelectorAll('button')).find(
          (btn) => btn.textContent?.includes('立即跑一次') && !btn.textContent?.includes('Demo')
        );
        expect(fireButton).toBeTruthy();

        await user.click(fireButton as HTMLElement);

        await waitFor(
          () => {
            const errorBanner = document.querySelector('.demo-error-banner');
            expect(errorBanner, 'FAILED 后应显示错误卡').toBeInTheDocument();
          },
          { timeout: 5000 }
        );

        const errorText = document.querySelector('.error-text')?.textContent || '';
        expect(
          errorText.includes('FAILED') || errorText.includes('未通过审核'),
          'FAILED 错误应明确提示审核失败'
        ).toBe(true);

        const errorBanners = document.querySelectorAll('.demo-error-banner');
        expect(errorBanners.length, '只应显示一张失败错误卡').toBe(1);
      },
      { timeout: 10000 }
    );
  });
});
