/**
 * TC-076, TC-077, TC-078: App-mode First-Boot Contract Tests
 *
 * These tests validate that Tauri app mode configuration is correct:
 * - TC-076: beforeDev/beforeBuild scripts exist in package.json
 * - TC-077: devUrl port aligns with Vite strict port
 * - TC-078: Single chrome (no duplicate title bars)
 *
 * NOTE: These tests are EXPECTED to FAIL on current tip (before encoding fixes land).
 * They document the contract that encoding must satisfy.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('App Mode Contract Tests', () => {
  describe('TC-076: beforeDev/beforeBuild Scripts Exist', () => {
    it('should have beforeDevCommand script in package.json', () => {
      // Read tauri.conf.json
      const tauriConfPath = resolve(__dirname, '../src-tauri/tauri.conf.json');
      const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));

      // Extract script name from beforeDevCommand
      const beforeDevCommand = tauriConf.build.beforeDevCommand;
      expect(beforeDevCommand).toBeDefined();

      // Extract script name after "pnpm "
      const scriptNameMatch = beforeDevCommand.match(/pnpm\s+([^\s]+)/);
      expect(scriptNameMatch).toBeTruthy();
      const scriptName = scriptNameMatch![1];

      // Read package.json
      const packageJsonPath = resolve(__dirname, '../package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Assert script exists
      expect(packageJson.scripts).toHaveProperty(scriptName);
      expect(packageJson.scripts[scriptName]).toBeDefined();
    });

    it('should have beforeBuildCommand script in package.json', () => {
      // Read tauri.conf.json
      const tauriConfPath = resolve(__dirname, '../src-tauri/tauri.conf.json');
      const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));

      // Extract script name from beforeBuildCommand
      const beforeBuildCommand = tauriConf.build.beforeBuildCommand;
      expect(beforeBuildCommand).toBeDefined();

      // Extract script name after "pnpm "
      const scriptNameMatch = beforeBuildCommand.match(/pnpm\s+([^\s]+)/);
      expect(scriptNameMatch).toBeTruthy();
      const scriptName = scriptNameMatch![1];

      // Read package.json
      const packageJsonPath = resolve(__dirname, '../package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Assert script exists
      expect(packageJson.scripts).toHaveProperty(scriptName);
      expect(packageJson.scripts[scriptName]).toBeDefined();
    });
  });

  describe('TC-077: devUrl Port Aligns with Vite Strict Port', () => {
    it('should have vite config with strictPort: true and matching port', () => {
      // Read tauri.conf.json
      const tauriConfPath = resolve(__dirname, '../src-tauri/tauri.conf.json');
      const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));

      // Extract port from devUrl
      const devUrl = tauriConf.build.devUrl;
      expect(devUrl).toBeDefined();

      const urlMatch = devUrl.match(/:(\d+)/);
      expect(urlMatch).toBeTruthy();
      const devUrlPort = parseInt(urlMatch![1], 10);

      // Read vite.config.ts (as text since it's TypeScript)
      const viteConfigPath = resolve(__dirname, '../vite.config.ts');
      const viteConfigContent = readFileSync(viteConfigPath, 'utf-8');

      // Check for port configuration
      const portMatch = viteConfigContent.match(/port:\s*(\d+)/);
      expect(portMatch).toBeTruthy();
      const vitePort = parseInt(portMatch![1], 10);

      // Assert ports match
      expect(vitePort).toBe(
        devUrlPort,
        `Vite port (${vitePort}) doesn't match Tauri devUrl port (${devUrlPort})`
      );

      // Check for strictPort: true
      const hasStrictPort =
        viteConfigContent.includes('strictPort: true') ||
        viteConfigContent.includes('strictPort:true');

      expect(hasStrictPort).toBe(
        true,
        'Vite config must have "strictPort: true" to prevent fallback to port 5174 when 5173 is in use. ' +
          'Add "strictPort: true," in the server config section.'
      );
    });
  });

  describe('TC-078: Single Chrome (No Duplicate Title Bars)', () => {
    it('should have either decorations:false + Titlebar OR decorations:true + no title in Titlebar', () => {
      // Read tauri.conf.json
      const tauriConfPath = resolve(__dirname, '../src-tauri/tauri.conf.json');
      const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));

      // Check if decorations is set to false in any window config
      const windows = tauriConf.app?.windows || [];
      const hasDecorationsDisabled = windows.some(
        (w: Record<string, unknown>) => w.decorations === false
      );

      // Check if Titlebar.tsx exists
      const titlebarPath = resolve(__dirname, 'components/Titlebar.tsx');
      let titlebarExists = false;
      let rendersTitleText = false;

      try {
        const titlebarContent = readFileSync(titlebarPath, 'utf-8');
        titlebarExists = true;

        // Check if Titlebar renders the product name "OpenStaff"
        rendersTitleText =
          titlebarContent.includes('OpenStaff') || titlebarContent.includes('titlebar-title');
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'code' in e && e.code !== 'ENOENT') throw e;
        // File doesn't exist - this is acceptable (one way to fix double title bar)
      }

      // Check if App.tsx mounts Titlebar (only if Titlebar exists)
      let mountsTitlebar = false;
      if (titlebarExists) {
        const appPath = resolve(__dirname, 'App.tsx');
        const appContent = readFileSync(appPath, 'utf-8');
        mountsTitlebar = appContent.includes('<Titlebar');
      }

      // Contract: If Titlebar is mounted and renders product name, decorations MUST be false
      // OR: If Titlebar doesn't exist, that's a valid fix (no duplicate title)
      if (mountsTitlebar && rendersTitleText) {
        expect(hasDecorationsDisabled).toBe(true);
      }
      // If Titlebar doesn't exist or doesn't render title, test passes (issue is resolved)
      else {
        // No double title bar issue - pass
        expect(true).toBe(true);
      }
    });
  });
});
