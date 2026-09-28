import './InstancesPage.css';

interface Instance {
  id: string;
  agent: string;
  tenant: string;
  status: 'Ready' | 'Provisioning' | 'Failed';
  node: string;
  digest: string;
}

const mockInstances: Instance[] = [
  {
    id: 'eb-sjn-3bi3i',
    agent: '产品经理数字员工',
    tenant: 'tenant-acme',
    status: 'Ready',
    node: 'node-bj-53',
    digest: 'sha256:a3b2…3d6f-6f',
  },
  {
    id: 'eq-agn-6507',
    agent: '运营专家',
    tenant: 'tenant-acme',
    status: 'Ready',
    node: 'node-sh-51',
    digest: 'sha256:a3b2…3d6f-6f',
  },
  {
    id: 'ei-dev-5bii',
    agent: '研发协作',
    tenant: 'tenant-beta',
    status: 'Provisioning',
    node: 'node-bj-58',
    digest: 'sha256:b74a…0d3f-1a2',
  },
  {
    id: 'eq-agn-0583',
    agent: '运营专家',
    tenant: 'tenant-beta',
    status: 'Failed',
    node: 'node-sh-55',
    digest: 'sha256:c2d4…8f9e-0c3',
  },
  {
    id: 'eq-pm-6bt4',
    agent: '产品经理数字员工',
    tenant: 'tenant-beta',
    status: 'Ready',
    node: 'node-bj-12',
    digest: 'sha256:a3b2…3d6f-6f',
  },
];

function InstancesPage() {
  return (
    <div className="instances-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">实例</h1>
          <p className="page-desc">Agent 实例运行状态 / 舰队 digest</p>
        </div>
        <button className="btn-create">创建实例</button>
      </div>

      <div className="toolbar">
        <div className="search">
          <span>🔍</span>
          <span className="search-text">按 instance_id / Agent / 租户</span>
        </div>
        <div className="select-fake">全部状态</div>
        <div className="select-fake">全部节点</div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>instance_id</th>
              <th>Agent / 岗位</th>
              <th>租户 acme</th>
              <th>状态</th>
              <th>节点</th>
              <th>digest</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {mockInstances.map((instance) => (
              <tr key={instance.id}>
                <td>
                  <span className="mono">{instance.id}</span>
                </td>
                <td>{instance.agent}</td>
                <td className="mono">{instance.tenant}</td>
                <td>
                  <span className={`tag tag-${instance.status.toLowerCase()}`}>
                    {instance.status}
                  </span>
                </td>
                <td className="mono">{instance.node}</td>
                <td className="mono">{instance.digest}</td>
                <td>
                  <div className="ops">
                    <button className="link">详情</button>
                    <button className="link">重启</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InstancesPage;
