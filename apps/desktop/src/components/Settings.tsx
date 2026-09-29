import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './Settings.css';

interface LLMConfig {
  provider: 'qwen' | 'glm';
  apiKey: string;
  model?: string;
}

function Settings() {
  const [config, setConfig] = useState<LLMConfig>({
    provider: 'qwen',
    apiKey: '',
    model: '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const qwenKey = (await invoke('get_provider_key', {
        provider: 'qwen',
      })) as string | null;
      const glmKey = (await invoke('get_provider_key', {
        provider: 'glm',
      })) as string | null;

      // Load first available key
      if (qwenKey) {
        setConfig((prev) => ({ ...prev, provider: 'qwen', apiKey: qwenKey }));
      } else if (glmKey) {
        setConfig((prev) => ({ ...prev, provider: 'glm', apiKey: glmKey }));
      }
    } catch (err) {
      console.error('Failed to load keys:', err);
      setError('Failed to load saved keys');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = async (newProvider: 'qwen' | 'glm') => {
    setConfig((prev) => ({ ...prev, provider: newProvider }));

    // Load key for new provider
    try {
      const key = (await invoke('get_provider_key', {
        provider: newProvider,
      })) as string | null;
      setConfig((prev) => ({ ...prev, apiKey: key || '' }));
    } catch (err) {
      console.error('Failed to load key:', err);
    }
  };

  const handleSave = async () => {
    if (!config.apiKey.trim()) {
      setError('API Key cannot be empty');
      return;
    }

    try {
      await invoke('save_provider_key', {
        provider: config.provider,
        key: config.apiKey,
      });

      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save key:', err);
      setError(err instanceof Error ? err.message : 'Failed to save key');
    }
  };

  const handleClear = async () => {
    try {
      await invoke('delete_provider_key', {
        provider: config.provider,
      });

      setConfig((prev) => ({ ...prev, apiKey: '' }));
      setError(null);
    } catch (err) {
      console.error('Failed to delete key:', err);
      setError('Failed to delete key');
    }
  };

  if (loading) {
    return (
      <div className="settings-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <h1>设置</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="settings-section">
        <h2>LLM 配置</h2>

        <div className="form-group">
          <label htmlFor="provider">Provider</label>
          <select
            id="provider"
            value={config.provider}
            onChange={(e) => handleProviderChange(e.target.value as 'qwen' | 'glm')}
          >
            <option value="qwen">Qwen (阿里通义千问)</option>
            <option value="glm">GLM (智谱 AI)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="apiKey">API Key *</label>
          <input
            id="apiKey"
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            placeholder="输入您的 API Key"
          />
          <small className="help-text">
            {config.provider === 'qwen'
              ? '从 https://dashscope.console.aliyun.com/ 获取'
              : '从 https://open.bigmodel.cn/ 获取'}
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="model">Model (可选)</label>
          <input
            id="model"
            type="text"
            value={config.model}
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
            placeholder={config.provider === 'qwen' ? 'qwen-turbo' : 'glm-4-flash'}
          />
        </div>

        <div className="button-group">
          <button onClick={handleSave} className="save-btn">
            保存配置
          </button>
          <button onClick={handleClear} className="clear-btn">
            清除密钥
          </button>
        </div>
        {saved && <span className="save-indicator">✓ 已保存</span>}
      </div>

      <div className="settings-section">
        <h2>安全提示</h2>
        <ul className="security-tips">
          <li>API Key 加密存储在应用数据目录中</li>
          <li>密钥文件权限为 600 (仅当前用户可读)</li>
          <li>密钥不会上传到 OpenStaff 服务器</li>
          <li>请勿在公共电脑上保存 API Key</li>
          <li>建议定期更换 API Key</li>
        </ul>
      </div>
    </div>
  );
}

export default Settings;
