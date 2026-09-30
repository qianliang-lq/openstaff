import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('should show empty state when no agents exist', () => {
    const onAgentChange = () => {};
    render(<Sidebar activeAgent="" onAgentChange={onAgentChange} />);

    expect(screen.getByText('还没有数字员工')).toBeInTheDocument();
    expect(screen.getByText(/点击上方.*创建/)).toBeInTheDocument();

    const emptyState = document.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should NOT show pre-seeded agents by default', () => {
    const onAgentChange = () => {};
    render(<Sidebar activeAgent="" onAgentChange={onAgentChange} />);

    const preSeededAgents = ['产品经理数字员工', '运营专家', '研发协作'];
    preSeededAgents.forEach((name) => {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    });
  });
});
