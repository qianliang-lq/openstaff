import { useState, useEffect } from 'react';
import './Settings.css';

interface LLMConfig {
  provider: 'qwen' | 'glm';
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

function Settings() {
  const [config, setConfig] = useState<LLMConfig>({
    provider: 'qwen',
    apiKey: '',
    baseUrl: '',
    model: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem('llm_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
  }, []);

  const handleSave = () => {
    // TODO: SECURITY - Migrate to Tauri secure storage (NOT localStorage)
    // localStorage is vulnerable to XSS attacks. This is MVP temporary implementation.
    // See TC-059 test contract for secure storage requirement.
    localStorage.setItem('llm_config', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-container">
      <h1>设置</h1>

      <div className="settings-section">
        <h2>LLM 配置</h2>

        <div className="form-group">
          <label htmlFor="provider">Provider</label>
          <select
            id="provider"
            value={config.provider}
            onChange={(e) => setConfig({ ...config, provider: e.target.value as 'qwen' | 'glm' })}
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
          <label htmlFor="baseUrl">Base URL (可选)</label>
          <input
            id="baseUrl"
            type="text"
            value={config.baseUrl}
            onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            placeholder={
              config.provider === 'qwen'
                ? 'https://dashscope.aliyuncs.com/compatible-mode/v1'
                : 'https://open.bigmodel.cn/api/paas/v4'
            }
          />
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

        <button onClick={handleSave} className="save-btn">
          保存配置
        </button>
        {saved && <span className="save-indicator">✓ 已保存</span>}
      </div>

      <div className="settings-section">
        <h2>安全提示</h2>
        <ul className="security-tips">
          <li>API Key 仅存储在本地浏览器中，不会上传到服务器</li>
          <li>请勿在公共电脑上保存 API Key</li>
          <li>建议定期更换 API Key</li>
        </ul>
      </div>
    </div>
  );
}

export default Settings;
