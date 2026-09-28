import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainStage from './MainStage';

describe('MainStage', () => {
  it('should render all tabs', () => {
    const onTabChange = () => {};
    render(<MainStage activeTab="chat" onTabChange={onTabChange} />);

    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Computer')).toBeInTheDocument();
    expect(screen.getByText('Routines')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Connectors')).toBeInTheDocument();
    expect(screen.getByText('Memory')).toBeInTheDocument();
  });

  it('should display ChatStage when chat tab is active', () => {
    const onTabChange = () => {};
    render(<MainStage activeTab="chat" onTabChange={onTabChange} />);

    const chatStage = document.querySelector('.chat-stage');
    expect(chatStage).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    const onTabChange = () => {};
    render(<MainStage activeTab="chat" onTabChange={onTabChange} />);

    const activeTab = document.querySelector('.tab.active');
    expect(activeTab).toBeInTheDocument();
    expect(activeTab?.textContent).toBe('Chat');
  });
});
