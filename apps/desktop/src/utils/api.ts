export interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  avatar?: string;
  avatarClass?: string;
  template_id?: string;
  duty?: string;
  account_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  agent_id: string;
  role: 'user' | 'assistant';
  body: string;
  ts: string;
}

export interface ConnectorMeta {
  provider: string;
  configured: boolean;
  last_checked_at?: string;
  account_label?: string;
}

const DEFAULT_CLOUD_API_BASE = 'http://123.57.167.155/openstaff';
const DEFAULT_LOCAL_API_BASE = 'http://127.0.0.1:3000';

const API_BASE =
  (import.meta as { env?: { PUBLIC_API_BASE?: string } }).env?.PUBLIC_API_BASE ||
  DEFAULT_CLOUD_API_BASE;

function isLocalBase(base: string): boolean {
  return (
    base.includes('127.0.0.1') ||
    base.includes('localhost') ||
    base.startsWith('http://localhost:') ||
    base.startsWith('http://127.0.0.1:')
  );
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let cachedApiBase: string | null = null;
let cachedCloudApiKey: string | null = null;

export async function getApiBase(): Promise<string> {
  if (cachedApiBase) {
    return cachedApiBase;
  }

  try {
    const { getProviderKey } = await import('./tauri');
    const savedBase = await getProviderKey('openstaff_api_base');
    cachedApiBase = savedBase || API_BASE;
    return cachedApiBase;
  } catch {
    cachedApiBase = API_BASE;
    return cachedApiBase;
  }
}

export async function getCloudApiKey(): Promise<string | null> {
  if (cachedCloudApiKey !== null) {
    return cachedCloudApiKey;
  }

  try {
    const { getProviderKey } = await import('./tauri');
    const key = await getProviderKey('openstaff_cloud');
    cachedCloudApiKey = key || null;
    return cachedCloudApiKey;
  } catch {
    return null;
  }
}

export function clearApiCache(): void {
  cachedApiBase = null;
  cachedCloudApiKey = null;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const base = await getApiBase();
  const method = options?.method?.toUpperCase() || 'GET';
  const needsAuth = method !== 'GET' && method !== 'HEAD';
  const isLocal = isLocalBase(base);

  const cloudKey = await getCloudApiKey();
  const envKey = import.meta.env.OPENSTAFF_API_KEY;
  const apiKey = cloudKey || envKey;

  // Only require auth for write operations to cloud base
  if (needsAuth && !isLocal && !apiKey) {
    throw new ApiError(401, '云鉴权未配置 - 请在设置中配置云 API Key 或切换到本地开发环境');
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add Bearer token if available (for both cloud and local with auth enabled)
    if (apiKey && needsAuth) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${base}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError(401, '云鉴权失败 - 请检查云 API Key 配置');
      }
      throw new ApiError(response.status, `API request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, '控制面未就绪 - 无法连接到服务器');
  }
}

export async function listAgents(): Promise<Agent[]> {
  return fetchApi<Agent[]>('/v1/agents');
}

export async function createAgent(data: {
  name: string;
  template_id?: string;
  duty?: string;
}): Promise<Agent> {
  return fetchApi<Agent>('/v1/agents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAgent(
  id: string,
  data: {
    name?: string;
    duty?: string;
    status?: string;
  }
): Promise<Agent> {
  return fetchApi<Agent>(`/v1/agents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAgent(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/v1/agents/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `Failed to delete agent: ${response.statusText}`);
  }

  // 204 No Content has empty body, don't call json()
  if (response.status === 204) {
    return;
  }

  // For other 2xx responses, try to parse JSON
  if (response.headers.get('content-type')?.includes('application/json')) {
    await response.json();
  }
}

export async function listMessages(agentId: string): Promise<Message[]> {
  return fetchApi<Message[]>(`/v1/agents/${agentId}/messages`);
}

export async function createMessage(
  agentId: string,
  data: {
    role: 'user' | 'assistant';
    body: string;
  }
): Promise<Message> {
  return fetchApi<Message>(`/v1/agents/${agentId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getConnectorMeta(): Promise<ConnectorMeta[]> {
  return fetchApi<ConnectorMeta[]>('/v1/connectors/meta');
}

export async function updateConnectorMeta(data: {
  provider: string;
  configured: boolean;
  last_checked_at?: string;
  account_label?: string;
}): Promise<ConnectorMeta> {
  return fetchApi<ConnectorMeta>('/v1/connectors/meta', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function isApiAvailable(): boolean {
  return !!API_BASE;
}

export function getDefaultCloudApiBase(): string {
  return DEFAULT_CLOUD_API_BASE;
}

export function getDefaultLocalApiBase(): string {
  return DEFAULT_LOCAL_API_BASE;
}

// Skills API

export interface AgentSkill {
  skill_id: string;
  name: string;
  version: string;
  summary?: string;
  enabled: boolean;
}

export interface ListAgentSkillsResponse {
  agent_id: string;
  items: AgentSkill[];
}

export async function listAgentSkills(agentId: string): Promise<ListAgentSkillsResponse> {
  return fetchApi<ListAgentSkillsResponse>(`/v1/agents/${agentId}/skills`);
}

export async function updateAgentSkill(
  agentId: string,
  skillId: string,
  enabled: boolean
): Promise<void> {
  await fetchApi<void>(`/v1/agents/${agentId}/skills/${skillId}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
}

export interface TrySkillResponse {
  ok: boolean;
  message: string;
}

export async function tryAgentSkill(agentId: string, skillId: string): Promise<TrySkillResponse> {
  return fetchApi<TrySkillResponse>(`/v1/agents/${agentId}/skills/${skillId}/try`, {
    method: 'POST',
  });
}

// MCP API

export interface AgentMcp {
  mcp_id: string;
  name: string;
  summary?: string;
  enabled: boolean;
  status: string;
  last_checked_at?: string;
}

export interface ListAgentMcpResponse {
  agent_id: string;
  items: AgentMcp[];
}

export async function listAgentMcp(agentId: string): Promise<ListAgentMcpResponse> {
  return fetchApi<ListAgentMcpResponse>(`/v1/agents/${agentId}/mcp`);
}

export async function updateAgentMcp(
  agentId: string,
  mcpId: string,
  enabled: boolean,
  configJson?: string
): Promise<void> {
  await fetchApi<void>(`/v1/agents/${agentId}/mcp/${mcpId}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled, config_json: configJson }),
  });
}

export interface TestMcpResponse {
  ok: boolean;
  status: string;
  message: string;
}

export async function testAgentMcp(agentId: string, mcpId: string): Promise<TestMcpResponse> {
  return fetchApi<TestMcpResponse>(`/v1/agents/${agentId}/mcp/${mcpId}/test`, {
    method: 'POST',
  });
}

// Peer messages (agent-to-agent)

export async function sendPeerMessage(
  fromAgentId: string,
  toAgentId: string,
  body: string
): Promise<void> {
  await fetchApi<void>(`/v1/agents/${fromAgentId}/peer-messages`, {
    method: 'POST',
    body: JSON.stringify({ to_agent_id: toAgentId, body }),
  });
}
