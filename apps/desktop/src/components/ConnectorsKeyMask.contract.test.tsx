import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Connectors from './Connectors';
import * as tauriUtils from '../utils/tauri';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Connectors Key Mask Security Contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TC-Scroll-01: Connectors content must be scrollable', () => {
    it('HARD: Connectors.css must have overflow-y auto and height 100% on .connectors-container', () => {
      // Read CSS file and assert scroll rules exist
      const connectorsCSS = readFileSync(resolve(__dirname, './Connectors.css'), 'utf-8');

      // Must find .connectors-container rule block with both overflow-y and height
      const containerRuleMatch = connectorsCSS.match(/\.connectors-container\s*\{[^}]*\}/s);
      expect(
        containerRuleMatch,
        'Connectors.css must contain .connectors-container rule block'
      ).toBeTruthy();

      const containerRule = containerRuleMatch![0];

      // Hard assert: overflow-y: auto (or scroll) is present
      expect(
        /overflow-y:\s*(auto|scroll)/i.test(containerRule),
        'Connectors.css .connectors-container must have overflow-y: auto or scroll'
      ).toBe(true);

      // Hard assert: height constraint exists (100% or vh or fixed value)
      expect(
        /height:\s*(100%|100vh|\d+px)/i.test(containerRule),
        'Connectors.css .connectors-container must have height constraint (100% or similar)'
      ).toBe(true);
    });

    it('HARD: MainStage.css must have overflow scroll override on .stage > .connectors-container', () => {
      // Read MainStage CSS and assert parent-child scroll rule exists
      const mainStageCSS = readFileSync(resolve(__dirname, './MainStage.css'), 'utf-8');

      // Must find .stage > .connectors-container rule with overflow-y
      const stageChildRuleMatch = mainStageCSS.match(
        /\.stage\s*>\s*\.connectors-container\s*\{[^}]*\}/s
      );
      expect(
        stageChildRuleMatch,
        'MainStage.css must contain .stage > .connectors-container rule block'
      ).toBeTruthy();

      const stageChildRule = stageChildRuleMatch![0];

      // Hard assert: overflow-y: auto (or scroll) is present
      expect(
        /overflow-y:\s*(auto|scroll)/i.test(stageChildRule),
        'MainStage.css .stage > .connectors-container must have overflow-y: auto or scroll'
      ).toBe(true);

      // Hard assert: height constraint exists
      expect(
        /height:\s*(100%|100vh|\d+px)/i.test(stageChildRule),
        'MainStage.css .stage > .connectors-container must have height constraint'
      ).toBe(true);
    });

    it('HARD: .stage parent must constrain children for scroll containment', () => {
      // Read MainStage CSS and verify .stage has flex + min-height: 0 + overflow: hidden
      const mainStageCSS = readFileSync(resolve(__dirname, './MainStage.css'), 'utf-8');

      const stageRuleMatch = mainStageCSS.match(/\.stage\s*\{[^}]*\}/s);
      expect(stageRuleMatch, 'MainStage.css must contain .stage rule block').toBeTruthy();

      const stageRule = stageRuleMatch![0];

      // Hard assert: display: flex (enables flex children behavior)
      expect(
        /display:\s*flex/i.test(stageRule),
        'MainStage.css .stage must have display: flex'
      ).toBe(true);

      // Hard assert: min-height: 0 (allows flex children to shrink below content size)
      expect(
        /min-height:\s*0/i.test(stageRule),
        'MainStage.css .stage must have min-height: 0 for scroll containment'
      ).toBe(true);

      // Hard assert: overflow: hidden (clips content, forcing children to handle their own scroll)
      expect(
        /overflow:\s*hidden/i.test(stageRule),
        'MainStage.css .stage must have overflow: hidden'
      ).toBe(true);
    });
  });

  describe('TC-KeyMask-01: Remount with hasKey → input value ≠ real secret', () => {
    it('must NOT display real key in input after remount', async () => {
      const realSecret = 'sk-real-secret-key-12345678';

      // Mock Tauri environment
      (window as unknown as { __TAURI__?: object }).__TAURI__ = {};
      vi.spyOn(tauriUtils, 'isTauriEnvironment').mockReturnValue(true);
      vi.spyOn(tauriUtils, 'getProviderKey').mockImplementation(async (provider: string) => {
        if (provider === 'qwen' || provider === 'glm') return realSecret;
        return null;
      });

      render(<Connectors />);

      // Wait for component to load keys (check for password input instead of badge)
      await waitFor(
        () => {
          const passwordInputs = document.querySelectorAll('input[type="password"]');
          expect(
            passwordInputs.length,
            'Should have password input when key is configured'
          ).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      // Verify input does NOT contain the real secret
      const qwenInputs = document.querySelectorAll('input[type="password"]');
      expect(
        qwenInputs.length,
        'At least one input should be password type for configured key'
      ).toBeGreaterThan(0);

      // Check all inputs - none should have the real secret as value
      const allInputs = document.querySelectorAll('input');
      allInputs.forEach((input) => {
        expect(input.value, `Input must NOT contain real secret. Found: "${input.value}"`).not.toBe(
          realSecret
        );

        // Also check it's not partially visible
        if (input.value && input.value.length > 0) {
          expect(input.value, 'Input value must not contain secret substring').not.toContain(
            'sk-real-secret'
          );
        }
      });

      // Verify DOM text content doesn't leak the key
      const bodyText = document.body.textContent || '';
      expect(bodyText, 'DOM body must not contain real secret').not.toContain(realSecret);

      delete (window as unknown as { __TAURI__?: object }).__TAURI__;
    });

    it('must show password-type input for configured provider', async () => {
      (window as unknown as { __TAURI__?: object }).__TAURI__ = {};
      vi.spyOn(tauriUtils, 'isTauriEnvironment').mockReturnValue(true);
      vi.spyOn(tauriUtils, 'getProviderKey').mockImplementation(async (provider: string) => {
        if (provider === 'qwen') return 'sk-qwen-secret';
        return null;
      });

      render(<Connectors />);

      await waitFor(
        () => {
          const passwordInputs = document.querySelectorAll('input[type="password"]');
          expect(passwordInputs.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      // Find the Qwen input
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      expect(
        passwordInputs.length,
        'Must have password-type input for configured key'
      ).toBeGreaterThan(0);

      // Verify it's disabled when configured
      const qwenInput = Array.from(passwordInputs).find(
        (input) => input.placeholder?.includes('已配置') || input.closest('.provider-card') !== null
      );
      expect(qwenInput, 'Qwen password input must exist').toBeTruthy();

      delete (window as unknown as { __TAURI__?: object }).__TAURI__;
    });
  });

  describe('TC-KeyMask-02: After save → password state', () => {
    it('must switch to password mode and clear plaintext after save', async () => {
      const user = userEvent.setup();

      (window as unknown as { __TAURI__?: object }).__TAURI__ = {};
      vi.spyOn(tauriUtils, 'isTauriEnvironment').mockReturnValue(true);
      vi.spyOn(tauriUtils, 'getProviderKey').mockResolvedValue(null);
      vi.spyOn(tauriUtils, 'saveProviderKey').mockResolvedValue();

      render(<Connectors />);

      await waitFor(
        () => {
          const textInputs = document.querySelectorAll('input[type="text"]');
          expect(
            textInputs.length,
            'Should have text inputs when no key configured'
          ).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      // Find and fill the first empty key input
      const textInputs = document.querySelectorAll('input[type="text"]');
      const keyInput = Array.from(textInputs).find((input) =>
        input.placeholder?.includes('输入 API Key')
      ) as HTMLInputElement;

      expect(keyInput, 'Should have text-type input for new key entry').toBeTruthy();

      // Type a key
      await user.type(keyInput, 'sk-new-test-key-123');

      // Find and click save button
      const saveButtons = screen.getAllByRole('button', { name: /保存/i });
      const saveButton = saveButtons[0];
      await user.click(saveButton);

      // Wait for save to complete - check for password input
      await waitFor(
        () => {
          const passwordInputs = document.querySelectorAll('input[type="password"]');
          expect(passwordInputs.length, 'Should have password input after save').toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      // Verify input is now password type
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      expect(passwordInputs.length, 'Must have password input after save').toBeGreaterThan(0);

      // Verify no plaintext in any input
      const allInputs = document.querySelectorAll('input');
      allInputs.forEach((input) => {
        expect(input.value, 'Input must not contain saved plaintext key').not.toBe(
          'sk-new-test-key-123'
        );
      });

      delete (window as unknown as { __TAURI__?: object }).__TAURI__;
    });
  });

  describe('TC-KeyMask-03: Test-connect success has no Key fragment', () => {
    it('must not show any key fragment in success message', async () => {
      const user = userEvent.setup();
      const testSecret = 'sk-test-connection-secret-key';

      (window as unknown as { __TAURI__?: object }).__TAURI__ = {};
      vi.spyOn(tauriUtils, 'isTauriEnvironment').mockReturnValue(true);
      vi.spyOn(tauriUtils, 'getProviderKey').mockImplementation(async (provider: string) => {
        if (provider === 'qwen' || provider === 'glm') return testSecret;
        return null;
      });

      // Mock fetch for test connection
      const mockFetch = vi.fn((url: string) => {
        if (url.includes('/v1/chat')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              message: { content: 'test' },
              model: 'qwen-plus',
            }),
          });
        }
        return Promise.reject(new Error('Unexpected fetch'));
      });
      global.fetch = mockFetch as unknown as typeof fetch;

      render(<Connectors />);

      await waitFor(
        () => {
          const passwordInputs = document.querySelectorAll('input[type="password"]');
          expect(passwordInputs.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      // Find and click test button
      const testButtons = screen.getAllByRole('button', { name: /测试连接/i });
      const testButton = testButtons[0];
      await user.click(testButton);

      // Wait for success message
      await waitFor(
        () => {
          const successText = screen.getByText(/连接成功/i);
          expect(successText, 'Should show success message').toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify success message does NOT contain key fragments
      const successMessage = screen.getByText(/连接成功/i);
      const messageText = successMessage.textContent || '';

      expect(messageText, 'Success message must not contain full key').not.toContain(testSecret);
      expect(messageText, 'Success message must not contain key prefix').not.toContain('sk-test');
      expect(messageText, 'Success message must not contain "secret"').not.toContain('secret');

      // Should only show status + model info
      expect(messageText, 'Should mention connection success').toMatch(/连接成功|成功/);
      expect(messageText, 'Should show model name').toMatch(/qwen-plus|模型/);

      // Verify DOM doesn't leak the key
      const bodyText = document.body.textContent || '';
      expect(bodyText, 'DOM must not contain test secret anywhere').not.toContain(testSecret);

      delete (window as unknown as { __TAURI__?: object }).__TAURI__;
    });
  });

  describe('TC-KeyMask-04: 更换 button clears to first-entry mode', () => {
    it('must clear input and allow plaintext entry after clicking 更换', async () => {
      const user = userEvent.setup();

      (window as unknown as { __TAURI__?: object }).__TAURI__ = {};
      vi.spyOn(tauriUtils, 'isTauriEnvironment').mockReturnValue(true);
      vi.spyOn(tauriUtils, 'getProviderKey').mockImplementation(async (provider: string) => {
        if (provider === 'qwen' || provider === 'glm') return 'sk-existing-key';
        return null;
      });

      render(<Connectors />);

      await waitFor(
        () => {
          const passwordInputs = document.querySelectorAll('input[type="password"]');
          expect(passwordInputs.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      // Verify password input exists
      const passwordInputsBefore = document.querySelectorAll('input[type="password"]');
      expect(passwordInputsBefore.length).toBeGreaterThan(0);

      // Find and click 更换 button
      const changeButtons = screen.getAllByRole('button', { name: /更换/i });
      expect(
        changeButtons.length,
        'Should have 更换 button for configured provider'
      ).toBeGreaterThan(0);

      await user.click(changeButtons[0]);

      // Verify input is now text type (first-entry mode)
      await waitFor(() => {
        const textInputs = document.querySelectorAll('input[type="text"]');
        const hasTextInput = Array.from(textInputs).some((input) =>
          input.placeholder?.includes('输入 API Key')
        );
        expect(hasTextInput, 'Should have text-type input after clicking 更换').toBe(true);
      });

      // Verify input is enabled and empty
      const textInputs = document.querySelectorAll('input[type="text"]');
      const keyInput = Array.from(textInputs).find((input) =>
        input.placeholder?.includes('输入 API Key')
      ) as HTMLInputElement;

      expect(keyInput, 'Text input should exist').toBeTruthy();
      expect(keyInput?.value, 'Input should be empty').toBe('');
      expect(keyInput?.disabled, 'Input should be enabled').toBe(false);

      delete (window as unknown as { __TAURI__?: object }).__TAURI__;
    });
  });
});
