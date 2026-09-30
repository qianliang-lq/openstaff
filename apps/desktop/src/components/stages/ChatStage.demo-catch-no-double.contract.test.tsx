/**
 * TC-CHATSTAGE-DEMO-CATCH-NO-DOUBLE: ChatStage Demo poll catch 不叠超时卡
 *
 * 契约测试，验证：
 * - 场景1：轮询最后一次 catch 网络错误 → 只出一张超时卡（不叠加）
 * - 场景2：轮询第 3 次 catch 后还有第 4 次正常 PASS → 成功渲染（不出错卡）
 * - 场景3：轮询 10 次全 catch → 只出一张超时卡
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatStage from './ChatStage';
import * as tauriUtils from '../../utils/tauri';

vi.mock('../../utils/tauri', async () => {
  const actual = await vi.importActual<typeof import('../../utils/tauri')>('../../utils/tauri');
  return {
    ...actual,
    isTauriEnvironment: vi.fn(),
    getProviderKey: vi.fn(),
    saveProviderKey: vi.fn(),
    deleteProviderKey: vi.fn(),
  };
});

describe('TC-CHATSTAGE-DEMO-CATCH-NO-DOUBLE: ChatStage Demo poll catch 不叠超时卡', () => {
  const mockIsTauriEnvironment = vi.mocked(tauriUtils.isTauriEnvironment);
  const mockGetProviderKey = vi.mocked(tauriUtils.getProviderKey);

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTauriEnvironment.mockReturnValue(true);
    mockGetProviderKey.mockImplementation(async (provider: string) => {
      if (provider === 'qwen') {
        return 'sk-mock-qwen-key-12345';
      }
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('场景 1: 轮询最后一次 catch 网络错误 → 只出一张超时卡', () => {
    it(
      'should show only one timeout error card when last poll attempt catches',
      async () => {
        const user = userEvent.setup();
        let pollCount = 0;

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url.includes('/v1/agents')) {
            return Promise.resolve({
              ok: true,
              json: async () => [
                {
                  id: 'agent-test-uuid',
                  name: '测试产品经理',
                  template_id: 'pm',
                  duty: '产品管理',
                  status: 'idle',
                },
              ],
            });
          }
          if (url.includes('/v1/messages')) {
            return Promise.resolve({
              ok: true,
              json: async () => [],
            });
          }
          if (url.includes('/demo/fire')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ fired: true, job_id: 'test-job-123' }),
            });
          }
          if (url.includes('/v1/insights/latest')) {
            pollCount++;
            if (pollCount >= 10) {
              return Promise.reject(new Error('Network timeout'));
            }
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

        const { container } = render(
          <ChatStage
            agentName="测试产品经理"
            onNavigateToConnectors={() => {}}
            onNavigateToSkills={() => {}}
          />
        );

        const fireButton = container.querySelector('.fire-job-btn') as HTMLButtonElement;
        await user.click(fireButton);

        await waitFor(
          () => {
            const errorCards = container.querySelectorAll('.error-card');
            expect(errorCards.length, '只应出现一张错误卡').toBe(1);
          },
          { timeout: 12000 }
        );

        const errorText = container.textContent || '';
        expect(errorText.includes('运行超时') || errorText.includes('10s'), '错误应提示超时').toBe(
          true
        );

        expect(pollCount, '应完成 10 次轮询').toBe(10);
      },
      { timeout: 15000 }
    );
  });

  describe('场景 2: 轮询 catch 后正常 PASS → 不出错卡', () => {
    it(
      'should not show error card when poll succeeds after earlier catch',
      async () => {
        const user = userEvent.setup();
        let pollCount = 0;

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url.includes('/v1/agents')) {
            return Promise.resolve({
              ok: true,
              json: async () => [
                {
                  id: 'agent-test-uuid',
                  name: '测试产品经理',
                  template_id: 'pm',
                  duty: '产品管理',
                  status: 'idle',
                },
              ],
            });
          }
          if (url.includes('/v1/messages')) {
            return Promise.resolve({
              ok: true,
              json: async () => [],
            });
          }
          if (url.includes('/demo/fire')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ fired: true, job_id: 'test-job-123' }),
            });
          }
          if (url.includes('/v1/insights/latest')) {
            pollCount++;
            if (pollCount === 3) {
              return Promise.reject(new Error('Temporary network error'));
            }
            if (pollCount >= 4) {
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

        const { container } = render(
          <ChatStage
            agentName="测试产品经理"
            onNavigateToConnectors={() => {}}
            onNavigateToSkills={() => {}}
          />
        );

        const fireButton = container.querySelector('.fire-job-btn') as HTMLButtonElement;
        await user.click(fireButton);

        await waitFor(
          () => {
            const successText = container.textContent || '';
            expect(
              successText.includes('运行成功') || successText.includes('已生成'),
              '应显示成功消息'
            ).toBe(true);
          },
          { timeout: 6000 }
        );

        const errorCards = container.querySelectorAll('.error-card');
        expect(errorCards.length, 'catch后正常PASS不应出错卡').toBe(0);
      },
      { timeout: 10000 }
    );
  });

  describe('场景 3: 轮询 10 次全 catch → 只出一张超时卡', () => {
    it(
      'should show only one timeout error card when all polls catch',
      async () => {
        const user = userEvent.setup();
        let pollCount = 0;

        global.fetch = vi.fn().mockImplementation((url: string) => {
          if (url.includes('/v1/agents')) {
            return Promise.resolve({
              ok: true,
              json: async () => [
                {
                  id: 'agent-test-uuid',
                  name: '测试产品经理',
                  template_id: 'pm',
                  duty: '产品管理',
                  status: 'idle',
                },
              ],
            });
          }
          if (url.includes('/v1/messages')) {
            return Promise.resolve({
              ok: true,
              json: async () => [],
            });
          }
          if (url.includes('/demo/fire')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ fired: true, job_id: 'test-job-123' }),
            });
          }
          if (url.includes('/v1/insights/latest')) {
            pollCount++;
            return Promise.reject(new Error('Network always fails'));
          }
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Service unavailable' }),
          });
        }) as typeof fetch;

        const { container } = render(
          <ChatStage
            agentName="测试产品经理"
            onNavigateToConnectors={() => {}}
            onNavigateToSkills={() => {}}
          />
        );

        const fireButton = container.querySelector('.fire-job-btn') as HTMLButtonElement;
        await user.click(fireButton);

        await waitFor(
          () => {
            const errorCards = container.querySelectorAll('.error-card');
            expect(errorCards.length, '全 catch 只应出一张超时卡').toBe(1);
          },
          { timeout: 12000 }
        );

        const errorText = container.textContent || '';
        expect(errorText.includes('运行超时') || errorText.includes('10s'), '错误应提示超时').toBe(
          true
        );

        expect(pollCount, '应完成 10 次轮询尝试').toBe(10);
      },
      { timeout: 15000 }
    );
  });
});
