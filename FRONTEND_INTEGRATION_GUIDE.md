# KYLO-AI Frontend Modernization & API Integration Guide

**Purpose:** Convert frontend from mock data to real backend API calls  
**Timeline:** 2-3 weeks after backend is ready  
**Priority:** HIGH - Critical for data persistence

---

## 🎯 QUICK WINS (First Week)

### 1. Set Up API Client & React Query

#### Step 1.1: Install Dependencies

```bash
npm install \
  axios \
  @tanstack/react-query \
  zustand \
  zod \
  @hookform/resolvers \
  react-hook-form \
  sonner \
  react-error-boundary
```

#### Step 1.2: Create API Client

**File: `src/api/client.ts`**

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle token refresh & errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Try refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        // Retry original request with new token
        apiClient.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### Step 1.3: Create API Service Layer

**File: `src/api/services/auth.service.ts`**

```typescript
import { apiClient } from '../client';
import { z } from 'zod';

// DTOs (match backend)
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const authService = {
  async register(data: RegisterInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};
```

**File: `src/api/services/leads.service.ts`**

```typescript
import { apiClient } from '../client';
import { z } from 'zod';

export const LeadSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  company: z.string().optional(),
  phoneNumber: z.string().optional(),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Won', 'Lost']),
  source: z.string(),
  score: z.number().min(0).max(100),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Lead = z.infer<typeof LeadSchema>;

export const CreateLeadSchema = LeadSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}

export const leadsService = {
  async getLeads(
    skip = 0,
    take = 20,
    filters?: { status?: string; source?: string }
  ): Promise<PaginatedResponse<Lead>> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('take', take.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.source) params.append('source', filters.source);

    const response = await apiClient.get<[Lead[], number]>(
      `/leads?${params}`
    );
    const [leads, total] = response.data;
    return { data: leads, total, skip, take };
  },

  async getLead(id: string): Promise<Lead> {
    const response = await apiClient.get<Lead>(`/leads/${id}`);
    return response.data;
  },

  async createLead(data: CreateLeadInput): Promise<Lead> {
    const response = await apiClient.post<Lead>('/leads', data);
    return response.data;
  },

  async updateLead(id: string, data: Partial<CreateLeadInput>): Promise<Lead> {
    const response = await apiClient.put<Lead>(`/leads/${id}`, data);
    return response.data;
  },

  async deleteLead(id: string): Promise<void> {
    await apiClient.delete(`/leads/${id}`);
  },

  async getLeadStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    const response = await apiClient.get('/leads/stats');
    return response.data;
  },
};
```

**File: `src/api/services/analytics.service.ts`**

```typescript
import { apiClient } from '../client';

export interface AnalyticsOverview {
  totalVisitors: number;
  conversations: number;
  leadsCapture: number;
  avgResponseTime: number;
}

export interface ChartDataPoint {
  name: string;
  visitors: number;
  interactions: number;
  leads: number;
}

export const analyticsService = {
  async getOverview(): Promise<AnalyticsOverview> {
    const response = await apiClient.get<AnalyticsOverview>(
      '/analytics/overview'
    );
    return response.data;
  },

  async getEngagementChart(days = 7): Promise<ChartDataPoint[]> {
    const response = await apiClient.get<ChartDataPoint[]>(
      `/analytics/engagement?days=${days}`
    );
    return response.data;
  },

  async getConversionMetrics(): Promise<{
    total: number;
    converted: number;
    conversionRate: string;
  }> {
    const response = await apiClient.get('/analytics/conversion');
    return response.data;
  },
};
```

#### Step 1.4: Create Zustand Store for Auth

