import { useState, useEffect } from 'react';
import {
  isTauriEnvironment,
  getProviderKey,
  saveProviderKey,
  deleteProviderKey,
  getCloudApiKey,
  saveCloudApiKey,
  deleteCloudApiKey,
  getCloudApiBase,
  saveCloudApiBase,
} from '../utils/tauri';
import * as api from '../utils/api';
import './Connectors.css';

interface ProviderConfig {
  provider: 'qwen' | 'glm';
  hasKey: boolean;
  apiKey: string;
  model?: string;
  status: 'empty' | 'saved' | 'testing' | 'error' | 'test-success' | 'test-error';
  error?: string;
  successMessage?: string;
}

interface GitHubConnector {
  status: 'disconnected' | 'connected' | 'error' | 'connecting' | 'testing';
  accountLabel?: string;
  lastCheckedAt?: string;
  token?: string;
  error?: string;
  successMessage?: string;
}

interface CloudApiConfig {
  apiBase: string;
  hasKey: boolean;
  apiKey: string;
  status: 'empty' | 'saved' | 'error' | 'success';
  error?: string;
  successMessage?: string;
}

function Connectors() {
  const [cloudConfig, setCloudConfig] = useState<CloudApiConfig>({
    apiBase: api.getDefaultCloudApiBase(),
    hasKey: false,
    apiKey: '',
    status: 'empty',
  });

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
  const [isTauri, setIsTauri] = useState(false);
  const [githubConnector, setGithubConnector] = useState<GitHubConnector>({
    status: 'disconnected',
  });
  const [githubToken, setGithubToken] = useState('');

  useEffect(() => {
    setIsTauri(isTauriEnvironment());
    loadKeys();
    loadGitHubConnection();
  }, []);

  const loadKeys = async () => {
    try {
      const cloudKey = await getCloudApiKey();
      const savedBase = await getCloudApiBase();

      if (cloudKey) {
        setCloudConfig((prev) => ({
          ...prev,
          hasKey: true,
          apiKey: '',
          status: 'saved',
          apiBase: savedBase || api.getDefaultCloudApiBase(),
        }));
      } else if (savedBase) {
        setCloudConfig((prev) => ({
          ...prev,
          apiBase: savedBase,
        }));
      }

      const qwenKey = await getProviderKey('qwen');
      const glmKey = await getProviderKey('glm');

      if (qwenKey) {
        setQwenConfig((prev) => ({
          ...prev,
          hasKey: true,
          apiKey: '', // Never store plaintext key in display state
          status: 'saved',
        }));
      }

      if (glmKey) {
        setGlmConfig((prev) => ({
          ...prev,
          hasKey: true,
          apiKey: '', // Never store plaintext key in display state
          status: 'saved',
        }));
      }
    } catch (err) {
      console.error('Failed to load keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGitHubConnection = async () => {
    try {
      const token = await getProviderKey('github');
      if (token) {
        setGithubConnector({
          status: 'connected',
          token,
          lastCheckedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to load GitHub connection:', err);
    }
  };

  const handleCloudApiSave = async () => {
    if (!cloudConfig.apiBase.trim()) {
      setCloudConfig((prev) => ({
        ...prev,
        error: 'API Base 不能为空',
        status: 'error',
      }));
      return;
    }

    try {
      await saveCloudApiBase(cloudConfig.apiBase);

      if (cloudConfig.apiKey.trim()) {
        await saveCloudApiKey(cloudConfig.apiKey);
      }

      api.clearApiCache();

      setCloudConfig((prev) => ({
        ...prev,
        hasKey: !!cloudConfig.apiKey.trim() || prev.hasKey,
        apiKey: '',
        status: 'saved',
        error: undefined,
        successMessage: '云 API 配置已保存',
      }));

      setTimeout(() => {
        setCloudConfig((prev) => ({ ...prev, successMessage: undefined }));
      }, 3000);
    } catch (err) {
      console.error('Failed to save cloud API config:', err);
      setCloudConfig((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : '保存失败',
        status: 'error',
      }));
    }
  };

  const handleCloudApiClear = async () => {
    try {
      await deleteCloudApiKey();
      api.clearApiCache();

      setCloudConfig((prev) => ({
        ...prev,
        hasKey: false,
        apiKey: '',
        status: 'empty',
        error: undefined,
      }));
    } catch (err) {
      console.error('Failed to clear cloud API key:', err);
    }
  };

  const handleCloudApiChangeKey = () => {
    setCloudConfig((prev) => ({
      ...prev,
      hasKey: false,
      apiKey: '',
      status: 'empty',
      error: undefined,
    }));
  };

  const handleCloudApiBaseReset = async () => {
    try {
      await saveCloudApiBase(api.getDefaultCloudApiBase());
      api.clearApiCache();

      setCloudConfig((prev) => ({
        ...prev,
        apiBase: api.getDefaultCloudApiBase(),
        successMessage: '已重置为默认云 API Base',
      }));

      setTimeout(() => {
        setCloudConfig((prev) => ({ ...prev, successMessage: undefined }));
      }, 3000);
    } catch (err) {
      console.error('Failed to reset API base:', err);
    }
  };

  const handleCloudApiBaseLocal = async () => {
    try {
      await saveCloudApiBase(api.getDefaultLocalApiBase());
      api.clearApiCache();

      setCloudConfig((prev) => ({
        ...prev,
        apiBase: api.getDefaultLocalApiBase(),
        successMessage: '已切换到本地 API Base',
      }));

      setTimeout(() => {
        setCloudConfig((prev) => ({ ...prev, successMessage: undefined }));
      }, 3000);
    } catch (err) {
      console.error('Failed to switch to local API base:', err);
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
      await saveProviderKey(provider, config.apiKey);

      // Update connector metadata to API (no key plaintext)
      try {
        await api.updateConnectorMeta({
          provider,
          configured: true,
          last_checked_at: new Date().toISOString(),
        });
      } catch (apiError) {
        console.error('Failed to update connector meta:', apiError);
      }

      setConfig((prev) => ({
        ...prev,
        hasKey: true,
        apiKey: '', // Clear plaintext from state after save
        status: 'saved',
        error: undefined,
      }));
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
      await deleteProviderKey(provider);
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

  const handleChangeKey = (provider: 'qwen' | 'glm') => {
    const setConfig = provider === 'qwen' ? setQwenConfig : setGlmConfig;
    setConfig((prev) => ({
      ...prev,
      hasKey: false,
      apiKey: '',
      status: 'empty',
      error: undefined,
    }));
  };

  const handleGitHubConnect = async () => {
    if (!githubToken.trim()) {
      setGithubConnector((prev) => ({
        ...prev,
        error: 'Personal Access Token 不能为空',
        status: 'error',
      }));
      return;
    }

    setGithubConnector((prev) => ({
      ...prev,
      status: 'connecting',
      error: undefined,
      successMessage: undefined,
    }));

    try {
      // Test GitHub API with token
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('GitHub Token 无效或已过期');
      }

      const userData = await response.json();
      await saveProviderKey('github', githubToken);

      setGithubConnector({
        status: 'connected',
        accountLabel: `@${userData.login}`,
        lastCheckedAt: new Date().toISOString(),
        token: githubToken,
        successMessage: `已连接到 GitHub @${userData.login}`,
      });
      setGithubToken('');

      setTimeout(() => {
        setGithubConnector((prev) => ({
          ...prev,
          successMessage: undefined,
        }));
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '连接失败';
      setGithubConnector((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));
    }
  };

  const handleGitHubDisconnect = async () => {
    try {
      await deleteProviderKey('github');
      setGithubConnector({
        status: 'disconnected',
      });
      setGithubToken('');
    } catch (err) {
      console.error('Failed to disconnect GitHub:', err);
    }
  };

  const handleGitHubTest = async () => {
    if (githubConnector.status !== 'connected' || !githubConnector.token) {
      setGithubConnector((prev) => ({
        ...prev,
        error: '请先连接 GitHub',
      }));
      return;
    }

    setGithubConnector((prev) => ({
      ...prev,
      status: 'testing',
      error: undefined,
      successMessage: undefined,
    }));

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${githubConnector.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Token 已失效，请重新连接');
      }

      const userData = await response.json();
      setGithubConnector((prev) => ({
        ...prev,
        status: 'connected',
        accountLabel: `@${userData.login}`,
        lastCheckedAt: new Date().toISOString(),
        successMessage: '测试成功 ✓ GitHub 连接正常',
      }));

      setTimeout(() => {
        setGithubConnector((prev) => ({
          ...prev,
          successMessage: undefined,
        }));
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '测试失败';
      setGithubConnector((prev) => ({
        ...prev,
        status: 'connected',
        error: errorMessage,
      }));
    }
  };

  const handleTestConnection = async (provider: 'qwen' | 'glm') => {
    const config = provider === 'qwen' ? qwenConfig : glmConfig;
    const setConfig = provider === 'qwen' ? setQwenConfig : setGlmConfig;

    // For configured keys, we need to retrieve the actual key for testing
    let testKey = config.apiKey;
    if (config.hasKey && !testKey.trim()) {
      try {
        testKey = (await getProviderKey(provider)) || '';
      } catch (err) {
        setConfig((prev) => ({
          ...prev,
          error: '无法读取已保存的 Key',
          status: 'test-error',
          successMessage: undefined,
        }));
        return;
      }
    }

    if (!testKey.trim()) {
      setConfig((prev) => ({
        ...prev,
        error: '请先填写 API Key',
        status: 'test-error',
        successMessage: undefined,
      }));
      return;
    }

    setConfig((prev) => ({
      ...prev,
      status: 'testing',
      error: undefined,
      successMessage: undefined,
    }));

    try {
      // Test by calling a simple chat request
      const chatRequest: api.ChatRequest = {
        provider,
        messages: [{ role: 'user', content: '测试连接' }],
        stream: false,
      };

      const data = await api.sendChatMessage(chatRequest, testKey);
      const modelName = data.model || config.model || 'qwen-plus';

      // Update connector metadata after successful test
      try {
        await api.updateConnectorMeta({
          provider,
          configured: true,
          last_checked_at: new Date().toISOString(),
          account_label: modelName,
        });
      } catch (apiError) {
        console.error('Failed to update connector meta:', apiError);
      }

      setConfig((prev) => ({
        ...prev,
        status: 'test-success',
        error: undefined,
        successMessage: `连接成功 ✓ 模型: ${modelName}`,
      }));
      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setConfig((prev) => ({
          ...prev,
          status: prev.hasKey ? 'saved' : 'empty',
          successMessage: undefined,
        }));
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '连接测试失败';
      setConfig((prev) => ({
        ...prev,
        error: errorMessage,
        status: 'test-error',
        successMessage: undefined,
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
        ? 'https://bailian.console.aliyun.com/cn-beijing/model/market'
        : 'https://open.bigmodel.cn/';
    const defaultModel = config.provider === 'qwen' ? 'qwen-plus' : 'glm-4-flash';

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
            ) : config.apiKey.trim() ? (
              <span className="status-badge filled">已填写</span>
            ) : (
              <span className="status-badge empty">未填写</span>
            )}
          </div>
        </div>

        <div className="provider-body">
          <div className="form-group">
            <label>API Key</label>
            <input
              type={config.hasKey ? 'password' : 'text'}
              value={config.apiKey}
              onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
              placeholder={config.hasKey ? '已配置（点击「更换」以修改）' : '输入 API Key'}
              disabled={config.hasKey}
            />
          </div>

          <div className="form-group">
            <label>默认模型</label>
            <div className="model-hint">
              {config.provider === 'qwen' ? 'Qwen3.8 系列（API：qwen-plus）' : defaultModel}{' '}
              (可在对话时指定)
            </div>
          </div>

          {config.successMessage && (
            <div
              className="success-message"
              style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '16px',
              }}
            >
              {config.successMessage}
            </div>
          )}

          {config.error && <div className="error-message">{config.error}</div>}

          <div className="provider-actions">
            {!config.hasKey && (
              <>
                <button
                  onClick={() => handleTestConnection(config.provider)}
                  disabled={config.status === 'testing'}
                  className="btn-test"
                >
                  {config.status === 'testing' ? '测试中...' : '测试连接'}
                </button>
                <button
                  onClick={() => handleSave(config.provider)}
                  disabled={config.status === 'testing' || !isTauri}
                  className="btn-save"
                  title={!isTauri ? '保存需要 Tauri 环境。请运行: pnpm tauri:dev' : ''}
                >
                  保存
                </button>
              </>
            )}
            {config.hasKey && (
              <>
                <button
                  onClick={() => handleTestConnection(config.provider)}
                  disabled={config.status === 'testing'}
                  className="btn-test"
                >
                  {config.status === 'testing' ? '测试中...' : '测试连接'}
                </button>
                <button onClick={() => handleChangeKey(config.provider)} className="btn-change">
                  更换
                </button>
                <button
                  onClick={() => handleClear(config.provider)}
                  disabled={!isTauri}
                  className="btn-clear"
                  title={!isTauri ? '清除需要 Tauri 环境。请运行: pnpm tauri:dev' : ''}
                >
                  清除
                </button>
              </>
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
        <h1>连接与密钥</h1>
        <p className="connectors-subtitle">连接 · 鉴权密钥 (Connectors / 实例云鉴权 · 模型推理)</p>
      </div>

      <div className="security-banner">
        <div className="security-icon">🔒</div>
        <div className="security-text">
          <strong>Key 存储在本机安全文件</strong>，永不进入 localStorage 或 git。 出站只经 Gateway
          认证层。请勿在公共设备保存。
        </div>
      </div>

      {!isTauri && (
        <div
          className="warning-banner"
          style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '20px' }}>⚠️</div>
          <div>
            <strong>浏览器预览模式</strong>
            <div style={{ fontSize: '14px', marginTop: '4px', color: '#856404' }}>
              保存/清除功能需要 Tauri 环境。请运行{' '}
              <code
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                }}
              >
                pnpm tauri:dev
              </code>{' '}
              或配置环境变量{' '}
              <code
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                }}
              >
                OPENSTAFF_API_KEY
              </code>
              。
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <h2 className="section-title">SETTINGS</h2>
        <div className="settings-columns">
          <div className="settings-column-left">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              云 API · OpenStaff 实例鉴权
            </h3>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--g7)',
                marginBottom: '1.5rem',
              }}
            >
              连接到 OpenStaff 云端控制面。云 API Key 仅用于写操作鉴权，与模型推理（Slot
              B）独立。Key 存储于 OS Keychain / Tauri secure store，不存明文。
            </p>

            <div className="provider-card">
              <div className="provider-body" style={{ borderTop: 'none', paddingTop: 0 }}>
                <div className="form-group">
                  <label>默认 API Base URL</label>
                  <input
                    type="text"
                    value={cloudConfig.apiBase}
                    onChange={(e) =>
                      setCloudConfig((prev) => ({ ...prev, apiBase: e.target.value }))
                    }
                    placeholder="http://123.57.167.155/openstaff"
                  />
                  <div className="model-hint" style={{ marginTop: '8px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      默认云端: {api.getDefaultCloudApiBase()}
                      <br />
                      本地: {api.getDefaultLocalApiBase()}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleCloudApiBaseReset}
                        disabled={!isTauri}
                        className="btn-test"
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        重置为云端
                      </button>
                      <button
                        onClick={handleCloudApiBaseLocal}
                        disabled={!isTauri}
                        className="btn-test"
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        切换本地
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>OpenStaff API Key</label>
                  <input
                    type={cloudConfig.hasKey ? 'password' : 'text'}
                    value={cloudConfig.apiKey}
                    onChange={(e) =>
                      setCloudConfig((prev) => ({ ...prev, apiKey: e.target.value }))
                    }
                    placeholder={
                      cloudConfig.hasKey ? '已配置（点击「更换」以修改）' : '输入云 API Key'
                    }
                    disabled={cloudConfig.hasKey}
                  />
                  <div className="model-hint" style={{ marginTop: '8px' }}>
                    用于 Agent CRUD / demo fire / peer messages 等写接口。开发环境可用
                    OPENSTAFF_API_KEY 环境变量。
                  </div>
                </div>

                {cloudConfig.successMessage && (
                  <div
                    className="success-message"
                    style={{
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      border: '1px solid #c3e6cb',
                      borderRadius: '4px',
                      padding: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    {cloudConfig.successMessage}
                  </div>
                )}

                {cloudConfig.error && <div className="error-message">{cloudConfig.error}</div>}

                <div className="provider-actions">
                  {!cloudConfig.hasKey ? (
                    <button
                      onClick={handleCloudApiSave}
                      disabled={!isTauri}
                      className="btn-save"
                      title={!isTauri ? '保存需要 Tauri 环境' : ''}
                    >
                      保存
                    </button>
                  ) : (
                    <>
                      <button onClick={handleCloudApiChangeKey} className="btn-change">
                        更换
                      </button>
                      <button
                        onClick={handleCloudApiClear}
                        disabled={!isTauri}
                        className="btn-clear"
                        title={!isTauri ? '清除需要 Tauri 环境' : ''}
                      >
                        清空
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="settings-column-right">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              模型 Connectors
            </h3>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--g7)',
                marginBottom: '1.5rem',
              }}
            >
              用于 LLM 对话，与 Slot A 独立分槽。自带 API Key（BYOK），Gateway 转发不记录明文。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {renderProviderCard(qwenConfig, setQwenConfig)}
              {renderProviderCard(glmConfig, setGlmConfig)}
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">SaaS Connectors</h2>
        <p className="section-desc">连接外部服务，赋予 Agent 访问 GitHub、Slack 等平台的能力。</p>

        <div className="connector-card github-card">
          <div className="connector-header">
            <div className="connector-icon-wrapper">
              <div className="connector-icon github">GH</div>
            </div>
            <div className="connector-info">
              <div className="connector-name">GitHub</div>
              <div className="connector-desc">
                MCP · Issues / PRs / contents · Scope: repo read-org
              </div>
            </div>
            <div className="connector-status">
              {githubConnector.status === 'connected' && (
                <span className="status-badge connected">已连接</span>
              )}
              {githubConnector.status === 'disconnected' && (
                <span className="status-badge disconnected">未连接</span>
              )}
              {githubConnector.status === 'error' && (
                <span className="status-badge error">错误</span>
              )}
              {(githubConnector.status === 'connecting' ||
                githubConnector.status === 'testing') && (
                <span className="status-badge connecting">连接中...</span>
              )}
            </div>
          </div>

          {githubConnector.status === 'connected' && githubConnector.accountLabel && (
            <div className="connector-account">
              <span className="account-label">{githubConnector.accountLabel}</span>
              {githubConnector.lastCheckedAt && (
                <span className="last-checked">
                  最后检查: {new Date(githubConnector.lastCheckedAt).toLocaleString('zh-CN')}
                </span>
              )}
            </div>
          )}

          {githubConnector.status === 'disconnected' && (
            <div className="connector-body">
              <div className="form-group">
                <label>Personal Access Token</label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                />
                <div className="input-hint">
                  需要权限: repo, read:org ·{' '}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    生成 Token
                  </a>
                </div>
              </div>
            </div>
          )}

          {githubConnector.successMessage && (
            <div className="success-message">{githubConnector.successMessage}</div>
          )}

          {githubConnector.error && <div className="error-message">{githubConnector.error}</div>}

          <div className="connector-actions">
            {githubConnector.status === 'disconnected' && (
              <button
                onClick={handleGitHubConnect}
                disabled={!githubToken.trim() || !isTauri}
                className="btn-connect"
                title={!isTauri ? '连接需要 Tauri 环境' : ''}
              >
                连接
              </button>
            )}
            {githubConnector.status === 'connected' && (
              <>
                <button onClick={handleGitHubTest} className="btn-test">
                  测试连接
                </button>
                <button onClick={handleGitHubDisconnect} className="btn-disconnect">
                  断开
                </button>
              </>
            )}
            {githubConnector.status === 'testing' && (
              <button disabled className="btn-test">
                测试中...
              </button>
            )}
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
