/**
 * Data Service - Replaces mockData with real Firebase calls
 */

import {
  readData,
  subscribeToData,
  subscribeToOrderedData,
  writeData,
  updateData,
  addDocument,
  deleteData,
} from '../firebase/database';

// Types
export interface ChartDataPoint {
  name: string;
  visitors: number;
  interactions: number;
  leads: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'Qualified' | 'New' | 'Contacted' | 'Won' | 'Lost';
  source: 'Website Widget' | 'WhatsApp' | 'Landing Page' | 'Other';
  score: number;
  date: string;
}

export interface Message {
  id?: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  visitorName: string;
  status: 'Active' | 'Closed' | 'Waiting';
  lastMessage: string;
  time: string;
  channel: 'Website' | 'WhatsApp' | 'Email';
  messages: Message[];
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  dueDate: string;
  createdAt: string;
  plan: string;
  date: string;
}export interface TrainingFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  url: string;
  status: 'Indexed' | 'Processing';
  date: string;
}

/**
 * ANALYTICS DATA
 */

export const getChartData = async (clientId: string): Promise<ChartDataPoint[]> => {
  try {
    const data = await readData<Record<string, ChartDataPoint>>(
      `clients/${clientId}/analytics/chartData`
    );
    if (data) {
      return Object.values(data);
    }
    return [];
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return [];
  }
};

export const subscribeToChartData = (
  clientId: string,
  callback: (data: ChartDataPoint[]) => void
): (() => void) => {
  return subscribeToData(
    `clients/${clientId}/analytics/chartData`,
    (data) => {
      if (data) {
        callback(Object.values(data as Record<string, ChartDataPoint>));
      } else {
        callback([]);
      }
    }
  );
};

export const getRevenueData = async (clientId: string): Promise<RevenueDataPoint[]> => {
  try {
    const data = await readData<Record<string, RevenueDataPoint>>(
      `clients/${clientId}/analytics/revenueData`
    );
    if (data) {
      return Object.values(data);
    }
    return [];
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return [];
  }
};

export const subscribeToRevenueData = (
  clientId: string,
  callback: (data: RevenueDataPoint[]) => void
): (() => void) => {
  return subscribeToData(
    `clients/${clientId}/analytics/revenueData`,
    (data) => {
      if (data) {
        callback(Object.values(data as Record<string, RevenueDataPoint>));
      } else {
        callback([]);
      }
    }
  );
};

/**
 * LEADS DATA
 */

