import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Connectors from './Connectors';
import * as tauriUtils from '../utils/tauri';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock Tauri utils
vi.mock('../utils/tauri', async () => {
  const actual = await vi.importActual<typeof import('../utils/tauri')>('../utils/tauri');
  return {
    ...actual,
    isTauriEnvironment: vi.fn(),
    getProviderKey: vi.fn(),
    saveProviderKey: vi.fn(),
    deleteProviderKey: vi.fn(),
  };
});

describe('Connectors - TC-063+ Tests', () => {
  const mockIsTauriEnvironment = vi.mocked(tauriUtils.isTauriEnvironment);
  const mockGetProviderKey = vi.mocked(tauriUtils.getProviderKey);
  const mockSaveProviderKey = vi.mocked(tauriUtils.saveProviderKey);
  const mockDeleteProviderKey = vi.mocked(tauriUtils.deleteProviderKey);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: simulate Tauri environment
    mockIsTauriEnvironment.mockReturnValue(true);
    mockGetProviderKey.mockResolvedValue(null);
    mockSaveProviderKey.mockResolvedValue(undefined);
    mockDeleteProviderKey.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TC-063: Tauri Availability Guard', () => {
    it('should use tauri helper functions for all invoke operations', () => {
      // Read Connectors.tsx source to verify it uses helper functions
      const sourceFile = join(__dirname, 'Connectors.tsx');
      const source = readFileSync(sourceFile, 'utf-8');

      // Verify imports from utils/tauri
      expect(source).toContain('import {');
      expect(source).toContain("from '../utils/tauri'");

      // Verify usage of helper functions (not direct invoke)
      expect(source).toContain('isTauriEnvironment');
      expect(source).toContain('getProviderKey');
      expect(source).toContain('saveProviderKey');
      expect(source).toContain('deleteProviderKey');

      // Should NOT use direct invoke from @tauri-apps/api/core
      expect(source).not.toContain("from '@tauri-apps/api/core'");
    });

    it('should check Tauri availability before save operations', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText('输入 API Key');
      const user = userEvent.setup();
      await user.type(inputs[0], 'sk-test-key');

      const saveButtons = screen.getAllByText('保存');
      await user.click(saveButtons[0]);

      // Verify saveProviderKey was called (which internally checks Tauri)
      await waitFor(() => {
        expect(mockSaveProviderKey).toHaveBeenCalledWith('qwen', 'sk-test-key');
      });
    });

    it('should handle non-Tauri environment gracefully', async () => {
      // Simulate browser preview mode
      mockIsTauriEnvironment.mockReturnValue(false);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Save button should be disabled
      const saveButtons = screen.getAllByText('保存');
      expect(saveButtons[0]).toBeDisabled();
      expect(saveButtons[1]).toBeDisabled();

      // Should show warning banner (tested in TC-064)
    });
  });

  describe('TC-064: Non-Tauri UI Guidance', () => {
    it('should show warning banner when not in Tauri environment', async () => {
      mockIsTauriEnvironment.mockReturnValue(false);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Check for warning banner
      expect(screen.getByText('浏览器预览模式')).toBeInTheDocument();
    });

    it('should show guidance about pnpm tauri:dev', async () => {
      mockIsTauriEnvironment.mockReturnValue(false);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Check for pnpm tauri:dev guidance
      expect(screen.getByText('pnpm tauri:dev')).toBeInTheDocument();
    });

    it('should show guidance about OPENSTAFF_LLM_API_KEY', async () => {
      mockIsTauriEnvironment.mockReturnValue(false);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Check for environment variable guidance
      expect(screen.getByText('OPENSTAFF_LLM_API_KEY')).toBeInTheDocument();
    });

    it('should disable save buttons when not in Tauri environment', async () => {
      mockIsTauriEnvironment.mockReturnValue(false);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const saveButtons = screen.getAllByText('保存');

      // All save buttons should be disabled
      saveButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should disable clear buttons when not in Tauri environment', async () => {
      mockIsTauriEnvironment.mockReturnValue(false);
      // Simulate having keys configured
      mockGetProviderKey.mockImplementation(async (provider) => {
        return provider === 'qwen' ? 'sk-mock-key' : null;
      });

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const clearButtons = screen.getAllByText('清除');

      // Clear button should be disabled
      clearButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should NOT show warning banner in Tauri environment', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Warning banner should NOT be present
      expect(screen.queryByText('浏览器预览模式')).not.toBeInTheDocument();
    });

    it('should enable save buttons in Tauri environment', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const saveButtons = screen.getAllByText('保存');

      // Save buttons should be enabled
      saveButtons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('TC-065: No localStorage for Keys', () => {
    it('should NOT use localStorage.setItem for API keys', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);
      mockSaveProviderKey.mockResolvedValue(undefined);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText('输入 API Key');
      const user = userEvent.setup();
      await user.type(inputs[0], 'sk-test-key-should-not-go-to-localstorage');

      const saveButtons = screen.getAllByText('保存');
      await user.click(saveButtons[0]);

      await waitFor(() => {
        expect(mockSaveProviderKey).toHaveBeenCalled();
      });

      // CRITICAL: localStorage must NEVER be used for keys
      const keyPatterns = [/key/i, /token/i, /secret/i, /api/i, /qwen/i, /glm/i];

      setItemSpy.mock.calls.forEach((call) => {
        const [key, value] = call;
        const isKeyRelated = keyPatterns.some(
          (pattern) => pattern.test(key) || (typeof value === 'string' && pattern.test(value))
        );

        // FAIL immediately if any key-related data goes to localStorage
        expect(isKeyRelated).toBe(false);
      });

      setItemSpy.mockRestore();
    });

    it('should NOT use localStorage.getItem for API keys', async () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Check that localStorage.getItem is not called for keys
      const keyPatterns = [/key/i, /token/i, /secret/i, /api/i, /qwen/i, /glm/i];

      getItemSpy.mock.calls.forEach((call) => {
        const [key] = call;
        const isKeyRelated = keyPatterns.some((pattern) => pattern.test(key));

        // FAIL if localStorage.getItem is used for keys
        expect(isKeyRelated).toBe(false);
      });

      getItemSpy.mockRestore();
    });

    it('should use Tauri helper functions for key storage operations', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Verify getProviderKey was called during load
      expect(mockGetProviderKey).toHaveBeenCalled();

      // Test saving
      const inputs = screen.getAllByPlaceholderText('输入 API Key');
      const user = userEvent.setup();
      await user.type(inputs[0], 'sk-test-key');

      const saveButtons = screen.getAllByText('保存');
      await user.click(saveButtons[0]);

      // Verify saveProviderKey is called
      await waitFor(() => {
        expect(mockSaveProviderKey).toHaveBeenCalledWith('qwen', 'sk-test-key');
      });

      // PASS: Keys are stored via Tauri helper functions, not localStorage
    });

    it('should verify source does not contain localStorage key operations', () => {
      // Read Connectors.tsx source
      const sourceFile = join(__dirname, 'Connectors.tsx');
      const source = readFileSync(sourceFile, 'utf-8');

      // Check for localStorage usage patterns that would store keys
      const hasLocalStorageSetItem = source.includes('localStorage.setItem');
      const hasLocalStorageGetItem = source.includes('localStorage.getItem');

      // Should NOT use localStorage for any operations
      // (Connectors uses Tauri helper functions exclusively)
      expect(hasLocalStorageSetItem).toBe(false);
      expect(hasLocalStorageGetItem).toBe(false);
    });
  });

  describe('Security Banner', () => {
    it('should display security notice about local storage', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Security banner should explain storage mechanism
      expect(screen.getByText(/Key 存储在本机安全文件/i)).toBeInTheDocument();
      expect(screen.getByText(/永不进入 localStorage/i)).toBeInTheDocument();
    });
  });

  describe('Display Copy (c9453ea)', () => {
    it('should display "Qwen3.8 系列（API：qwen-plus）" for Qwen default model', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Check for complete display copy (per c9453ea)
      expect(screen.getByText(/Qwen3\.8 系列（API：qwen-plus）/)).toBeInTheDocument();
    });

    it('should mention "百炼" (Bailian) in section description', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Check for "百炼" (not "DashScope")
      expect(screen.getByText(/百炼/)).toBeInTheDocument();
      expect(screen.getByText(/百炼 OpenAI 兼容/)).toBeInTheDocument();
    });

    it('should link to Bailian console for Qwen', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Check for Bailian console link
      const bailianLink = screen.getByText(/bailian\.console\.aliyun\.com/i);
      expect(bailianLink).toBeInTheDocument();
      expect(bailianLink.closest('a')).toHaveAttribute(
        'href',
        expect.stringContaining('bailian.console.aliyun.com')
      );
    });

    it('should display glm-4-flash as default model for GLM provider', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Check for GLM default model
      expect(screen.getByText(/glm-4-flash/)).toBeInTheDocument();
    });
  });

  describe('TC-066+: Test Connection Visible Feedback (Real UI)', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn<typeof global.fetch>>;

    beforeEach(() => {
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('TC-066: should show visible success feedback with model name after successful test', async () => {
      // Mock successful API response with model in response
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl_test123',
          provider: 'qwen',
          model: 'qwen-max',
          message: {
            role: 'assistant',
            content: '测试连接成功',
          },
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
          },
        }),
      } as Response);

      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Fill in API key
      const inputs = screen.getAllByPlaceholderText('输入 API Key');
      const user = userEvent.setup();
      await user.type(inputs[0], 'sk-test-key-success');

      // Click test connection button
      const testButtons = screen.getAllByText('测试连接');
      await user.click(testButtons[0]);

      // CRITICAL: Must show visible success feedback matching REAL UI
      // Success message format: "连接成功 ✓ 模型: {modelName}"
      await waitFor(() => {
        expect(screen.getByText(/连接成功 ✓ 模型: qwen-max/)).toBeInTheDocument();
      });

      // Verify success message has correct class
      const successMessage = screen.getByText(/连接成功 ✓ 模型:/);
      expect(successMessage).toHaveClass('success-message');

      // No error should be visible
      expect(screen.queryByText(/错误|失败/)).not.toBeInTheDocument();
    });

    it('TC-067: should show visible success feedback with fallback model when not in response', async () => {
      // Mock successful API response WITHOUT model field
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl_test456',
          provider: 'qwen',
          // No model field - should fall back to qwen-plus
          message: {
            role: 'assistant',
            content: '测试连接成功',
          },
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
          },
        }),
      } as Response);

      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText('输入 API Key');
      const user = userEvent.setup();
      await user.type(inputs[0], 'sk-test-key');

      const testButtons = screen.getAllByText('测试连接');
      await user.click(testButtons[0]);

      // Should show success with fallback model qwen-plus
      await waitFor(() => {
        expect(screen.getByText(/连接成功 ✓ 模型: qwen-plus/)).toBeInTheDocument();
      });

      const successMessage = screen.getByText(/连接成功 ✓ 模型:/);
      expect(successMessage).toHaveClass('success-message');
    });

    it('TC-068: should show visible error feedback after network error', async () => {
      // Mock network error
      fetchSpy.mockRejectedValueOnce(new Error('Network request failed'));

      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText('输入 API Key');
      const user = userEvent.setup();
      await user.type(inputs[0], 'sk-test-key-fail');

      const testButtons = screen.getAllByText('测试连接');
      await user.click(testButtons[0]);

      // CRITICAL: Must show visible error feedback (NOT silent failure)
      await waitFor(() => {
        expect(screen.getByText(/Network request failed/)).toBeInTheDocument();
      });

      // Verify error message has correct class
      const errorMessage = screen.getByText(/Network request failed/);
      expect(errorMessage).toHaveClass('error-message');
    });

    it('TC-069: should show visible error feedback with HTTP status after 401', async () => {
      // Mock 401 error response
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Missing provider API key',
          code: 'auth_required',
        }),
      } as Response);

      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText('输入 API Key');
      const user = userEvent.setup();
      await user.type(inputs[0], 'sk-invalid-key');

      const testButtons = screen.getAllByText('测试连接');
      await user.click(testButtons[0]);

      // CRITICAL: Must show visible error with reason
      await waitFor(() => {
        expect(screen.getByText(/Missing provider API key/)).toBeInTheDocument();
      });

      const errorMessage = screen.getByText(/Missing provider API key/);
      expect(errorMessage).toHaveClass('error-message');
    });

    it('TC-070: should show visible error feedback when API key is empty', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Do NOT fill in API key, just click test connection
      const testButtons = screen.getAllByText('测试连接');
      const user = userEvent.setup();
      await user.click(testButtons[0]);

      // CRITICAL: Must show visible error feedback immediately
      await waitFor(() => {
        expect(screen.getByText('请先填写 API Key')).toBeInTheDocument();
      });

      const errorMessage = screen.getByText('请先填写 API Key');
      expect(errorMessage).toHaveClass('error-message');
    });

    it('TC-071: should show visible error feedback when JSON parsing fails', async () => {
      // Mock 500 error without valid JSON body
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText('输入 API Key');
      const user = userEvent.setup();
      await user.type(inputs[0], 'sk-test');

      const testButtons = screen.getAllByText('测试连接');
      await user.click(testButtons[0]);

      // When JSON parsing fails, should show "Unknown error"
      await waitFor(() => {
        expect(screen.getByText('Unknown error')).toBeInTheDocument();
      });

      const errorMessage = screen.getByText('Unknown error');
      expect(errorMessage).toHaveClass('error-message');
    });

    it('TC-072: should call fetch with correct parameters', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl_test',
          provider: 'qwen',
          model: 'qwen-plus',
          message: { role: 'assistant', content: 'ok' },
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
      } as Response);

      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText('输入 API Key');
      const user = userEvent.setup();
      await user.type(inputs[0], 'sk-test-key-12345');

      const testButtons = screen.getAllByText('测试连接');
      await user.click(testButtons[0]);

      // Verify fetch was called with correct endpoint and headers
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          'http://localhost:3000/v1/chat',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'X-OpenStaff-Provider-Key': 'sk-test-key-12345',
            }),
          })
        );
      });
    });
  });

  describe('TC-073+: Badge Status Display (Bonus)', () => {
    it('TC-073: should show "未填写" badge when input is empty', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Badge should show "未填写" for empty state
      const badges = screen.getAllByText('未填写');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('TC-074: should show "已填写" badge when input has content but not saved', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      mockGetProviderKey.mockResolvedValue(null);

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Type in API key (not saved yet)
      const inputs = screen.getAllByPlaceholderText('输入 API Key');
      const user = userEvent.setup();
      await user.type(inputs[0], 'sk-test-key');

      // Badge should change to "已填写"
      await waitFor(() => {
        expect(screen.getByText('已填写')).toBeInTheDocument();
      });
    });

    it('TC-075: should show "已配置" badge when key is saved', async () => {
      mockIsTauriEnvironment.mockReturnValue(true);
      // Mock that qwen has a saved key
      mockGetProviderKey.mockImplementation(async (provider) => {
        return provider === 'qwen' ? 'sk-saved-key' : null;
      });

      render(<Connectors />);

      await waitFor(() => {
        expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
      });

      // Badge should show "已配置" for saved key
      const badges = screen.getAllByText('已配置');
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});
