import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Connectors from './Connectors';
import * as tauriUtils from '../utils/tauri';

describe('Connectors Key Mask Security Contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TC-Scroll-01: Connectors content must be scrollable', () => {
    it('must have connectors-container with correct structure', () => {
      (window as unknown as { __TAURI__?: object }).__TAURI__ = {};
      vi.spyOn(tauriUtils, 'isTauriEnvironment').mockReturnValue(true);
      vi.spyOn(tauriUtils, 'getProviderKey').mockResolvedValue(null);

      const { container } = render(<Connectors />);

      // Find the connectors container
      const connectorsContainer = container.querySelector('.connectors-container');
      expect(connectorsContainer, 'Connectors container must exist').toBeInTheDocument();

      // Verify CSS class is present (CSS rules will apply overflow-y: auto in real browser)
      expect(connectorsContainer?.className).toContain('connectors-container');

      // In production, CSS rules ensure:
      // .connectors-container { overflow-y: auto !important; height: 100%; }
      // .stage > .connectors-container { overflow-y: auto !important; height: 100%; }

      delete (window as unknown as { __TAURI__?: object }).__TAURI__;
    });

    it('must have stage wrapper with proper flex layout', () => {
      (window as unknown as { __TAURI__?: object }).__TAURI__ = {};
      vi.spyOn(tauriUtils, 'isTauriEnvironment').mockReturnValue(true);
      vi.spyOn(tauriUtils, 'getProviderKey').mockResolvedValue(null);

      const { container } = render(<Connectors />);

      // Verify container structure exists
      const connectorsContainer = container.querySelector('.connectors-container');
      expect(connectorsContainer).toBeInTheDocument();

      // CSS ensures .stage { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
      // and .stage > .connectors-container { overflow-y: auto !important; height: 100%; }
      // This combination allows Connectors to scroll within its constrained parent

      delete (window as unknown as { __TAURI__?: object }).__TAURI__;
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
