import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './Connectors.css';

interface ProviderConfig {
  provider: 'qwen' | 'glm';
  hasKey: boolean;
  apiKey: string;
  model?: string;
  status: 'empty' | 'saved' | 'testing' | 'error';
  error?: string;
}

function Connectors() {
  const [qwenConfig, setQwenConfig] = useState<ProviderConfig>({
    provider: 'qwen',
    hasKey: false,
    apiKey: '',
    status: 'empty',
  });

  const [glmConfig, setGlmConfig] = useState<ProviderConfig>({
    provider: 'glm',
    hasKey: false,
    apiKey: '',
    status: 'empty',
  });

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

      if (qwenKey) {
        setQwenConfig((prev) => ({
          ...prev,
          hasKey: true,
          apiKey: qwenKey,
          status: 'saved',
        }));
      }

      if (glmKey) {
        setGlmConfig((prev) => ({
          ...prev,
          hasKey: true,
          apiKey: glmKey,
          status: 'saved',
        }));
      }
    } catch (err) {
      console.error('Failed to load keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (provider: 'qwen' | 'glm') => {
    const config = provider === 'qwen' ? qwenConfig : glmConfig;
    const setConfig = provider === 'qwen' ? setQwenConfig : setGlmConfig;

    if (!config.apiKey.trim()) {
      setConfig((prev) => ({ ...prev, error: 'API Key 不能为空', status: 'error' }));
      return;
    }

    try {
      await invoke('save_provider_key', {
        provider,
        key: config.apiKey,
      });

      setConfig((prev) => ({ ...prev, hasKey: true, status: 'saved', error: undefined }));
      setTimeout(() => {
        setConfig((prev) => ({ ...prev, status: 'saved' }));
      }, 2000);
    } catch (err) {
      console.error('Failed to save key:', err);
      setConfig((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : '保存失败',
        status: 'error',
      }));
    }
  };

  const handleClear = async (provider: 'qwen' | 'glm') => {
    const setConfig = provider === 'qwen' ? setQwenConfig : setGlmConfig;

    try {
      await invoke('delete_provider_key', { provider });
      setConfig({
        provider,
        hasKey: false,
        apiKey: '',
        status: 'empty',
        error: undefined,
      });
    } catch (err) {
      console.error('Failed to delete key:', err);
    }
  };

  const handleTestConnection = async (provider: 'qwen' | 'glm') => {
    const config = provider === 'qwen' ? qwenConfig : glmConfig;
    const setConfig = provider === 'qwen' ? setQwenConfig : setGlmConfig;

    if (!config.hasKey && !config.apiKey.trim()) {
      setConfig((prev) => ({ ...prev, error: '请先填写 API Key', status: 'error' }));
      return;
    }

    setConfig((prev) => ({ ...prev, status: 'testing', error: undefined }));

    try {
      // Test by calling a simple chat request
      const response = await fetch('http://localhost:3000/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OpenStaff-Provider-Key': config.apiKey,
        },
        body: JSON.stringify({
          provider,
          messages: [{ role: 'user', content: '测试连接' }],
          stream: false,
        }),
      });

      if (response.ok) {
        setConfig((prev) => ({ ...prev, status: 'saved', error: undefined }));
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (err) {
      setConfig((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : '连接测试失败',
        status: 'error',
      }));
    }
  };

  const renderProviderCard = (
    config: ProviderConfig,
    setConfig: React.Dispatch<React.SetStateAction<ProviderConfig>>
  ) => {
    const providerName = config.provider === 'qwen' ? '通义千问 / Qwen' : '智谱 GLM';
    const providerUrl =
      config.provider === 'qwen'
        ? 'https://dashscope.console.aliyun.com/'
        : 'https://open.bigmodel.cn/';
    const defaultModel = config.provider === 'qwen' ? 'qwen-turbo' : 'glm-4-flash';

    return (
      <div className="provider-card">
        <div className="provider-header">
          <div className="provider-icon">{config.provider === 'qwen' ? 'Q' : 'G'}</div>
          <div className="provider-info">
            <div className="provider-name">{providerName}</div>
            <div className="provider-url">
              <a href={providerUrl} target="_blank" rel="noopener noreferrer">
                {providerUrl}
              </a>
            </div>
          </div>
          <div className="provider-status">
            {config.hasKey ? (
              <span className="status-badge saved">已配置</span>
            ) : (
              <span className="status-badge empty">未填写</span>
            )}
          </div>
        </div>

        <div className="provider-body">
          <div className="form-group">
            <label>API Key</label>
            <input
              type={config.hasKey && !config.apiKey.startsWith('sk-') ? 'password' : 'text'}
              value={
                config.hasKey && !config.apiKey.startsWith('sk-')
                  ? '••••••••••••••••'
                  : config.apiKey
              }
              onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
              placeholder="输入 API Key"
              disabled={config.hasKey && !config.apiKey.startsWith('sk-')}
            />
          </div>

          <div className="form-group">
            <label>默认模型</label>
            <div className="model-hint">{defaultModel} (可在对话时指定)</div>
          </div>

          {config.error && <div className="error-message">{config.error}</div>}

          <div className="provider-actions">
            <button
              onClick={() => handleTestConnection(config.provider)}
              disabled={config.status === 'testing'}
              className="btn-test"
            >
              {config.status === 'testing' ? '测试中...' : '测试连接'}
            </button>
            <button
              onClick={() => handleSave(config.provider)}
              disabled={config.status === 'testing'}
              className="btn-save"
            >
              保存
            </button>
            {config.hasKey && (
              <button onClick={() => handleClear(config.provider)} className="btn-clear">
                清除
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="connectors-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="connectors-container">
      <div className="connectors-header">
        <h1>Connectors</h1>
        <p className="connectors-subtitle">模型 Key (BYOK) · MCP / OAuth 连接</p>
      </div>

      <div className="security-banner">
        <div className="security-icon">🔒</div>
        <div className="security-text">
          <strong>Key 存储在本机安全文件</strong>，永不进入 localStorage 或 git。 出站只经 Gateway
          认证层。请勿在公共设备保存。
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">模型 API Key (BYOK)</h2>
        <p className="section-desc">
          本地存储 + Gateway 无日志转发。支持通义千问 (DashScope OpenAI 兼容) 与智谱 AI (GLM API)。
        </p>

        <div className="providers-grid">
          {renderProviderCard(qwenConfig, setQwenConfig)}
          {renderProviderCard(glmConfig, setGlmConfig)}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">其他连接 (stub)</h2>
        <div className="other-connectors">
          <div className="connector-stub">
            <div className="connector-icon">GH</div>
            <span>GitHub</span>
            <span className="coming-soon">敬请期待</span>
          </div>
          <div className="connector-stub">
            <div className="connector-icon">SL</div>
            <span>Slack</span>
            <span className="coming-soon">敬请期待</span>
          </div>
          <div className="connector-stub">
            <div className="connector-icon">DB</div>
            <span>内部数仓</span>
            <span className="coming-soon">敬请期待</span>
          </div>
        </div>
      </div>

      <div className="connectors-footer">
        <p className="tip">
          💡 Tip: Gateway 审计仅记录 provider/model/latency/tokens，不记录 Key 或完整 messages。
        </p>
      </div>
    </div>
  );
}

export default Connectors;
