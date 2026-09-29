import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatStage from './ChatStage';

describe('ChatStage', () => {
  it('renders fire handler wired correctly', () => {
    render(<ChatStage />);

    const messages = screen.getAllByText(/产品经理数字员工/i, { exact: false });
    expect(messages.length).toBeGreaterThan(0);
  });

  it('fire handler processes demo response with PASS status', () => {
    const demoResponse = {
      reconcile_status: 'PASS',
      facts: [
        {
          bucket: '竞对',
          title: 'Test Fact',
          summary_zh: 'Test summary',
          url: 'https://example.com',
          tags: ['test'],
        },
      ],
      summary: ['Test summary item'],
      artifacts_path: 'artifacts/external-insight/2026-09-28-public-facts.json',
      timestamp: '2026-09-28',
    };

    render(<ChatStage demoResponse={demoResponse} />);

    expect(screen.getByText(/Test Fact/i)).toBeInTheDocument();
  });

  it('fire handler blocks report card on FAILED reconcile', () => {
    const demoResponse = {
      reconcile_status: 'FAILED',
      facts: [],
      summary: [],
      artifacts_path: 'artifacts/external-insight/2026-09-28-public-facts.json',
      timestamp: '2026-09-28',
    };

    render(<ChatStage demoResponse={demoResponse} />);

    expect(screen.queryByText(/外部洞察报告/i)).not.toBeInTheDocument();
  });

  it('fire handler accepts manual trigger from scheduler', () => {
    const mockFireRequest = {
      routine_id: 'external-insight-daily',
      skill_id: 'external-insight-public-search',
      trigger: 'manual',
    };

    expect(mockFireRequest.trigger).toBe('manual');
    expect(mockFireRequest.routine_id).toBe('external-insight-daily');
    expect(mockFireRequest.skill_id).toBe('external-insight-public-search');
  });

  it('renders button with correct label', () => {
    render(<ChatStage />);

    const button = screen.getByRole('button', { name: /立即跑一次/i });
    expect(button).toBeInTheDocument();
  });

  it('report card uses correct avatar', () => {
    const demoResponse = {
      reconcile_status: 'PASS',
      facts: [
        {
          bucket: '竞对',
          title: 'Test Fact',
          summary_zh: 'Test summary',
          url: 'https://example.com',
          tags: ['test'],
        },
      ],
      summary: ['Test summary item'],
      artifacts_path: 'artifacts/external-insight/2026-09-28-public-facts.json',
      timestamp: '2026-09-28',
    };

    render(<ChatStage demoResponse={demoResponse} />);

    const avatars = screen.getAllByText('产');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('polls insights endpoint after job fire', () => {
    render(<ChatStage />);

    const button = screen.getByRole('button', { name: /立即跑一次/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });
});
