import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock API to return empty agents
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => [],
      })
    ) as unknown as typeof fetch;
  });

  it('should show empty state when no agents exist', async () => {
    const onAgentChange = () => {};
    render(<Sidebar activeAgent="" onAgentChange={onAgentChange} />);

    // Wait for API load to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('还没有数字员工')).toBeInTheDocument();
    expect(screen.getByText(/点击上方.*创建/)).toBeInTheDocument();

    const emptyState = document.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should NOT show pre-seeded agents by default', async () => {
    const onAgentChange = () => {};
    render(<Sidebar activeAgent="" onAgentChange={onAgentChange} />);

    // Wait for API load to complete
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    const preSeededAgents = ['产品经理数字员工', '运营专家', '研发协作'];
    preSeededAgents.forEach((name) => {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    });
  });
});
