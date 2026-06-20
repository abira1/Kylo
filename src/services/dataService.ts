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
}

export interface TrainingFile {
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

export const getInvoices = async (clientId: string): Promise<Invoice[]> => {
  try {
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
