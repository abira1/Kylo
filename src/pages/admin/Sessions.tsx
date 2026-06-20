import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MoreVertical,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Flag,
} from 'lucide-react';
import {
  getSessionsList,
  escalateSession,
  updateSession,
  exportSessions,
  Session,
} from '../../services/adminApiService';

export function AdminSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 20 });

  // Load sessions on mount and when filters change
  useEffect(() => {
    loadSessions();
  }, [page, statusFilter, searchTerm]);

  async function loadSessions() {
    try {
      setLoading(true);
      setError(null);
      const response = await getSessionsList(page, 20, {
        status: statusFilter || undefined,
        searchTerm: searchTerm || undefined,
      });
      setSessions(response.sessions);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={18} className="text-green-500" />;
      case 'escalated':
        return <AlertCircle size={18} className="text-orange-500" />;
      case 'active':
        return <Clock size={18} className="text-blue-500" />;
      default:
        return <Clock size={18} className="text-gray-400" />;
    }
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'escalated':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100';
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
    }
  }

  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  }

  async function handleExport() {
    try {
      const result = await exportSessions('csv', {
        status: statusFilter || undefined,
      });
      alert(`Exported ${result.rowCount} sessions to ${result.filename}`);
    } catch (err) {
      alert('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  async function handleEscalate(sessionId: string) {
    const reason = prompt('Enter escalation reason:');
    if (!reason) return;

    try {
      await escalateSession(sessionId, {
        reason,
        assignedTo: 'admin@kylo.ai',
        notes: 'Escalated from admin dashboard',
      });
      alert('Session escalated successfully');
      loadSessions();
    } catch (err) {
      alert('Escalation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Application Sessions
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage WhatsApp business license applications and sessions.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary text-sm flex items-center gap-2 w-full sm:w-auto"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bento-card">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by phone or session ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="input-field pl-12 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input-field w-full sm:w-48"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="escalated">Escalated</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {/* Sessions Table */}
        {error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
            Error: {error}
          </div>
        ) : loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading sessions...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Phone
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Step
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Created
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr
                      key={session.sessionId}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-400" />
                          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                            {session.phoneNumber}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(session.status)}
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusBadgeColor(
                              session.status
                            )}`}
                          >
                            {session.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                        Step {session.currentStep}/18
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(session.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => {
                              setSelectedSession(session);
                              setShowDetails(true);
                            }}
                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleEscalate(session.sessionId)}
                            disabled={session.status === 'escalated'}
                            className={`p-2 rounded transition ${
                              session.status === 'escalated'
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                            }`}
                            title="Escalate"
                          >
                            <Flag size={16} />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {pagination.pages} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                    disabled={page === pagination.pages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Session Details Modal */}
      {showDetails && selectedSession && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Session Details
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Session ID</p>
                <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                  {selectedSession.sessionId}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                <p className="text-gray-900 dark:text-white">{selectedSession.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium capitalize inline-block ${getStatusBadgeColor(
                    selectedSession.status
                  )}`}
                >
                  {selectedSession.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Step</p>
                <p className="text-gray-900 dark:text-white">Step {selectedSession.currentStep} of 18</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                <p className="text-gray-900 dark:text-white">{formatDate(selectedSession.createdAt)}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
