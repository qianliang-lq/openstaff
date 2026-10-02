import { useEffect, useState, useRef } from 'react';
import { getProviderKey } from '../../utils/tauri';
import ValidationGateWidget from '../ValidationGateWidget';
import ExternalInsightReportCard, { type ExternalInsightFact } from '../ExternalInsightReportCard';
import * as api from '../../utils/api';
import './ChatStage.css';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  error?: boolean;
  errorType?: '401' | '403' | 'network' | 'unknown' | '400' | '500';
  gateDecision?: 'approved' | 'rejected' | 'revised';
  validationGate?: {
    status: 'pending' | 'approved' | 'rejected' | 'revised';
    prompt?: string;
  };
}

interface DemoResponse {
  job_status?: string;
  reconcile_status: string;
  facts?: ExternalInsightFact[];
  summary?: string[];
  artifacts_path: string;
  timestamp: string;
}

interface ChatStageProps {
  demoResponse?: DemoResponse | null;
  agentName?: string;
  onNavigateToConnectors?: () => void;
  hasAgent?: boolean;
}

const mockFacts: ExternalInsightFact[] = [
  {
    bucket: '竞对',
    title:
      'Factory CLI v0.228.0 / Desktop v0.185.0 — /migrate + mid-message skills + in-place compress/handoff',
    summary_zh:
      'Factory 于 9/26 发布 CLI v0.228.0 / Desktop v0.185.0：新增 /migrate 工作流，把大改动从约定计划推进到可验证结果，迁移进行中时可在文件面板查看计划与验证文档；技能可在消息任意位置补全高亮（不再限于句首）；/compress 就地压缩当前会话，/handoff 开启仅摘要的后继会话。',
    url: 'https://docs.factory.ai/changelog/release-notes.md',
    tags: ['TOP互联网/AI公司'],
  },
  {
    bucket: '组织提效',
    title: 'GitHub Copilot enterprise managed settings in-product validator',
    summary_zh:
      'GitHub 9/25：为企业托管 Copilot 设置上线产品内校验器，可检测 malformed JSON、不支持的配置、无效团队映射等会导致策略无法生效的问题；在企业 AI controls 页「Copilot settings validation」中按文件与 JSON path 指出问题。',
    url: 'https://github.blog/changelog/2026-09-25-enterprise-managed-settings-in-product-validator/',
    tags: ['TOP互联网/AI公司'],
  },
  {
    bucket: '前沿模型',
    title: 'iCoder-27B (arXiv:2609.29626) — recursive AI-led industrial coding model',
    summary_zh:
      'arXiv:2609.29626（上交 / NUS / DP Technology 等）：以「高密度先验、低频介入」研究技能把专家 SOP 固化后，由 Codex GPT-5.6-Sol 代理主导 Data→SFT→OPSD→RLVR，从 Qwen3.6-27B 训出工业编码模型 iCoder-27B（RTL/GPU kernel）。',
    url: 'https://arxiv.org/abs/2609.29626',
    tags: ['学术研究', '期刊论文', 'TOP学校'],
    pdf_url: 'https://arxiv.org/pdf/2609.29626.pdf',
  },
];

