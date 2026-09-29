import { useEffect, useState, useRef } from 'react';
import { getProviderKey } from '../../utils/tauri';
import ValidationGateWidget from '../ValidationGateWidget';
import ExternalInsightReportCard, { type ExternalInsightFact } from '../ExternalInsightReportCard';
import './ChatStage.css';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  error?: boolean;
  errorType?: '401' | '403' | 'network' | 'unknown';
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
}: ChatStageProps) {
  const [displayedFacts, setDisplayedFacts] = useState<ExternalInsightFact[]>(mockFacts);
  const [reconcileStatus, setReconcileStatus] = useState<'PASS' | 'FAILED'>('PASS');
  const [displayDate, setDisplayDate] = useState('2026-09-27');
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '我准备了一份周报草稿，包含以下内容：\n• 完成 3 个 PRD 文档编写\n• 参与 5 次需求评审会议\n• 更新产品路线图\n\n需要我执行数据库查询来获取更详细的指标数据吗？',
      validationGate: {
        status: 'pending',
        prompt: '是否具备数据支撑的逻辑闭环？',
      },
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMockContent, setShowMockContent] = useState(true);
  const [hasAnyKey, setHasAnyKey] = useState<boolean | null>(null);
  const [lastError, setLastError] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, []);

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

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setLastError(null);

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

      const systemPrompt: ChatMessage = {
        role: 'system',
        content: `你是${agentName}，请帮助用户完成工作任务。`,
      };

      const response = await fetch('http://localhost:3000/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OpenStaff-Provider-Key': providerKey,
        },
        body: JSON.stringify({
          provider,
          messages: [systemPrompt, ...messages.filter((m) => !m.error), userMessage],
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const statusCode = response.status;
        throw new Error(`${statusCode}:${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);

      const errorMsg = error instanceof Error ? error.message : '发送消息失败';
      let errorType: '401' | '403' | 'network' | 'unknown' = 'unknown';

      if (errorMsg.includes('401')) {
        errorType = '401';
      } else if (errorMsg.includes('403')) {
        errorType = '403';
      } else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
        errorType = 'network';
      }

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: errorMsg,
        error: true,
        errorType,
      };

      setLastError(errorMessage);
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
      const response = await fetch('http://localhost:3002/demo/fire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routine_id: 'external-insight-daily',
          skill_id: 'external-insight-public-search',
          trigger: 'manual',
        }),
      });

      if (!response.ok) {
        throw new Error('Scheduler 服务未响应，请确保服务正在运行 (http://localhost:3002)');
      }

      // Remove running message before polling
      setMessages((prev) => prev.filter((m) => m !== runningMessage));
      pollInsights();
    } catch (error) {
      console.error('Error firing job:', error);

      // Remove running message
      setMessages((prev) => prev.filter((m) => m !== runningMessage));

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ ${error instanceof Error ? error.message : '运行失败'}`,
        error: true,
        errorType: 'network',
      };
      setLastError(errorMessage);
      setMessages((prev) => [...prev, errorMessage]);
      setIsRunning(false);
    }
  };

  const pollInsights = async () => {
    const maxAttempts = 10;
    const pollInterval = 1000;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch('http://localhost:3003/v1/insights/latest');
        if (!response.ok) {
          throw new Error('Runtime 服务未响应 (http://localhost:3003)');
        }

        const data = await response.json();

        if (data.job_status === 'completed') {
          if (data.reconcile_status === 'PASS' && data.facts && data.facts.length > 0) {
            setDisplayedFacts(data.facts);
            setReconcileStatus('PASS');
            setDisplayDate(data.timestamp || '2026-09-27');

            // Add success feedback
            const successMessage: ChatMessage = {
              role: 'assistant',
              content: `✅ 运行成功！已生成 ${data.facts.length} 条外部洞察`,
            };
            setMessages((prev) => [...prev, successMessage]);
          } else {
            setReconcileStatus('FAILED');

            // Add failure feedback
            const failureMessage: ChatMessage = {
              role: 'assistant',
              content: '❌ 任务完成但未通过审核 (reconcile_status: FAILED)',
              error: true,
              errorType: 'unknown',
            };
            setMessages((prev) => [...prev, failureMessage]);
            setLastError(failureMessage);
          }
          setIsRunning(false);
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling insights:', error);
        setIsRunning(false);

        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `❌ ${error instanceof Error ? error.message : '获取结果失败'}`,
          error: true,
          errorType: 'network',
        };
        setMessages((prev) => [...prev, errorMessage]);
        setLastError(errorMessage);
        break;
      }
    }

    if (isRunning) {
      // Timeout after max attempts
      setIsRunning(false);
      const timeoutMessage: ChatMessage = {
        role: 'assistant',
        content: '⏱️ 任务超时，请稍后重试或检查服务状态',
        error: true,
        errorType: 'unknown',
      };
      setMessages((prev) => [...prev, timeoutMessage]);
      setLastError(timeoutMessage);
    }
  };

  // Empty state: no keys configured
  if (hasAnyKey === false && messages.length === 0) {
    return (
      <div className="chat-stage">
        <div className="chat-toolbar">
          <div className="status-pill no-key">
            <span className="status-dot"></span>
            未配置 Key
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
        <button className="fire-job-btn" onClick={handleFireJob} disabled={isRunning}>
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

      <div className="chat-input-area">
        <div className="input-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder={hasAnyKey ? '输入消息...' : '请先配置 Key...'}
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
      </div>
    </div>
  );
}

export default ChatStage;
