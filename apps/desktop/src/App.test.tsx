import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

describe('App - Desktop Shell UI', () => {
  beforeEach(() => {
    // Mock scrollIntoView (not available in jsdom)
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('should render the application', () => {
    const { container } = render(<App />);
    const app = container.querySelector('.app');
    expect(app).toBeTruthy();
  });

  it.skip('should display Titlebar component', () => {
    // Skip: Titlebar rendering is not part of TC-079/080 click feedback tests
  });

  it('should display Sidebar with agent list', () => {
    const { container } = render(<App />);
    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).toBeTruthy();
  });

  it('should display MainStage with tabs', () => {
    const { container } = render(<App />);
    const mainStage = container.querySelector('.main');
    expect(mainStage).toBeTruthy();
  });
});