export const getLeads = async (clientId: string): Promise<Lead[]> => {
  try {
    const data = await readData<Record<string, Lead>>(
      `clients/${clientId}/leads`
    );
    if (data) {
      return Object.entries(data).map(([id, lead]) => ({
        ...lead,
        id: lead.id || id,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
};

export const subscribeToLeads = (
  clientId: string,
  callback: (leads: Lead[]) => void
): (() => void) => {
  return subscribeToOrderedData(
    `clients/${clientId}/leads`,
    'date',
    100,
    (data) => {
      if (data) {
        callback(data as Lead[]);
      } else {
        callback([]);
      }
    }
  );
};

export const addLead = async (clientId: string, lead: Omit<Lead, 'id'>): Promise<string> => {
  try {
    return await addDocument(`clients/${clientId}/leads`, lead);
  } catch (error) {
    console.error('Error adding lead:', error);
    throw error;
  }
};

export const updateLead = async (
  clientId: string,
  leadId: string,
  updates: Partial<Lead>
): Promise<void> => {
  try {
    await updateData(`clients/${clientId}/leads/${leadId}`, updates);
  } catch (error) {
    console.error('Error updating lead:', error);
    throw error;
  }
};

/**
 * CONVERSATIONS DATA
 */

export const getConversations = async (clientId: string): Promise<Conversation[]> => {
  try {
    const data = await readData<Record<string, Conversation>>(
      `clients/${clientId}/conversations`
    );
    if (data) {
      return Object.entries(data).map(([id, conv]) => ({
        ...conv,
        id: conv.id || id,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

export const subscribeToConversations = (
  clientId: string,
  callback: (conversations: Conversation[]) => void
): (() => void) => {
  return subscribeToOrderedData(
    `clients/${clientId}/conversations`,
    'time',
    100,
    (data) => {
      if (data) {
        callback(data as Conversation[]);
      } else {
        callback([]);
      }
    }
  );
};

export const addMessage = async (
  clientId: string,
  conversationId: string,
  message: Message
): Promise<void> => {
  try {
    const messageId = Date.now().toString();
    await writeData(
      `clients/${clientId}/conversations/${conversationId}/messages/${messageId}`,
      message
    );
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
};

export const createConversation = async (
  clientId: string,
  conversation: Omit<Conversation, 'id'>
): Promise<string> => {
  try {
    return await addDocument(`clients/${clientId}/conversations`, conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

/**
 * PAYMENTS/INVOICES DATA
 */

export const getInvoices = async (clientId: string): Promise<Invoice[]> => {  try {
    const data = await readData<Record<string, Invoice>>(
      `clients/${clientId}/invoices`
    );
    if (data) {
      return Object.entries(data).map(([id, invoice]) => ({
        ...invoice,
        id: invoice.id || id,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
};

export const subscribeToInvoices = (
  clientId: string,
  callback: (invoices: Invoice[]) => void
): (() => void) => {
  return subscribeToOrderedData(
    `clients/${clientId}/invoices`,
    'createdAt',
    50,
    (data) => {
      if (data) {
        callback(data as Invoice[]);
      } else {
        callback([]);
      }
    }
  );
};

/**
 * WHATSAPP METRICS DATA
 */

export interface WhatsAppMetrics {
  messagesCount: number;
  resolutionRate: number;
  responseTime: string;
  quotaUsed: number;
  qualityRating: 'High' | 'Medium' | 'Low' | 'Unknown';
}

export const subscribeToWhatsAppMetrics = (
  clientId: string,
  callback: (metrics: WhatsAppMetrics) => void
): (() => void) => {
  return subscribeToData(
    `clients/${clientId}/whatsapp/metrics`,
    (data) => {
      if (data) {
        callback(data as WhatsAppMetrics);
      } else {
        callback({
          messagesCount: 0,
          resolutionRate: 0,
          responseTime: '---',
          quotaUsed: 0,
          qualityRating: 'Unknown'
        });
      }
    }
  );
};

/**
 * TRAINING FILES DATA
 */

export const getTrainingFiles = async (clientId: string): Promise<TrainingFile[]> => {
  try {
    const data = await readData<Record<string, TrainingFile>>(
      `clients/${clientId}/trainingFiles`
    );
    if (data) {
      return Object.entries(data).map(([id, file]) => ({
        ...file,
        id: file.id || id,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching training files:', error);
    return [];
  }
};

export const subscribeToTrainingFiles = (
  clientId: string,
  callback: (files: TrainingFile[]) => void
): (() => void) => {
  return subscribeToOrderedData(
    `clients/${clientId}/trainingFiles`,
    'uploadedAt',
    100,
    (data) => {
      if (data) {
        callback(data as TrainingFile[]);
      } else {
        callback([]);
      }
    }
  );
};

export const addTrainingFile = async (
  clientId: string,
  file: Omit<TrainingFile, 'id'>
): Promise<string> => {
  try {
    return await addDocument(`clients/${clientId}/trainingFiles`, file);
  } catch (error) {
    console.error('Error adding training file:', error);
    throw error;
  }
};

export const deleteTrainingFile = async (
  clientId: string,
  fileId: string
): Promise<void> => {
  try {
    await deleteData(`clients/${clientId}/trainingFiles/${fileId}`);
  } catch (error) {
    console.error('Error deleting training file:', error);
    throw error;
  }
};

/**
 * Sanitize a string so it is safe to use as a Realtime Database key.
 */
const sanitizeKey = (value: string): string =>
  value
    .replace(/[.#$/[\]]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase() || 'client';

export interface KnowledgeDocument {
  fileName: string;
  text: string;
  charCount: number;
  source: string;
  uploadedAt: string;
}

/**
 * Save extracted document text (as TXT) into the knowledge base, keyed by client.
 * Stored at: knowledgeBase/{clientName}/documents/{docId}
 */
export const saveKnowledgeDocument = async (
  clientName: string,
  clientId: string,
  doc: KnowledgeDocument
): Promise<string> => {
  try {
    const clientKey = sanitizeKey(clientName || clientId);
    const docId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await writeData(`knowledgeBase/${clientKey}/documents/${docId}`, {
      ...doc,
      id: docId,
      clientId,
    });
    return docId;
  } catch (error) {
    console.error('Error saving knowledge document:', error);
    throw error;
  }
};

/**
 * CLIENT PROFILE & SUBSCRIPTION
 */

export interface ClientProfile {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  jobTitle: string;
  plan: 'Free' | 'Starter' | 'Growth' | 'Enterprise';
  planStatus: 'active' | 'trialing' | 'past_due' | 'canceled';
  renewsAt: string;
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
}

const DEFAULT_PROFILE: ClientProfile = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  phone: '',
  jobTitle: '',
  plan: 'Starter',
  planStatus: 'active',
  renewsAt: '',
  card: null,
};

export const getClientProfile = async (clientId: string): Promise<ClientProfile> => {
  try {
    const data = await readData<Partial<ClientProfile>>(`clients/${clientId}/profile`);
    return { ...DEFAULT_PROFILE, ...(data || {}) };
  } catch (error) {
    console.error('Error fetching client profile:', error);
    return DEFAULT_PROFILE;
  }
};

export const saveClientProfile = async (
  clientId: string,
  profile: Partial<ClientProfile>
): Promise<void> => {
  try {
    await updateData(`clients/${clientId}/profile`, profile);
  } catch (error) {
    console.error('Error saving client profile:', error);
    throw error;
  }
};

/**
 * TEAM / MODERATORS
 */

export type TeamRole = 'Admin' | 'Moderator' | 'Viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: 'active' | 'invited' | 'suspended';
  invitedAt: string;
}

export const subscribeToTeamMembers = (
  clientId: string,
  callback: (members: TeamMember[]) => void
): (() => void) => {
  return subscribeToData(
    `clients/${clientId}/team`,
    (data) => {
      if (data) {
        const obj = data as Record<string, TeamMember>;
        callback(Object.entries(obj).map(([id, m]) => ({ ...m, id: m.id || id })));
      } else {
        callback([]);
      }
    }
  );
};

export const addTeamMember = async (
  clientId: string,
  member: Omit<TeamMember, 'id'>
): Promise<string> => {
  return addDocument(`clients/${clientId}/team`, member);
};

export const updateTeamMember = async (
  clientId: string,
  memberId: string,
  updates: Partial<TeamMember>
): Promise<void> => {
  await updateData(`clients/${clientId}/team/${memberId}`, updates);
};

export const removeTeamMember = async (
  clientId: string,
  memberId: string
): Promise<void> => {
  await deleteData(`clients/${clientId}/team/${memberId}`);
};

/**
 * NOTIFICATION PREFERENCES
 */

export interface NotificationPrefs {
  emailNewLead: boolean;
  emailWeeklyReport: boolean;
  emailProductUpdates: boolean;
  emailBilling: boolean;
  pushNewMessage: boolean;
  pushMentions: boolean;
  pushSystemAlerts: boolean;
  smsCritical: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailNewLead: true,
  emailWeeklyReport: true,
  emailProductUpdates: false,
  emailBilling: true,
  pushNewMessage: true,
  pushMentions: true,
  pushSystemAlerts: true,
  smsCritical: false,
};

export const getNotificationPrefs = async (clientId: string): Promise<NotificationPrefs> => {
  try {
    const data = await readData<Partial<NotificationPrefs>>(`clients/${clientId}/notificationPrefs`);
    return { ...DEFAULT_NOTIFICATION_PREFS, ...(data || {}) };
  } catch (error) {
    console.error('Error fetching notification prefs:', error);
    return DEFAULT_NOTIFICATION_PREFS;
  }
};

export const saveNotificationPrefs = async (
  clientId: string,
  prefs: Partial<NotificationPrefs>
): Promise<void> => {
  await updateData(`clients/${clientId}/notificationPrefs`, prefs);
};

/**
 * NOTIFICATIONS (inbox)
 */

export type NotificationType = 'lead' | 'message' | 'system' | 'billing';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export const subscribeToNotifications = (
  clientId: string,
  callback: (items: AppNotification[]) => void
): (() => void) => {
  return subscribeToOrderedData(
    `clients/${clientId}/notifications`,
    'createdAt',
    100,
    (data) => callback((data as AppNotification[]) || [])
  );
};

export const addNotification = async (
  clientId: string,
  n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
): Promise<string> => {
  return addDocument(`clients/${clientId}/notifications`, {
    ...n,
    read: false,
    createdAt: new Date().toISOString(),
  });
};

export const markNotificationRead = async (clientId: string, id: string): Promise<void> => {
  await updateData(`clients/${clientId}/notifications/${id}`, { read: true });
};

export const markAllNotificationsRead = async (clientId: string, ids: string[]): Promise<void> => {
  await Promise.all(ids.map((id) => updateData(`clients/${clientId}/notifications/${id}`, { read: true })));
};

export const deleteNotification = async (clientId: string, id: string): Promise<void> => {
  await deleteData(`clients/${clientId}/notifications/${id}`);
};

/**
 * SUMMARY/DASHBOARD DATA
 */

export const getDashboardSummary = async (
  clientId: string
): Promise<{
  totalLeads: number;
  activeConversations: number;
  totalRevenue: number;
  avgLeadScore: number;
}> => {
  try {
    const [leads, conversations] = await Promise.all([
      getLeads(clientId),
      getConversations(clientId),
    ]);

    const avgScore =
      leads.length > 0
        ? leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length
        : 0;

    return {
      totalLeads: leads.length,
      activeConversations: conversations.filter((c) => c.status === 'Active').length,
      totalRevenue: 0, // Calculate from invoices if needed
      avgLeadScore: Math.round(avgScore),
    };
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return {
      totalLeads: 0,
      activeConversations: 0,
      totalRevenue: 0,
      avgLeadScore: 0,
    };
  }
};

/**
 * WHATSAPP CONFIGURATION
 */

export interface WhatsAppConfig {
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  apiAccessToken: string;
  isConnected: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WhatsAppMetrics {
  messagesCount: number;
  resolutionRate: number;
  responseTime: string;
  quotaUsed: number;
  qualityRating: string;
}

export const subscribeToWhatsAppConfig = (
  clientId: string,
  callback: (data: WhatsAppConfig | null) => void
): (() => void) => {
  return subscribeToData(
    `whatsappConfigs/${clientId}`,
    (data) => {
      callback(data as WhatsAppConfig | null);
    }
  );
};
