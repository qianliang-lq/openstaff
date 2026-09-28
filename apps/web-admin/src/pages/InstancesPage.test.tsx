import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InstancesPage from './InstancesPage';

describe('InstancesPage', () => {
  it('should render instances page', () => {
    const { container } = render(<InstancesPage />);
    
    expect(screen.getByText('实例')).toBeInTheDocument();
    
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
  });

  it('should display table headers', () => {
    const { container } = render(<InstancesPage />);
    
    const headers = container.querySelectorAll('th');
    expect(headers.length).toBeGreaterThan(5);
    
    expect(screen.getByText('instance_id')).toBeInTheDocument();
    expect(screen.getByText('Agent / 岗位')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('节点')).toBeInTheDocument();
    expect(screen.getByText('digest')).toBeInTheDocument();
  });

  it('should render multiple instance rows', () => {
    const { container } = render(<InstancesPage />);
    
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('should display instance statuses', () => {
    render(<InstancesPage />);
    
    expect(screen.getAllByText('Ready').length).toBeGreaterThan(0);
  });

  it('should display search and filter controls', () => {
    const { container } = render(<InstancesPage />);
    
    const toolbar = container.querySelector('.toolbar');
    expect(toolbar).toBeTruthy();
    
    const searchText = screen.getByText('按 instance_id / Agent / 租户');
    expect(searchText).toBeInTheDocument();
  });
});
