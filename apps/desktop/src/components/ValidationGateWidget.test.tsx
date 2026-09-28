import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ValidationGateWidget from './ValidationGateWidget';

describe('ValidationGateWidget', () => {
  it('should render validation gate widget', () => {
    render(<ValidationGateWidget />);
    
    expect(screen.getByText('验证闸门 Widget')).toBeInTheDocument();
    expect(screen.getByText('是否具备数据支撑的逻辑闭环？')).toBeInTheDocument();
  });

  it('should display approve and reject buttons', () => {
    render(<ValidationGateWidget />);
    
    const approveButton = screen.getByText('通过');
    const rejectButton = screen.getByText('丢弃');
    
    expect(approveButton).toBeInTheDocument();
    expect(rejectButton).toBeInTheDocument();
  });

  it('should hide widget when approve button is clicked', () => {
    const { container } = render(<ValidationGateWidget />);
    
    const approveButton = screen.getByText('通过');
    fireEvent.click(approveButton);
    
    const widget = container.querySelector('.validation-gate-widget');
    expect(widget).not.toBeInTheDocument();
  });

  it('should hide widget when reject button is clicked', () => {
    const { container } = render(<ValidationGateWidget />);
    
    const rejectButton = screen.getByText('丢弃');
    fireEvent.click(rejectButton);
    
    const widget = container.querySelector('.validation-gate-widget');
    expect(widget).not.toBeInTheDocument();
  });
});