function ChatStage({
  demoResponse,
  agentName = '产品经理数字员工',
  onNavigateToConnectors,
  hasAgent = true,
}: ChatStageProps) {
  const [displayedFacts, setDisplayedFacts] = useState<ExternalInsightFact[]>(mockFacts);
  const [reconcileStatus, setReconcileStatus] = useState<'PASS' | 'FAILED'>('PASS');
  const [displayDate, setDisplayDate] = useState('2026-09-27');
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMockContent, setShowMockContent] = useState(false);
  const [hasAnyKey, setHasAnyKey] = useState<boolean | null>(null);
  const [lastError, setLastError] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [selectedPeerAgent, setSelectedPeerAgent] = useState<string | null>(null);
  const [allAgents, setAllAgents] = useState<api.Agent[]>([]);
  const [peerSuccessToast, setPeerSuccessToast] = useState<string | null>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkKeys();
    loadMessagesFromApi();
    loadAllAgents();
  }, [agentName]);

  const loadAllAgents = async () => {
    try {
      const agents = await api.listAgents();
      setAllAgents(agents);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadMessagesFromApi = async () => {
    if (!agentName || !hasAgent) return;

    try {
      const agents = await api.listAgents();
      const currentAgent = agents.find((a) => a.name === agentName);
      if (!currentAgent) return;

      const apiMessages = await api.listMessages(currentAgent.id);
      const mappedMessages: ChatMessage[] = apiMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.peer_agent_id ? `[@岗间消息 from ${m.peer_agent_id}] ${m.body}` : m.body,
      }));
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Failed to load messages from API:', error);
    }
  };

  useEffect(() => {
    if (demoResponse && demoResponse.reconcile_status === 'PASS' && demoResponse.facts) {
      setDisplayedFacts(demoResponse.facts);
      setReconcileStatus('PASS');
      setDisplayDate(demoResponse.timestamp || '2026-09-27');
      setIsRunning(false);
    } else if (
      demoResponse &&
      (demoResponse.reconcile_status === 'FAILED' ||
        demoResponse.job_status === 'error' ||
        demoResponse.job_status === 'not_found')
    ) {
      setReconcileStatus('FAILED');
      setIsRunning(false);
    }
  }, [demoResponse]);

  const checkKeys = async () => {
    try {
      const qwenKey = await getProviderKey('qwen');
      const glmKey = await getProviderKey('glm');

      setHasAnyKey(!!(qwenKey || glmKey));
    } catch (err) {
      console.error('Failed to check keys:', err);
      setHasAnyKey(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !hasAnyKey) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setLastError(null);

    // Check if this is a peer message (@ selected agent)
    if (selectedPeerAgent) {
      try {
        const agents = await api.listAgents();
        const currentAgent = agents.find((a) => a.name === agentName);
        const peerAgent = agents.find((a) => a.id === selectedPeerAgent);

        if (!currentAgent) {
          throw new Error('找不到当前岗位');
        }

        // Send peer message
        await api.sendPeerMessage(currentAgent.id, selectedPeerAgent, messageContent);

        // Show success toast (独立生命周期，不被 reload 冲掉)
        const successText = `✅ 已投递给 ${peerAgent?.name || selectedPeerAgent}`;
        setPeerSuccessToast(successText);
        setTimeout(() => setPeerSuccessToast(null), 3000);

        // Clear selection
        setSelectedPeerAgent(null);
        setShowAgentPicker(false);

        // Reload messages (不影响 toast)
        await loadMessagesFromApi();
      } catch (error) {
        console.error('Peer message error:', error);
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: '发送岗间消息失败',
          error: true,
          errorType: 'unknown',
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Normal chat flow (with LLM)
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageContent,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      let providerKey: string | null = null;
      let provider = 'qwen';

      try {
        providerKey = await getProviderKey('qwen');

        if (!providerKey) {
          providerKey = await getProviderKey('glm');
          if (providerKey) {
            provider = 'glm';
          }
        }
      } catch (err) {
        console.error('Failed to get provider key:', err);
      }

      if (!providerKey) {
        throw new Error('401:未配置 Key');
      }

      const systemPrompt: api.ChatMessage = {
        role: 'system',
        content: `你是${agentName}，请帮助用户完成工作任务。`,
      };

      const chatRequest: api.ChatRequest = {
        provider,
        messages: [systemPrompt, ...messages.filter((m) => !m.error), userMessage],
        stream: false,
      };

      const data = await api.sendChatMessage(chatRequest, providerKey);

      // Persist messages to API after successful chat
      try {
        const agents = await api.listAgents();
        const currentAgent = agents.find((a) => a.name === agentName);
        if (currentAgent) {
          await api.createMessage(currentAgent.id, {
            role: 'user',
            body: userMessage.content,
          });
        }
      } catch (apiError) {
        console.error('Failed to persist user message:', apiError);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);

      let errorContent: string;
      let errorType: '401' | '403' | 'network' | 'unknown' | '400' | '500' = 'unknown';

      if (error instanceof api.ApiError) {
        errorContent = error.message;
        if (error.status === 401) {
          errorType = '401';
        } else if (error.status === 403) {
          errorType = '403';
        } else if (error.status >= 500) {
          errorType = '500';
        } else if (error.status >= 400) {
          errorType = '400';
        } else if (error.status === 0) {
          errorType = 'network';
        }
      } else if (error instanceof Error) {
        errorContent = error.message;
        if (error.message.includes('401')) {
          errorType = '401';
        } else if (error.message.includes('403')) {
          errorType = '403';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorType = 'network';
        }
      } else {
        errorContent = '发送消息失败';
      }

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: errorContent,
        error: true,
        errorType,
      };

      setLastError(errorMessage);
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAgentPicker = () => {
    setShowAgentPicker(!showAgentPicker);
  };

  const handleSelectPeerAgent = (agentId: string) => {
    setSelectedPeerAgent(agentId);
    setShowAgentPicker(false);
  };

  const handleRetry = () => {
    if (lastError) {
      // Remove error message and retry
      setMessages((prev) => prev.filter((m) => m !== lastError));
      setLastError(null);

      // Retry last user message
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user' && !m.error);
      if (lastUserMessage) {
        setInputValue(lastUserMessage.content);
        // User can click send again
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && hasAnyKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFireJob = async () => {
    setIsRunning(true);
    setLastError(null);
    setReconcileStatus('PASS'); // Reset status

    // Add user feedback message
    const runningMessage: ChatMessage = {
      role: 'assistant',
      content: '⏳ 运行中...正在执行外部洞察搜索任务',
    };
    setMessages((prev) => [...prev, runningMessage]);

    try {
      // Fire demo job via unified API client (follows cloud base + Bearer)
      await api.fireDemoJob({
        routine_id: 'external-insight-daily',
        skill_id: 'external-insight-public-search',
        trigger: 'manual',
      });

      // Remove running message before polling
      setMessages((prev) => prev.filter((m) => m !== runningMessage));
      pollInsights();
    } catch (error) {
      console.error('Error firing job:', error);

      // Remove running message
      setMessages((prev) => prev.filter((m) => m !== runningMessage));

      let errorContent: string;
      let errorType: '401' | 'network' | 'unknown' | '400' | '500' = 'network';

      if (error instanceof api.ApiError) {
        if (error.status === 401) {
          errorContent = `❌ ${error.message}`;
          errorType = '401';
        } else if (error.status === 0) {
          errorContent =
            '❌ 无法连接到控制面服务。请确保后端服务已启动或云 API 配置正确：\n\n• 本地开发：运行 `pnpm tauri:dev` 或 `just dev-up`\n• 云端连接：检查 Settings → 云 API 配置\n• 检查服务状态：`just health`';
          errorType = 'network';
        } else {
          errorContent = `❌ ${error.message}`;
          if (error.status >= 500) {
            errorType = '500';
          } else if (error.status >= 400) {
            errorType = '400';
          }
        }
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorContent =
          '❌ 无法连接到控制面服务。请确保后端服务已启动或云 API 配置正确：\n\n• 本地开发：运行 `pnpm tauri:dev` 或 `just dev-up`\n• 云端连接：检查 Settings → 云 API 配置\n• 检查服务状态：`just health`';
        errorType = 'network';
      } else if (error instanceof Error) {
        errorContent = `❌ ${error.message}`;
      } else {
        errorContent = '❌ 运行失败，请查看控制台日志';
      }

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: errorContent,
        error: true,
        errorType,
      };
      setLastError(errorMessage);
      setMessages((prev) => [...prev, errorMessage]);
      setIsRunning(false);
    }
  };

  const pollInsights = async () => {
    const maxAttempts = 10;
    const pollInterval = 1000;
    let foundResult = false;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const data = await api.getLatestInsight();

        if (data.reconcile_status === 'PASS' && data.facts && data.facts.length > 0) {
          setDisplayedFacts(data.facts as unknown as ExternalInsightFact[]);
          setReconcileStatus('PASS');
          setDisplayDate((data as { timestamp?: string }).timestamp || '2026-09-27');

          const successMessage: ChatMessage = {
            role: 'assistant',
            content: `✅ 运行成功！已生成 ${data.facts.length} 条外部洞察`,
          };
          setMessages((prev) => [...prev, successMessage]);
          setIsRunning(false);
          foundResult = true;
          return;
        } else if (data.reconcile_status === 'FAILED') {
          setReconcileStatus('FAILED');

          const failureMessage: ChatMessage = {
            role: 'assistant',
            content: '❌ 任务完成但未通过审核 (reconcile_status: FAILED)',
            error: true,
            errorType: 'unknown',
          };
          setMessages((prev) => [...prev, failureMessage]);
          setLastError(failureMessage);
          setIsRunning(false);
          foundResult = true;
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling insights:', error);

        if (i === maxAttempts - 1) {
          setIsRunning(false);
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: `❌ 运行超时 (${maxAttempts}s)。任务已触发但结果未及时生成。\n\n可能原因：\n• Runtime 仍在处理（查看日志）\n• Gateway 模型调用超时\n• insights 数据格式不符预期`,
            error: true,
            errorType: 'network',
          };
          setMessages((prev) => [...prev, errorMessage]);
          setLastError(errorMessage);
          foundResult = true;
          return;
        }
      }
    }

    if (!foundResult) {
      setIsRunning(false);
      const timeoutMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ 运行超时 (${maxAttempts}s)。任务已触发但结果未及时生成。\n\n可能原因：\n• Runtime 仍在处理（查看日志）\n• Gateway 模型调用超时\n• insights 数据格式不符预期`,
        error: true,
        errorType: 'network',
      };
      setMessages((prev) => [...prev, timeoutMessage]);
      setLastError(timeoutMessage);
    }
  };

  // Empty state: no agent created
  if (!hasAgent) {
    return (
      <div className="chat-stage">
        <div className="no-agent-banner">
          <div className="banner-content">
            <span className="banner-icon">🚀</span>
            <span className="banner-text">先去 Connectors 配置模型 Key，再建岗开始对话</span>
            <button className="btn-goto-connectors" onClick={onNavigateToConnectors}>
              去 Connectors
            </button>
          </div>
        </div>

        <div className="chat-empty-state">
          <div className="empty-steps">
            <div className="step-item">
              <div className="step-number">①</div>
              <div className="step-content">
                <div className="step-title">配置 BYOK</div>
                <div className="step-desc">在 Connectors 填写通义千问或智谱 AI 的 API Key</div>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">②</div>
              <div className="step-content">
                <div className="step-title">创建数字员工</div>
                <div className="step-desc">点击侧栏「+」选择角色模板，创建你的第一个 Agent</div>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">③</div>
              <div className="step-content">
                <div className="step-title">开始对话</div>
                <div className="step-desc">与数字员工交流，完成工作任务</div>
              </div>
            </div>
          </div>
        </div>

        <div className="chat-input-area">
          <div className="input-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder="请先配置 Key 并创建数字员工..."
              disabled
            />
            <button className="send-btn" disabled>
              发送
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state: has agent but no keys configured
  if (hasAgent && hasAnyKey === false) {
    return (
      <div className="chat-stage">
        <div className="no-key-banner">
          <div className="banner-content">
            <span className="banner-icon">🔑</span>
            <span className="banner-text">未配置模型 Key，无法开始对话</span>
            <button className="btn-goto-connectors" onClick={onNavigateToConnectors}>
              去 Connectors 配置
            </button>
          </div>
        </div>

        <div className="chat-empty-state">
          <div className="empty-card">
            <div className="empty-icon">🔑</div>
            <h2>先配置模型 Key，才能开始对话</h2>
            <p>
              支持通义千问 (Qwen) 或智谱 AI (GLM)。
              <br />
              Key 本机安全存储，经由 Gateway 出站不留日志。
            </p>
            <button className="btn-primary" onClick={onNavigateToConnectors}>
              去 Connectors 配置
            </button>
            <div className="empty-hint">
              <span>💡 通义千问 / Qwen</span>
              <span>🔷 智谱 AI (GLM)</span>
              <span>👉 本地安全存储</span>
            </div>
          </div>
        </div>

        <div className="chat-input-area">
          <div className="input-wrapper">
            <input type="text" className="chat-input" placeholder="请先配置 Key..." disabled />
            <button className="send-btn" disabled>
              发送
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-stage">
      {reconcileStatus === 'FAILED' && (
        <div className="demo-error-banner">
          <span className="error-icon">❌</span>
          <span className="error-text">任务完成但未通过审核 (reconcile_status: FAILED)</span>
          <button className="error-close" onClick={() => setReconcileStatus('PASS')}>
            ✕
          </button>
        </div>
      )}

      <div className="chat-toolbar">
        <button
          className="fire-job-btn"
          onClick={handleFireJob}
          disabled={isRunning}
          title={isRunning ? '运行中...' : '点火 Demo 任务'}
          style={{
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.6 : 1,
          }}
        >
          {isRunning ? '运行中...' : '立即跑一次 (Demo)'}
        </button>
        <button className="toggle-demo-btn" onClick={() => setShowMockContent(!showMockContent)}>
          {showMockContent ? '隐藏演示内容' : '显示演示内容'}
        </button>
        {hasAnyKey && (
          <div className="status-pill configured">
            <span className="status-dot"></span>
            Key 已配置
          </div>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && !showMockContent && hasAnyKey && (
          <div className="welcome-message">
            <h3>欢迎使用 {agentName}</h3>
            <p>开始对话，我会帮助您完成工作任务</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          if (msg.error) {
            if (msg.errorType === '401') {
              return (
                <div key={idx} className="error-card">
                  <div className="error-header">
                    <span className="error-icon">⚠️</span>
                    <span className="error-title">未配置模型 Key</span>
                    <span className="error-code">401</span>
                  </div>
                  <div className="error-body">
                    <p>
                      发送失败：Gateway 无法认证。请前往 Connectors 填写通义千问 (Qwen) 或智谱 AI
                      (GLM) 的 API Key，或检查 Gateway / API 服务状态 (just health)。
                    </p>
                    <div className="error-actions">
                      <button className="btn-goto-config" onClick={onNavigateToConnectors}>
                        去配置
                      </button>
                      <button className="btn-retry" onClick={handleRetry}>
                        重试
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={idx} className="error-card">
                  <div className="error-header">
                    <span className="error-icon">⚠️</span>
                    <span className="error-title">运行失败</span>
                    {msg.errorType && <span className="error-code">{msg.errorType}</span>}
                  </div>
                  <div className="error-body">
                    <p>{msg.content}</p>
                    <div className="error-actions">
                      <button className="btn-retry" onClick={handleRetry}>
                        重试
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          }

          if (msg.gateDecision) {
            return (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-avatar">产</div>
                <div className="message-content">
                  <div className="gate-result-bubble">
                    <span className="result-icon">
                      {msg.gateDecision === 'approved'
                        ? '✅'
                        : msg.gateDecision === 'rejected'
                          ? '❌'
                          : '✏️'}
                    </span>
                    <span className="result-text">
                      {msg.gateDecision === 'approved' && '已通过验证'}
                      {msg.gateDecision === 'rejected' && '已驳回操作'}
                      {msg.gateDecision === 'revised' && '请修改意见后重新提交'}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className={`message ${msg.role}`}>
              {msg.role === 'assistant' && <div className="message-avatar">产</div>}
              <div className="message-content">
                <div className="message-bubble">{msg.content}</div>
                {msg.validationGate?.status === 'pending' && (
                  <ValidationGateWidget
                    onDecision={(decision) => {
                      setMessages((prev) =>
                        prev.map((m, i) =>
                          i === idx
                            ? {
                                ...m,
                                validationGate: { ...m.validationGate!, status: decision },
                              }
                            : m
                        )
                      );
                      const decisionMessage: ChatMessage = {
                        role: 'assistant',
                        content: '',
                        gateDecision: decision,
                      };
                      setMessages((prev) => [...prev, decisionMessage]);
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">产</div>
            <div className="message-content">
              <div className="message-bubble typing">正在思考...</div>
            </div>
          </div>
        )}

        {showMockContent && (
          <>
            <div className="message user">
              <div className="message-bubble">
                请帮我准备产品经理数字员工周报，包含本周完成的 PRD 文档和待办事项
              </div>
            </div>

            <div className="message assistant">
              <div className="message-avatar">产</div>
              <div className="message-content">
                <div className="message-bubble">
                  好的，我正在整理本周工作内容。让我先查看本周的工作日志和文档...
                </div>
              </div>
            </div>

            <div className="message assistant">
              <div className="message-avatar">产</div>
              <div className="message-content">
                <div className="message-bubble">
                  我准备了一份周报草稿，包含以下内容：
                  <ul>
                    <li>完成 3 个 PRD 文档编写</li>
                    <li>参与 5 次需求评审会议</li>
                    <li>更新产品路线图</li>
                  </ul>
                  需要我执行数据库查询来获取更详细的指标数据吗？
                </div>
              </div>
            </div>

            {reconcileStatus === 'PASS' && (
              <div className="message assistant">
                <div className="message-avatar">产</div>
                <div className="message-content">
                  <ExternalInsightReportCard
                    date={displayDate}
                    facts={displayedFacts}
                    factsPath={`artifacts/external-insight/${displayDate}-public-facts.json`}
                    reconcileStatus={reconcileStatus}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Independent Peer Success Toast */}
      {peerSuccessToast && <div className="peer-success-toast">{peerSuccessToast}</div>}

      <div className="chat-input-area">
        <div className="input-toolbar">
          <button
            type="button"
            className={`btn-at ${selectedPeerAgent ? 'active' : ''}`}
            onClick={handleToggleAgentPicker}
            disabled={!hasAnyKey || isLoading}
            title="@ 选择其他岗位"
          >
            @
            {selectedPeerAgent && (
              <span className="selected-peer">
                {allAgents.find((a) => a.id === selectedPeerAgent)?.name || '...'}
              </span>
            )}
          </button>
        </div>
        <div className="input-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder={
              selectedPeerAgent
                ? `发送给 ${allAgents.find((a) => a.id === selectedPeerAgent)?.name}...`
                : hasAnyKey
                  ? '输入消息...'
                  : '请先配置 Key...'
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || !hasAnyKey}
          />
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim() || !hasAnyKey}
          >
            {isLoading ? '发送中...' : '发送'}
          </button>
        </div>
        {showAgentPicker && (
          <div className="agent-picker">
            <div className="picker-header">选择岗位</div>
            <div className="picker-list">
              {allAgents
                .filter((a) => a.name !== agentName)
                .map((agent) => (
                  <div
                    key={agent.id}
                    className="picker-item"
                    onClick={() => handleSelectPeerAgent(agent.id)}
                  >
                    <span className="picker-avatar">{agent.name.charAt(0)}</span>
                    <span className="picker-name">{agent.name}</span>
                  </div>
                ))}
              {allAgents.filter((a) => a.name !== agentName).length === 0 && (
                <div className="picker-empty">暂无其他岗位</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatStage;
