import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar - Web Admin', () => {
  it('should render Chinese navigation labels', () => {
    const onNavigate = () => {};
    render(<Sidebar activePage="instances" onNavigate={onNavigate} />);
    
    expect(screen.getByText('实例')).toBeInTheDocument();
    expect(screen.getByText('节点与运行时')).toBeInTheDocument();
    expect(screen.getByText('观测')).toBeInTheDocument();
    expect(screen.getByText('审批审计')).toBeInTheDocument();
  });

  it('should highlight active page', () => {
    const onNavigate = () => {};
    render(<Sidebar activePage="instances" onNavigate={onNavigate} />);
    
    const activeItem = document.querySelector('.nav-item.active');
    expect(activeItem).toBeInTheDocument();
    expect(activeItem?.textContent).toContain('实例');
  });

  it('should display all navigation icons', () => {
    const onNavigate = () => {};
    const { container } = render(<Sidebar activePage="instances" onNavigate={onNavigate} />);
    
    const navItems = container.querySelectorAll('.nav-item');
    expect(navItems.length).toBe(4);
  });
});
