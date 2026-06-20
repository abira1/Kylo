/**
 * Admin API Service
 * Handles all admin-related API calls to the backend
 * 
 * Base URL: /api/kylo/admin
 * 
 * Provides:
 * - Session management (list, get, update, escalate)
 * - Analytics data (summary, trends)
 * - Export functionality
 */

const API_BASE = '/api/kylo/admin';

// Helper function to make requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API request failed: ${response.statusText}`);
  }

  return response.json();
}

// ==================== SESSIONS ====================

export interface Session {
  sessionId: string;
  phoneNumber: string;
  status: 'active' | 'completed' | 'escalated' | 'paused';
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  adminNotes?: string;
  tags?: string[];
  priority?: string;
}

export interface SessionsListResponse {
  sessions: Session[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Get list of sessions with pagination and filtering
 */
export async function getSessionsList(
  page: number = 1,
  limit: number = 20,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
  }
): Promise<SessionsListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);

  return apiRequest<SessionsListResponse>(`/sessions?${params.toString()}`);
}

/**
 * Get full session details
 */
export async function getSessionDetails(sessionId: string): Promise<Session & Record<string, any>> {
  return apiRequest(`/sessions/${sessionId}`);
}

/**
 * Update session (notes, tags, priority)
 */
export async function updateSession(
  sessionId: string,
  updates: {
    adminNotes?: string;
    tags?: string[];
    priority?: string;
  }
): Promise<{ success: boolean; sessionId: string; updatedFields: string[] }> {
  return apiRequest(`/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Get session conversation transcript
 */
export interface Message {
  messageId: string;
  sender: 'user' | 'system' | 'ai';
  text: string;
  timestamp: string;
  step?: number;
  type?: string;
}

export interface TranscriptResponse {
  sessionId: string;
  phoneNumber: string;
  status: string;
  currentStep: number;
  messages: Message[];
  totalMessages: number;
  startedAt: string;
  lastMessageAt?: string;
}

export async function getSessionTranscript(sessionId: string): Promise<TranscriptResponse> {
  return apiRequest(`/sessions/${sessionId}/transcript`);
}

/**
 * Escalate session for manual review
 */
export async function escalateSession(
  sessionId: string,
  escalation: {
    reason: string;
    assignedTo?: string;
    notes?: string;
  }
): Promise<{ success: boolean; escalationId: string; escalatedAt: string }> {
  return apiRequest(`/escalate/${sessionId}`, {
    method: 'POST',
    body: JSON.stringify(escalation),
  });
}

// ==================== ANALYTICS ====================

export interface AnalyticsSummary {
  summary: {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    escalatedSessions: number;
    pausedSessions: number;
    successRate: number;
    averageStepsCompleted: number;
  };
  byStatus: {
    active: number;
    completed: number;
    escalated: number;
    paused: number;
  };
  topIssues: Array<{
    reason: string;
    count: number;
  }>;
  timestamp: string;
}

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return apiRequest('/analytics');
}

export interface TrendData {
  date: string;
  sessionsCreated: number;
  sessionsCompleted: number;
  escalations: number;
  conversionRate: number;
}

export interface TrendsResponse {
  period: string;
  data: TrendData[];
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentChange: number;
    momentum: 'positive' | 'negative' | 'neutral';
    firstHalfAvg: number;
    secondHalfAvg: number;
  };
  timestamp: string;
}

/**
 * Get analytics trends
 */
export async function getAnalyticsTrends(period: number = 30): Promise<TrendsResponse> {
  const params = new URLSearchParams({ period: period.toString() });
  return apiRequest(`/analytics/trends?${params.toString()}`);
}

// ==================== EXPORT ====================

export async function exportSessions(
  format: 'json' | 'csv' = 'json',
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    tags?: string[];
  }
): Promise<{
  success: boolean;
  format: string;
  filename: string;
  rowCount: number;
  data?: any[];
  generatedAt: string;
}> {
  return apiRequest('/export/sessions', {
    method: 'POST',
    body: JSON.stringify({ format, filters }),
  });
}

// ==================== HEALTH CHECK ====================

export async function checkAdminHealth(): Promise<{ status: string; service: string }> {
  return apiRequest('/health');
}
