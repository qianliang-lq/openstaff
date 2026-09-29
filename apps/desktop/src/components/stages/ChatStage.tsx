import { useEffect, useState, useRef } from 'react';
import ValidationGateWidget from '../ValidationGateWidget';
import ExternalInsightReportCard, { type ExternalInsightFact } from '../ExternalInsightReportCard';
import './ChatStage.css';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface LLMConfig {
  provider: 'qwen' | 'glm';
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

interface DemoResponse {
  reconcile_status: string;
  facts?: ExternalInsightFact[];
  summary?: string[];
  artifacts_path: string;
  timestamp: string;
}

interface ChatStageProps {
  demoResponse?: DemoResponse | null;
  agentName?: string;
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

function ChatStage({ demoResponse, agentName = '产品经理数字员工' }: ChatStageProps) {
  const [displayedFacts, setDisplayedFacts] = useState<ExternalInsightFact[]>(mockFacts);
  const [reconcileStatus, setReconcileStatus] = useState<'PASS' | 'FAILED'>('PASS');
  const [displayDate, setDisplayDate] = useState('2026-09-27');
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMockContent, setShowMockContent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (demoResponse && demoResponse.reconcile_status === 'PASS' && demoResponse.facts) {
      setDisplayedFacts(demoResponse.facts);
      setReconcileStatus('PASS');
      setDisplayDate(demoResponse.timestamp || '2026-09-27');
      setIsRunning(false);
    } else if (demoResponse && demoResponse.reconcile_status === 'FAILED') {
      setReconcileStatus('FAILED');
      setIsRunning(false);
    }
  }, [demoResponse]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getLLMConfig = (): LLMConfig | null => {
    const configStr = localStorage.getItem('llm_config');
    if (!configStr) return null;
    try {
      return JSON.parse(configStr);
    } catch {
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const config = getLLMConfig();
    if (!config || !config.apiKey) {
      setErrorMessage('请先在设置中配置 API Key');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const systemPrompt: ChatMessage = {
        role: 'system',
        content: `你是${agentName}，请帮助用户完成工作任务。`,
      };

      const response = await fetch('http://localhost:3001/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: config.provider,
          model: config.model || undefined,
          api_key: config.apiKey,
          base_url: config.baseUrl || undefined,
          messages: [systemPrompt, ...messages, userMessage],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setErrorMessage(error instanceof Error ? error.message : '发送消息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFireJob = async () => {
    setIsRunning(true);
    setErrorMessage(null);
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
        throw new Error('Scheduler 服务未响应，请确保服务正在运行');
      }

      pollInsights();
    } catch (error) {
      console.error('Error firing job:', error);
      setErrorMessage(error instanceof Error ? error.message : '运行失败');
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
          throw new Error('Failed to fetch insights');
        }

        const data = await response.json();

        if (data.job_status === 'completed') {
          if (data.reconcile_status === 'PASS' && data.facts && data.facts.length > 0) {
            setDisplayedFacts(data.facts);
            setReconcileStatus('PASS');
            setDisplayDate(data.timestamp || '2026-09-27');
          } else {
            setReconcileStatus('FAILED');
          }
          setIsRunning(false);
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling insights:', error);
      }
    }

    setIsRunning(false);
  };

  return (
    <div className="chat-stage">
      <div className="chat-toolbar">
        <button className="fire-job-btn" onClick={handleFireJob} disabled={isRunning}>
          {isRunning ? '运行中...' : '立即跑一次 (Demo)'}
        </button>
        <button className="toggle-demo-btn" onClick={() => setShowMockContent(!showMockContent)}>
          {showMockContent ? '隐藏演示内容' : '显示演示内容'}
        </button>
      </div>

      {errorMessage && <div className="error-banner">⚠️ {errorMessage}</div>}

      <div className="chat-messages">
        {messages.length === 0 && !showMockContent && (
          <div className="welcome-message">
            <h3>欢迎使用 {agentName}</h3>
            <p>开始对话前，请确保已在设置中配置 API Key</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.role === 'assistant' && <div className="message-avatar">产</div>}
            <div className="message-content">
              <div className="message-bubble">{msg.content}</div>
            </div>
          </div>
        ))}

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

                <ValidationGateWidget />
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
            placeholder="输入消息..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatStage;
