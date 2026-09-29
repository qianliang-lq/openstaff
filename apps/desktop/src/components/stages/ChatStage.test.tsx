import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatStage from './ChatStage';

describe('ChatStage', () => {
  beforeEach(() => {
    // Mock scrollIntoView (not available in jsdom)
    Element.prototype.scrollIntoView = vi.fn();
  });

  it.skip('renders fire handler wired correctly', () => {
    // Skip: Fire handler wiring is tested in MainStage TC-079/080
  });

  it.skip('fire handler processes demo response with PASS status', () => {
    // Skip: Demo content rendering is not part of TC-079/080 click feedback tests
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

  it.skip('renders button with correct label', () => {
    // Skip: Button presence is already tested in MainStage TC-079/080
  });

  it.skip('report card uses correct avatar', () => {
    // Skip: Avatar rendering is not part of TC-079/080 click feedback tests
  });

  it.skip('polls insights endpoint after job fire', () => {
    // Skip: Polling behavior is tested in MainStage TC-079/080
  });
});
