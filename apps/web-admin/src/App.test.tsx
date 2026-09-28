import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App - Web Admin Shell UI', () => {
  it('should render the application', () => {
    render(<App />);
    const app = document.querySelector('.app');
    expect(app).toBeInTheDocument();
  });

  it('should display Topbar component', () => {
    render(<App />);
    const topbar = document.querySelector('.topbar');
    expect(topbar).toBeInTheDocument();
  });

  it('should display Sidebar with navigation', () => {
    render(<App />);
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar).toBeInTheDocument();
  });

  it('should display InstancesPage by default', () => {
    render(<App />);
    const instancesPage = document.querySelector('.instances-page');
    expect(instancesPage).toBeInTheDocument();
  });
});
