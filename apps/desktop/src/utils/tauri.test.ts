/**
 * Tests for Tauri environment detection and safe invoke wrapper
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isTauriEnvironment, safeInvoke } from './tauri';

describe('Tauri Utils', () => {
  beforeEach(() => {
    // Clean up window.__TAURI__ before each test
    vi.unstubAllGlobals();
  });

  describe('isTauriEnvironment', () => {
    it('should return false when __TAURI__ is not defined', () => {
      expect(isTauriEnvironment()).toBe(false);
    });

    it('should return true when __TAURI__ is defined', () => {
      vi.stubGlobal('__TAURI__', {});
      expect(isTauriEnvironment()).toBe(true);
    });
  });

  describe('safeInvoke', () => {
    it('should throw error when not in Tauri environment', async () => {
      await expect(safeInvoke('test_command')).rejects.toThrow('Tauri 环境未就绪');
    });

    it('should throw error message with clear instructions', async () => {
      await expect(safeInvoke('test_command')).rejects.toThrow('pnpm tauri:dev');
      await expect(safeInvoke('test_command')).rejects.toThrow('OPENSTAFF_LLM_API_KEY');
    });
  });
});
