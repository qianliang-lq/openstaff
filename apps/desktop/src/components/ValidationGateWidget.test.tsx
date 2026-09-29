import { describe, it, expect, vi } from 'vitest';
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
    const rejectButton = screen.getByText('驳回');

    expect(approveButton).toBeInTheDocument();
    expect(rejectButton).toBeInTheDocument();
  });

  it('should call onDecision and hide when approve button is clicked', () => {
    const onDecision = vi.fn();
    const { container } = render(<ValidationGateWidget onDecision={onDecision} />);

    const approveButton = screen.getByText('通过');
    fireEvent.click(approveButton);

    // Widget should be hidden after click
    const widget = container.querySelector('.validation-gate-widget');
    expect(widget).not.toBeInTheDocument();

    // onDecision callback should be called with 'approved'
    expect(onDecision).toHaveBeenCalledWith('approved');
  });

  it('should call onDecision and hide when reject button is clicked', () => {
    const onDecision = vi.fn();
    const { container } = render(<ValidationGateWidget onDecision={onDecision} />);

    const rejectButton = screen.getByText('驳回');
    fireEvent.click(rejectButton);

    // Widget should be hidden after click
    const widget = container.querySelector('.validation-gate-widget');
    expect(widget).not.toBeInTheDocument();

    // onDecision callback should be called with 'rejected'
    expect(onDecision).toHaveBeenCalledWith('rejected');
  });
});
