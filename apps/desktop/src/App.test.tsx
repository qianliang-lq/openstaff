import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App - Desktop Shell UI', () => {
  it('should render the application', () => {
    const { container } = render(<App />);
    const app = container.querySelector('.app');
    expect(app).toBeTruthy();
  });

  it('should display Titlebar component', () => {
    const { container } = render(<App />);
    const titlebar = container.querySelector('.titlebar');
    expect(titlebar).toBeTruthy();
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
