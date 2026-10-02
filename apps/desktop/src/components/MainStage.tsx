import { useState } from 'react';
import { TabType } from '../App';
import ChatStage from './stages/ChatStage';
import Computer from './pages/Computer';
import Routines from './pages/Routines';
import Skills from './pages/Skills';
import Connectors from './Connectors';
import Memory from './pages/Memory';
import { ExternalInsightFact } from './ExternalInsightReportCard';
import * as api from '../utils/api';
import './MainStage.css';

interface MainStageProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeAgent: string;
}

interface Tab {
  id: TabType;
  label: string;
}

interface DemoResponse {
  reconcile_status: string;
  facts?: ExternalInsightFact[];
  summary?: string[];
  artifacts_path: string;
  timestamp: string;
}

const tabs: Tab[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'computer', label: 'Computer' },
  { id: 'routines', label: 'Routines' },
  { id: 'skills', label: 'Skills' },
  { id: 'connectors', label: 'Connectors' },
  { id: 'memory', label: 'Memory' },
];

function MainStage({ activeTab, onTabChange, activeAgent }: MainStageProps) {
  const [demoResponse, setDemoResponse] = useState<DemoResponse | null>(null);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  // 私董会：工作台推进可以自动；投资/消费等高危必须本人确认，严禁跳过（见 docs/PRODUCT_POSITIONING.md）
  // 注：当前为本地 demo state 演示审批流程，生产环境须对接真实审批队列与后端持久化
  const [approvalCount, setApprovalCount] = useState(1);
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // Special handling: Chat and Connectors tabs can show without agent
  // Other tabs require an agent
  if (!activeAgent && activeTab !== 'chat' && activeTab !== 'connectors') {
    return (
      <div className="main">
        <div className="empty-main-state">
          <div className="empty-main-icon">👈</div>
          <div className="empty-main-text">请先创建数字员工</div>
          <div className="empty-main-hint">点击左侧「+」开始</div>
        </div>
      </div>
    );
  }

  const runExternalInsightDemo = async () => {
    setIsRunningDemo(true);
    setDemoError(null);
    setDemoResponse(null);

    try {
      // Fire demo job via unified API client (follows cloud base + Bearer)
      const fireResponse = await api.fireDemoJob({
        routine_id: 'external-insight-daily',
        skill_id: 'external-insight-public-search',
        trigger: 'manual',
      });

      console.log('Fire response:', fireResponse);

      // Poll for job result
      let pollAttempts = 0;
      const maxPolls = 10;
      const pollInterval = 1000;
      let foundResult = false;

      while (pollAttempts < maxPolls) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        try {
          const insightData = await api.getLatestInsight();

          if (
            insightData.reconcile_status === 'PASS' &&
            insightData.facts &&
            insightData.facts.length > 0
          ) {
            setDemoResponse({
              reconcile_status: insightData.reconcile_status,
              facts: insightData.facts as unknown as ExternalInsightFact[],
              summary: (insightData as { summary?: string[] }).summary,
              artifacts_path: (insightData as { artifacts_path?: string }).artifacts_path || '',
              timestamp:
                (insightData as { timestamp?: string }).timestamp || new Date().toISOString(),
            });
            foundResult = true;
            setIsRunningDemo(false);
            return;
          } else if (insightData.reconcile_status === 'FAILED') {
            setDemoError('❌ 任务完成但未通过审核 (reconcile_status: FAILED)');
            setIsRunningDemo(false);
            foundResult = true;
            return;
          }
        } catch (error) {
          console.log('Polling attempt', pollAttempts + 1, 'failed:', error);
          if (pollAttempts === maxPolls - 1) {
            setDemoError(
              `❌ 运行超时 (${maxPolls}s)。任务已触发但结果未及时生成。\n\n可能原因：\n• Runtime 仍在处理（查看日志）\n• Gateway 模型调用超时\n• insights 数据格式不符预期`
            );
            setIsRunningDemo(false);
            foundResult = true;
            return;
          }
        }

        pollAttempts++;
      }

      if (!foundResult) {
        setDemoError(
          `❌ 运行超时 (${maxPolls}s)。任务已触发但结果未及时生成。\n\n可能原因：\n• Runtime 仍在处理（查看日志）\n• Gateway 模型调用超时\n• insights 数据格式不符预期`
        );
        setIsRunningDemo(false);
      }
    } catch (error) {
      console.error('Failed to fire job:', error);
      const errorMessage =
        error instanceof Error ? error.message : '运行失败，请检查后端服务或云 API 配置';
      setDemoError(errorMessage);
      setDemoResponse(null);
    } finally {
      setIsRunningDemo(false);
    }
  };

  return (
    <div className="main">
      <div className="tabbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <div className="tab-spacer"></div>
        <button
          onClick={runExternalInsightDemo}
          disabled={isRunningDemo}
          className="demo-btn"
          title={isRunningDemo ? '运行中...' : '点火 Demo 任务'}
          style={{
            padding: '6px 12px',
            background: isRunningDemo ? '#9ca3af' : '#e11d48',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunningDemo ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            marginRight: '8px',
          }}
        >
          {isRunningDemo ? '运行中...' : '点火 Demo'}
        </button>
        {/* 私董会：工作台推进可以自动；投资/消费等高危必须本人确认，严禁跳过（见 docs/PRODUCT_POSITIONING.md） */}
        {approvalCount > 0 ? (
          <div
            className="status-pill wait"
            onClick={() => setShowApprovalPanel(!showApprovalPanel)}
            style={{ cursor: 'pointer' }}
            title="点击查看待审批事项"
          >
            <span className="pulse"></span>
            等待审批 ({approvalCount})
          </div>
        ) : (
          <div className="status-pill approved" title="无待审批">
            ✓ 无待审批
          </div>
        )}
      </div>

      {demoError && (
        <div className="demo-error-banner">
          <span className="error-icon">❌</span>
          <span className="error-text">{demoError}</span>
          <button className="error-close" onClick={() => setDemoError(null)}>
            ✕
          </button>
        </div>
      )}

      {approvalFeedback && (
        <div className="approval-feedback-toast">
          <span>{approvalFeedback}</span>
          <button onClick={() => setApprovalFeedback(null)}>✕</button>
        </div>
      )}

      {/* 私董会：高危确认闸 — 独立确认层，展示要点与后果，用户明确通过/驳回后才执行（见 docs/PRODUCT_POSITIONING.md） */}
      {/* 注：当前为本地 demo state，生产环境须对接后端审批队列，记录审计日志（谁、何时、对什么）；严禁一键静默通过或倒计时代批 */}
      {showApprovalPanel && approvalCount > 0 && (
        <div className="approval-panel">
          <div className="approval-header">
            <h3>待审批事项</h3>
            <button onClick={() => setShowApprovalPanel(false)}>✕</button>
          </div>
          <div className="approval-item">
            <div className="approval-content">
              <div className="approval-title">Demo 外部洞察任务执行</div>
              <div className="approval-desc">
                演示：请求执行 external-insight-daily 任务，触发 Gateway 模型调用
              </div>
              <div className="approval-meta">触发者：系统 Demo | 时间：刚刚</div>
            </div>
            <div className="approval-actions">
              {/* 私董会：通过/驳回须本人明确点击；禁止自动勾选「以后都同意」或把确认埋进普通 Toast */}
              <button
                className="btn-approve"
                onClick={() => {
                  // TODO: 生产环境须调用后端 API 记录审批决策（审计日志）
                  setApprovalCount(0);
                  setShowApprovalPanel(false);
                  setApprovalFeedback('✓ 已通过审批');
                  setTimeout(() => setApprovalFeedback(null), 2000);
                }}
              >
                通过
              </button>
              <button
                className="btn-reject"
                onClick={() => {
                  // TODO: 生产环境须调用后端 API 记录驳回决策（审计日志）
                  setApprovalCount(0);
                  setShowApprovalPanel(false);
                  setApprovalFeedback('✗ 已驳回');
                  setTimeout(() => setApprovalFeedback(null), 2000);
                }}
              >
                驳回
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="stage">
        {activeTab === 'chat' && (
          <ChatStage
            demoResponse={demoResponse}
            agentName={activeAgent}
            hasAgent={!!activeAgent}
            onNavigateToConnectors={() => onTabChange('connectors')}
          />
        )}
        {activeTab === 'computer' && <Computer />}
        {activeTab === 'routines' && <Routines />}
        {activeTab === 'skills' && <Skills agentName={activeAgent} />}
        {activeTab === 'connectors' && <Connectors />}
        {activeTab === 'memory' && <Memory />}
      </div>
    </div>
  );
}

export default MainStage;
