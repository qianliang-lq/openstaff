/**
 * Computer Contract Tests
 *
 * These tests verify that the Computer tab satisfies the §14 requirements:
 * - Badge with sandbox label and node ID
 * - Workspace tree with expandable folders and clickable files
 * - File click shows selection feedback
 * - "打开工作区" button shows toast
 * - Read-only terminal with session lines
 * - CPU/MEM/DISK metrics visible
 * - No placeholder text like "开发中" or "敬请期待"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Computer from './Computer';

describe('Computer Contract Tests', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      if (url === '/fixtures/computer.json') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            'agent-1': {
              agentId: 'agent-1',
              sandboxLabel: '云端沙箱 · 只读观察',
              nodeId: 'sandbox-pm-01',
              status: 'running',
              tree: {
                name: 'workspace',
                path: '/workspace',
                kind: 'dir',
                children: [
                  {
                    name: 'docs',
                    path: '/workspace/docs',
                    kind: 'dir',
                    children: [
                      {
                        name: 'PRD_2026Q3.md',
                        path: '/workspace/docs/PRD_2026Q3.md',
                        kind: 'file',
                      },
                      {
                        name: 'meeting_notes.txt',
                        path: '/workspace/docs/meeting_notes.txt',
                        kind: 'file',
                      },
                    ],
                  },
                  {
                    name: 'README.md',
                    path: '/workspace/README.md',
                    kind: 'file',
                  },
                ],
              },
              selectedPath: null,
              terminalLines: [
                'agent@sandbox-pm-01:~/workspace$ ls -la',
                'total 24',
                'drwxr-xr-x 4 agent agent 4096 Sep 28 15:30 .',
                'agent@sandbox-pm-01:~/workspace$ ',
              ],
              metrics: {
                cpuPct: 12.5,
                memMb: 256,
                diskUsedGb: 1.2,
                diskTotalGb: 10.0,
              },
            },
            'agent-2': {
              agentId: 'agent-2',
              sandboxLabel: '云端沙箱 · 只读观察',
              nodeId: 'sandbox-eng-02',
              status: 'idle',
              tree: {
                name: 'workspace',
                path: '/workspace',
                kind: 'dir',
                children: [
                  {
                    name: 'src',
                    path: '/workspace/src',
                    kind: 'dir',
                    children: [
                      {
                        name: 'main.rs',
                        path: '/workspace/src/main.rs',
                        kind: 'file',
                      },
                    ],
                  },
                ],
              },
              selectedPath: null,
              terminalLines: ['agent@sandbox-eng-02:~/workspace$ cargo build'],
              metrics: {
                cpuPct: 5.2,
                memMb: 128,
                diskUsedGb: 0.8,
                diskTotalGb: 10.0,
              },
            },
          }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  it('should display sandbox badge with label', async () => {
    render(<Computer agentName="产品经理数字员工" />);

    await waitFor(() => {
      const badge = screen.getByText(/云端沙箱/);
      expect(badge).toBeInTheDocument();
    });

    const label = screen.getByText('云端沙箱 · 只读观察');
    expect(label).toBeInTheDocument();
  });

  it('should display node ID', async () => {
    render(<Computer agentName="产品经理数字员工" />);

    await waitFor(() => {
      const nodeId = screen.getByText('sandbox-pm-01');
      expect(nodeId).toBeInTheDocument();
    });
  });

  it('should display workspace tree with folders and files', async () => {
    render(<Computer agentName="产品经理数字员工" />);

    await waitFor(() => {
      expect(screen.getByText('workspace')).toBeInTheDocument();
    });

    expect(screen.getByText('docs')).toBeInTheDocument();
    expect(screen.getByText('PRD_2026Q3.md')).toBeInTheDocument();
    expect(screen.getByText('meeting_notes.txt')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('should show selection feedback when file is clicked', async () => {
    const user = userEvent.setup();
    render(<Computer agentName="产品经理数字员工" />);

    await waitFor(() => {
      expect(screen.getByText('PRD_2026Q3.md')).toBeInTheDocument();
    });

    const file = screen.getByText('PRD_2026Q3.md');
    await user.click(file);

    await waitFor(() => {
      const toast = screen.getByText(/已选中/);
      expect(toast).toBeInTheDocument();
    });
  });

  it('should show toast when "打开工作区" button is clicked', async () => {
    const user = userEvent.setup();
    render(<Computer agentName="产品经理数字员工" />);

    await waitFor(() => {
      expect(screen.getByText('打开工作区')).toBeInTheDocument();
    });

    const button = screen.getByText('打开工作区');
    await user.click(button);

    await waitFor(() => {
      const toast = screen.getByText('路径已复制');
      expect(toast).toBeInTheDocument();
    });
  });

  it('should show toast when root workspace is clicked', async () => {
    const user = userEvent.setup();
    render(<Computer agentName="产品经理数字员工" />);

    await waitFor(() => {
      expect(screen.getByText('workspace')).toBeInTheDocument();
    });

    const root = screen.getByText('workspace');
    await user.click(root);

    await waitFor(() => {
      const toast = screen.getByText('路径已复制');
      expect(toast).toBeInTheDocument();
    });
  });

  it('should display read-only terminal with session lines', async () => {
    render(<Computer agentName="产品经理数字员工" />);

    await waitFor(() => {
      const terminalContent = screen.getByText(/ls -la/);
      expect(terminalContent).toBeInTheDocument();
    });

    expect(screen.getByText(/total 24/)).toBeInTheDocument();
  });

  it('should display CPU/MEM/DISK metrics', async () => {
    render(<Computer agentName="产品经理数字员工" />);

    await waitFor(() => {
      expect(screen.getByText('CPU')).toBeInTheDocument();
    });

    expect(screen.getByText('MEM')).toBeInTheDocument();
    expect(screen.getByText('DISK')).toBeInTheDocument();

    expect(screen.getByText('12.5%')).toBeInTheDocument();
    expect(screen.getByText('256MB')).toBeInTheDocument();
    expect(screen.getByText('1.2GB / 10GB')).toBeInTheDocument();
  });

  it('should change content when agent switches', async () => {
    const { rerender } = render(<Computer agentName="产品经理数字员工" />);

    await waitFor(() => {
      expect(screen.getByText('sandbox-pm-01')).toBeInTheDocument();
    });

    rerender(<Computer agentName="工程师数字员工" />);

    await waitFor(() => {
      expect(screen.getByText('sandbox-eng-02')).toBeInTheDocument();
    });

    expect(screen.getByText('main.rs')).toBeInTheDocument();
  });

  it('should NOT contain placeholder text', async () => {
    render(<Computer agentName="产品经理数字员工" />);

    await waitFor(() => {
      expect(screen.getByText('workspace')).toBeInTheDocument();
    });

    const forbiddenPhrases = ['开发中', '敬请期待', '即将推出', 'Coming Soon'];

    forbiddenPhrases.forEach((phrase) => {
      expect(screen.queryByText(new RegExp(phrase, 'i'))).not.toBeInTheDocument();
    });
  });

  it('should have terminal marked as read-only', async () => {
    render(<Computer agentName="产品经理数字员工" />);

    await waitFor(() => {
      expect(screen.getByText(/终端.*只读/)).toBeInTheDocument();
    });
  });
});
