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
    const rejectButton = screen.getByText('驳回');

    expect(approveButton).toBeInTheDocument();
    expect(rejectButton).toBeInTheDocument();
  });

  it('should show result bubble when approve button is clicked', () => {
    const { container } = render(<ValidationGateWidget />);

    const approveButton = screen.getByText('通过');
    fireEvent.click(approveButton);

    // Widget should be replaced by result bubble
    const widget = container.querySelector('.validation-gate-widget');
    expect(widget).not.toBeInTheDocument();

    // Result bubble should appear
    const bubble = container.querySelector('.gate-result-bubble');
    expect(bubble).toBeInTheDocument();
    expect(bubble?.textContent).toContain('已通过验证');
  });

  it('should show result bubble when reject button is clicked', () => {
    const { container } = render(<ValidationGateWidget />);

    const rejectButton = screen.getByText('驳回');
    fireEvent.click(rejectButton);

    // Widget should be replaced by result bubble
    const widget = container.querySelector('.validation-gate-widget');
    expect(widget).not.toBeInTheDocument();

    // Result bubble should appear
    const bubble = container.querySelector('.gate-result-bubble');
    expect(bubble).toBeInTheDocument();
    expect(bubble?.textContent).toContain('已驳回操作');
  });
});
