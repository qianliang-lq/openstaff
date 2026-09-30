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

const API_BASE =
  (import.meta as { env?: { PUBLIC_API_BASE?: string } }).env?.PUBLIC_API_BASE ||
  'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        `API request failed: ${response.statusText}`
      );
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
    throw new ApiError(
      response.status,
      `Failed to delete agent: ${response.statusText}`
    );
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