**File: `src/store/authStore.ts`**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../api/services/auth.service';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Login failed';
          set({
            error: message,
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (
        email: string,
        password: string,
        firstName: string,
        lastName: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({
            email,
            password,
            firstName,
            lastName,
          });
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Registration failed';
          set({
            error: message,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

#### Step 1.5: Create React Query hooks

**File: `src/hooks/useLeads.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsService, Lead, CreateLeadInput } from '../api/services/leads.service';
import { useCallback } from 'react';

export function useLeads(
  skip = 0,
  take = 20,
  filters?: { status?: string; source?: string }
) {
  return useQuery({
    queryKey: ['leads', skip, take, filters],
    queryFn: () => leadsService.getLeads(skip, take, filters),
    placeholderData: { data: [], total: 0, skip, take },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: () => leadsService.getLead(id),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeadInput) => leadsService.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    },
  });
}

export function useUpdateLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateLeadInput>) =>
      leadsService.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsService.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    },
  });
}

export function useLeadStats() {
  return useQuery({
    queryKey: ['leads-stats'],
    queryFn: () => leadsService.getLeadStats(),
  });
}
```

**File: `src/hooks/useAnalytics.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../api/services/analytics.service';

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsService.getOverview(),
  });
}

export function useEngagementChart(days = 7) {
  return useQuery({
    queryKey: ['analytics-engagement', days],
    queryFn: () => analyticsService.getEngagementChart(days),
  });
}

export function useConversionMetrics() {
  return useQuery({
    queryKey: ['analytics-conversion'],
    queryFn: () => analyticsService.getConversionMetrics(),
  });
}
```

### 2. Update Pages to Use API Data

#### Update Login Page

**File: `src/pages/Login.tsx` (Updated)**

```typescript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema } from '../api/services/auth.service';
import { useAuthStore } from '../store/authStore';
import { Toaster, toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      await login(data.email, data.password);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-navy-950">
      <Toaster />
      
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full mx-auto">
          
          <Link to="/" className="flex items-center gap-3 mb-16">
            <img
              src="https://i.postimg.cc/FzSqZJPg/97724688056.png"
              alt="KYLO-AI"
              className="h-8 w-auto dark:hidden"
            />
            <img
              src="https://i.postimg.cc/gjRDJSW5/high-level-description-a-dark-mode-wordm-As-Wztl-DXWm-G91n-AY-i-MLQ-b-Wl27DVTe6f8Pxy6g-Wv-Lw.png"
              alt="KYLO-AI"
              className="h-8 w-auto hidden dark:block"
            />
          </Link>

          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Welcome back
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 font-medium">
            Enter your details to access your dashboard.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="label-text">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  {...register('email')}
                  className="input-field pl-12"
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="label-text !mb-0">Password</label>
                <a
                  href="#"
                  className="text-sm font-bold text-emerald-600 dark:text-cyan-400 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="password"
                  {...register('password')}
                  className="input-field pl-12"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 mt-6 text-lg disabled:opacity-50">
              {isLoading ? 'Signing in...' : <>Sign In <ArrowRight size={20} /></>}
            </button>
          </form>

          <p className="mt-10 text-center text-gray-600 dark:text-gray-400 font-medium">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-emerald-600 dark:text-cyan-400 hover:underline">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Marketing (existing code) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-600 to-cyan-600 items-center justify-center">
        {/* Existing right side content */}
      </div>
    </div>
  );
}
```

#### Update Dashboard Home Page

**File: `src/pages/dashboard/Home.tsx` (Updated)**

```typescript
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAnalyticsOverview, useEngagementChart, useLeadStats } from '../../hooks';
import { Toaster, toast } from 'sonner';
import ErrorBoundary from '../../components/ErrorBoundary';

function KPICard({
  title,
  value,
  trend,
  isPositive,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: any;
  color: string;
}) {
  const colorClass = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600',
    turquoise: 'bg-turquoise-100 dark:bg-turquoise-900/30 text-turquoise-600',
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {value}
          </h3>
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${
              isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {trend}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );
}

export function Home() {
  const { data: overview, isLoading: overviewLoading, error: overviewError } =
    useAnalyticsOverview();
  const { data: chartData, isLoading: chartLoading } = useEngagementChart(7);
  const { data: leadStats } = useLeadStats();

  if (overviewError) {
    toast.error('Failed to load analytics');
  }

  return (
    <ErrorBoundary>
      <Toaster />
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Here's what's happening with your AI assistants today.
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button className="btn-secondary text-xs sm:text-sm flex-1 sm:flex-none">
              Download Report
            </button>
            <button className="btn-primary text-xs sm:text-sm flex-1 sm:flex-none">
              New Chatbot
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {overviewLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bento-card h-40 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
        ) : overview ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <KPICard
              title="Total Visitors"
              value={overview.totalVisitors.toString()}
              trend="+12.5%"
              isPositive={true}
              icon={Users}
              color="emerald"
            />
            <KPICard
              title="Conversations"
              value={overview.conversations.toString()}
              trend="+5.2%"
              isPositive={true}
              icon={MessageSquare}
              color="turquoise"
            />
            <KPICard
              title="Leads Captured"
              value={leadStats?.total.toString() || '0'}
              trend="-2.1%"
              isPositive={false}
              icon={Zap}
              color="cyan"
            />
            <KPICard
              title="Avg. Response Time"
              value={`${overview.avgResponseTime}s`}
              trend="+18.4%"
              isPositive={true}
              icon={Clock}
              color="emerald"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Main Chart */}
          <div className="bento-card lg:col-span-2">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Engagement Overview
              </h2>
              <select className="bg-gray-50 dark:bg-navy-900 border-none rounded-xl px-3 py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>This Year</option>
              </select>
            </div>
            {chartLoading || !chartData ? (
              <div className="h-56 sm:h-72 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ) : (
              <div className="h-56 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorVisitors)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Sidebar Cards */}
          <div className="space-y-4 sm:gap-5 flex flex-col">
            {/* Recent leads placeholder */}
            <div className="bento-card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Recent Leads
              </h3>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-sm">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
```

#### Update Leads Page

**File: `src/pages/dashboard/Leads.tsx` (New)**

```typescript
import React, { useState } from 'react';
import { useLeads, useCreateLead, useDeleteLead } from '../../hooks/useLeads';
import { Toaster, toast } from 'sonner';
import { motion } from 'framer-motion';
import { Trash2, Plus } from 'lucide-react';
import ErrorBoundary from '../../components/ErrorBoundary';

export function Leads() {
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useLeads(page * 20, 20);
  const createMutation = useCreateLead();
  const deleteMutation = useDeleteLead();

  const handleCreateLead = async () => {
    // Example: Show form modal or inline form
    try {
      await createMutation.mutateAsync({
        name: 'Test Lead',
        email: `lead-${Date.now()}@example.com`,
        company: 'Test Company',
        status: 'New',
        source: 'API',
        score: 75,
      });
      toast.success('Lead created!');
    } catch (err) {
      toast.error('Failed to create lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteMutation.mutateAsync(leadId);
      toast.success('Lead deleted');
    } catch (err) {
      toast.error('Failed to delete lead');
    }
  };

  if (error) return <div className="text-red-600">Error loading leads</div>;

  return (
    <ErrorBoundary>
      <Toaster />
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Lead Inbox
          </h1>
          <button
            onClick={handleCreateLead}
            className="btn-primary flex items-center gap-2">
            <Plus size={20} /> New Lead
          </button>
        </div>

        {isLoading ? (
          <div className="bento-card p-8 text-center">
            <p className="text-gray-500">Loading leads...</p>
          </div>
        ) : (
          <>
            <div className="bento-card overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left p-4 font-semibold">Name</th>
                    <th className="text-left p-4 font-semibold">Email</th>
                    <th className="text-left p-4 font-semibold">Company</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Score</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((lead) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-navy-700/50">
                      <td className="p-4">{lead.name}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {lead.email}
                      </td>
                      <td className="p-4 text-sm">{lead.company}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            lead.status === 'Qualified'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-4">{lead.score}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="text-red-600 hover:text-red-700">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-secondary disabled:opacity-50">
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page + 1} • {data?.total} total leads
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!data || (page + 1) * 20 >= data.total}
                className="btn-secondary disabled:opacity-50">
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
```

### 3. Setup Environment Configuration

**File: `.env.example` (Frontend)**

```env
VITE_API_URL=http://localhost:3000/api
VITE_FRONTEND_URL=http://localhost:5173
```

**File: `.env.local` (Development)**

```env
VITE_API_URL=http://localhost:3000/api
VITE_FRONTEND_URL=http://localhost:5173
```

### 4. Create Error Boundary Component

**File: `src/components/ErrorBoundary.tsx`**

```typescript
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bento-card p-6 flex items-start gap-4">
          <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary mt-4">
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 5. Setup React Query Provider

**File: `src/App.tsx` (Updated)**

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/ThemeProvider';
import { DashboardLayout } from './components/DashboardLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
// ... other imports

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* ... other routes */}
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

---

## 📋 CHECKLIST FOR IMPLEMENTATION

### Week 1: Setup
- [ ] Install all dependencies
- [ ] Create API client with interceptors
- [ ] Create service layer for all modules
- [ ] Create Zustand auth store
- [ ] Create React Query hooks
- [ ] Setup error boundary
- [ ] Setup React Query provider in App
- [ ] Create .env files

### Week 2: Update Pages
- [ ] Update Login page
- [ ] Update Register page
- [ ] Update Dashboard Home page
- [ ] Update Leads page
- [ ] Update Conversations page
- [ ] Update Analytics page
- [ ] Update Settings page

### Week 3: Polish & Testing
- [ ] Test all API integrations
- [ ] Test authentication flow
- [ ] Test error handling
- [ ] Test loading states
- [ ] Test pagination
- [ ] Remove all mock data imports
- [ ] Update any remaining hardcoded values

---

## 🎉 AFTER IMPLEMENTATION

**Results:**
- ✅ Real data persistence
- ✅ Actual authentication
- ✅ User isolation (can't see others' data)
- ✅ Production-ready frontend
- ✅ Proper error handling
- ✅ Loading states & UX
- ✅ API integration complete
- ✅ Ready for deployment

---

**This guide should take 2-3 weeks after backend is ready.**
