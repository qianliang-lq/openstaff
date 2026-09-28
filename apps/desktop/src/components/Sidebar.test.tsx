import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('should render multiple agents', () => {
    const onAgentChange = () => {};
    render(<Sidebar activeAgent="产品经理数字员工" onAgentChange={onAgentChange} />);

    expect(screen.getByText('产品经理数字员工')).toBeInTheDocument();
    expect(screen.getByText('运营专家')).toBeInTheDocument();
    expect(screen.getByText('研发协作')).toBeInTheDocument();
  });

  it('should show active agent with active class', () => {
    const onAgentChange = () => {};
    render(<Sidebar activeAgent="产品经理数字员工" onAgentChange={onAgentChange} />);

    const activeItem = document.querySelector('.agent-item.active');
    expect(activeItem).toBeInTheDocument();
    expect(activeItem?.textContent).toContain('产品经理数字员工');
  });
});
