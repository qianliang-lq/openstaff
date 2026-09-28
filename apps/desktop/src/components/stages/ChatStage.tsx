import { useEffect, useState } from 'react';
import ValidationGateWidget from '../ValidationGateWidget';
import ExternalInsightReportCard, { type ExternalInsightFact } from '../ExternalInsightReportCard';
import './ChatStage.css';

interface DemoResponse {
  reconcile_status: string;
  facts?: ExternalInsightFact[];
  summary?: string[];
  artifacts_path: string;
  timestamp: string;
}

interface ChatStageProps {
  demoResponse?: DemoResponse | null;
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

function ChatStage({ demoResponse }: ChatStageProps) {
  const [displayedFacts, setDisplayedFacts] = useState<ExternalInsightFact[]>(mockFacts);
  const [reconcileStatus, setReconcileStatus] = useState<'PASS' | 'FAILED'>('PASS');
  const [displayDate, setDisplayDate] = useState('2026-09-27');

  useEffect(() => {
    if (demoResponse && demoResponse.reconcile_status === 'PASS' && demoResponse.facts) {
      setDisplayedFacts(demoResponse.facts);
      setReconcileStatus('PASS');
      setDisplayDate(demoResponse.timestamp || '2026-09-27');
    } else if (demoResponse && demoResponse.reconcile_status === 'FAILED') {
      setReconcileStatus('FAILED');
    }
  }, [demoResponse]);

  return (
    <div className="chat-stage">
      <div className="chat-messages">
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
            <div className="message-avatar">研</div>
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
      </div>

      <div className="chat-input-area">
        <div className="input-wrapper">
          <input type="text" className="chat-input" placeholder="输入消息..." />
          <button className="send-btn">发送</button>
        </div>
      </div>
    </div>
  );
}

export default ChatStage;
