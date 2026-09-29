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
      expect(packageJson.scripts).toHaveProperty(scriptName, 
        `beforeDevCommand references "${scriptName}" but it doesn't exist in package.json scripts. ` +
        `Available scripts: ${Object.keys(packageJson.scripts).join(', ')}`
      );
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
      expect(packageJson.scripts).toHaveProperty(scriptName,
        `beforeBuildCommand references "${scriptName}" but it doesn't exist in package.json scripts. ` +
        `Available scripts: ${Object.keys(packageJson.scripts).join(', ')}`
      );
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
      expect(vitePort).toBe(devUrlPort,
        `Vite port (${vitePort}) doesn't match Tauri devUrl port (${devUrlPort})`
      );
      
      // Check for strictPort: true
      const hasStrictPort = viteConfigContent.includes('strictPort: true') || 
                           viteConfigContent.includes('strictPort:true');
      
      expect(hasStrictPort).toBe(true,
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
      const hasDecorationsDisabled = windows.some((w: any) => w.decorations === false);
      
      // Read Titlebar.tsx to check if it renders a title
      const titlebarPath = resolve(__dirname, 'components/Titlebar.tsx');
      const titlebarContent = readFileSync(titlebarPath, 'utf-8');
      
      // Check if Titlebar renders the product name "OpenStaff"
      const rendersTitleText = titlebarContent.includes('OpenStaff') ||
                              titlebarContent.includes('titlebar-title');
      
      // Read App.tsx to check if Titlebar is mounted
      const appPath = resolve(__dirname, 'App.tsx');
      const appContent = readFileSync(appPath, 'utf-8');
      const mountsTitlebar = appContent.includes('<Titlebar');
      
      // Contract: If Titlebar is mounted and renders product name, decorations MUST be false
      if (mountsTitlebar && rendersTitleText) {
        expect(hasDecorationsDisabled).toBe(true,
          'App mounts Titlebar component that renders "OpenStaff", but tauri.conf.json window ' +
          'does not set "decorations: false". This creates double title bar chrome: ' +
          'native macOS title bar showing "OpenStaff" PLUS in-app Titlebar also showing "OpenStaff". ' +
          'Fix: Either (A) set "decorations: false" in tauri.conf.json windows config, ' +
          'OR (B) remove product title from Titlebar.tsx to avoid duplication.'
        );
      }
      
      // Alternative contract: If decorations are true, Titlebar should not render duplicate title
      if (!hasDecorationsDisabled && mountsTitlebar && rendersTitleText) {
        // This will fail with the message above
        expect.fail(
          'Double title bar detected: native decorations are enabled (default) AND ' +
          'Titlebar.tsx renders product name. Choose one approach.'
        );
      }
    });
  });
});
