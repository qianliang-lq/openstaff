/**
 * Tauri environment detection and safe invoke wrapper
 * Prevents crashes when running in browser preview (port 5173)
 */

import { invoke as tauriInvoke } from '@tauri-apps/api/core';

/**
 * Detect if running inside Tauri shell (not browser preview)
 */
export function isTauriEnvironment(): boolean {
  // Check if window.__TAURI__ exists (set by Tauri runtime)
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Safe wrapper for Tauri invoke
 * Throws error with clear message when not in Tauri environment
 */
export async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriEnvironment()) {
    throw new Error(
      'Tauri 环境未就绪。请在 Tauri 模式下运行：pnpm tauri:dev，或配置环境变量 OPENSTAFF_LLM_API_KEY 后用 just dev-up 启动后端。'
    );
  }

  return tauriInvoke<T>(cmd, args);
}

/**
 * Get provider key safely (returns null if not in Tauri environment)
 */
export async function getProviderKey(provider: string): Promise<string | null> {
  if (!isTauriEnvironment()) {
    return null;
  }

  try {
    return await tauriInvoke<string | null>('get_provider_key', { provider });
  } catch (err) {
    console.error(`Failed to get provider key for ${provider}:`, err);
    return null;
  }
}

/**
 * Save provider key safely
 */
export async function saveProviderKey(provider: string, key: string): Promise<void> {
  if (!isTauriEnvironment()) {
    throw new Error(
      '保存 Key 需要 Tauri 环境。请运行：pnpm tauri:dev\n\n或使用环境变量 OPENSTAFF_LLM_API_KEY 配置后端（仅用于开发）。'
    );
  }

  return tauriInvoke('save_provider_key', { provider, key });
}

/**
 * Delete provider key safely
 */
export async function deleteProviderKey(provider: string): Promise<void> {
  if (!isTauriEnvironment()) {
    throw new Error('删除 Key 需要 Tauri 环境。请运行：pnpm tauri:dev');
  }

  return tauriInvoke('delete_provider_key', { provider });
}
