import { useState } from 'react';
import './Memory.css';

interface MemoryItem {
  id: string;
  kind: 'persona' | 'fact' | 'note';
  title: string;
  body: string;
  updatedAt: string;
}

interface MemoryProps {
  agentName: string;
}

const mockMemory: MemoryItem[] = [
  {
    id: 'mem-1',
    kind: 'persona',
    title: '产品经理人设',
    body: '我是一名资深产品经理，擅长需求分析、竞品研究和 PRD 编写。关注用户体验与商业价值的平衡。',
    updatedAt: '2026-09-25',
  },
  {
    id: 'mem-2',
    kind: 'fact',
    title: 'Q3 产品规划重点',
    body: '本季度重点：1) AI 助手功能优化 2) 移动端体验提升 3) 数据分析能力增强',
    updatedAt: '2026-09-27',
  },
  {
    id: 'mem-3',
    kind: 'note',
    title: '竞品分析要点',
    body: '定期关注 Factory、Cursor、GitHub Copilot 的产品更新和用户反馈。',
    updatedAt: '2026-09-28',
  },
];

function Memory({ agentName }: MemoryProps) {
  const [memories, setMemories] = useState<MemoryItem[]>(mockMemory);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', body: '' });
  const [feedback, setFeedback] = useState('');

  const personaMemory = memories.find((m) => m.kind === 'persona');
  const otherMemories = memories.filter((m) => m.kind !== 'persona');

  const handleAddNote = () => {
    if (!newNote.title.trim() || !newNote.body.trim()) {
      setFeedback('标题和内容不能为空');
      return;
    }

    const note: MemoryItem = {
      id: `mem-${Date.now()}`,
      kind: 'note',
      title: newNote.title.trim(),
      body: newNote.body.trim(),
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setMemories((prev) => [...prev, note]);
    setNewNote({ title: '', body: '' });
    setShowAddModal(false);
    setFeedback('添加成功 ✓');
    setTimeout(() => setFeedback(''), 2000);
  };

  const getKindBadge = (kind: MemoryItem['kind']) => {
    const kindMap = {
      persona: { label: '人设', className: 'persona' },
      fact: { label: '事实', className: 'fact' },
      note: { label: '笔记', className: 'note' },
    };
    const { label, className } = kindMap[kind];
    return <span className={`kind-badge ${className}`}>{label}</span>;
  };

  return (
    <div className="memory-container">
      <div className="memory-header">
        <div>
          <h2>Memory 记忆与人设</h2>
          <p className="subtitle">{agentName} 的长期记忆</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-add">
          添加笔记
        </button>
      </div>

      {feedback && <div className="feedback-banner">{feedback}</div>}

      {personaMemory && (
        <div className="persona-card">
          <div className="card-header">
            {getKindBadge('persona')}
            <h3>{personaMemory.title}</h3>
          </div>
          <p className="persona-body">{personaMemory.body}</p>
          <div className="card-footer">更新于 {personaMemory.updatedAt}</div>
        </div>
      )}

      <div className="memory-list">
        {otherMemories.length > 0 ? (
          otherMemories.map((mem) => (
            <div key={mem.id} className="memory-item">
              <div className="item-header">
                {getKindBadge(mem.kind)}
                <h4>{mem.title}</h4>
              </div>
              <p className="item-body">{mem.body}</p>
              <div className="item-footer">更新于 {mem.updatedAt}</div>
            </div>
          ))
        ) : (
          <div className="empty-state">暂无记忆</div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>添加笔记</h3>
            <div className="form-group">
              <label>标题</label>
              <input
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="输入笔记标题"
              />
            </div>
            <div className="form-group">
              <label>内容</label>
              <textarea
                value={newNote.body}
                onChange={(e) => setNewNote({ ...newNote, body: e.target.value })}
                placeholder="输入笔记内容"
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddModal(false)} className="btn-cancel">
                取消
              </button>
              <button onClick={handleAddNote} className="btn-confirm">
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Memory;
