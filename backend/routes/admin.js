/**
 * Admin Routes for KYLO-AI
 * Provides admin-specific endpoints for session management, analytics, and reporting
 * 
 * All endpoints require admin authentication (verified via Firebase ID token)
 * 
 * Endpoints:
 * - GET /sessions                    - List all sessions (paginated, filterable)
 * - GET /sessions/{id}               - Get session details
 * - PATCH /sessions/{id}             - Update session (notes, tags, priority)
 * - GET /sessions/{id}/transcript    - Get full conversation transcript
 * - POST /escalate/{id}              - Manual escalation
 * - GET /analytics                   - Dashboard analytics summary
 * - GET /analytics/trends            - Time-series analytics trends
 * - POST /export/sessions            - Export sessions to CSV/JSON/XLSX
 */

const express = require('express');
const admin = require('firebase-admin');
const { db } = require('../services/firebaseService');

const router = express.Router();

/**
 * Firestore Collections
 */
const sessionsCollection = () => db.collection('kylo-ai').doc('prod').collection('sessions');
const escalationsCollection = () => db.collection('kylo-ai').doc('prod').collection('escalations');
const auditLogsCollection = () => db.collection('kylo-ai').doc('prod').collection('audit-logs');

/**
 * Middleware: Verify Admin Authentication
 * TODO: Implement Firebase ID token verification
 * For now, allow all requests (add auth in production)
 */
async function verifyAdmin(req, res, next) {
  try {
    // TODO: Extract and verify Firebase ID token from Authorization header
    // const token = req.headers.authorization?.split(' ')[1];
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // Verify user is admin (check custom claims or Firestore document)
    
    // For development, skip verification
    req.userId = 'admin-dev'; // Placeholder
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized', details: error.message });
  }
}

// Apply auth middleware to all routes
router.use(verifyAdmin);

/**
 * API 1: GET /api/kylo/admin/sessions
 * List all sessions with optional filters and pagination
 */
router.get('/sessions', async (req, res) => {
  try {
    const { 
      status,           // Filter: active, completed, escalated, paused
      startDate,        // Filter: ISO date string
      endDate,          // Filter: ISO date string
      searchTerm,       // Filter: phone/email search
      page = 1,         // Pagination: page number (1-based)
      limit = 20        // Pagination: items per page
    } = req.query;

    let query = sessionsCollection();

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }
    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate));
    }

    // Order by creation date (most recent first)
    query = query.orderBy('createdAt', 'desc');

    // Get total count
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const offset = (pageNum - 1) * pageSize;

    // Get paginated results
    let snapshot = await query.offset(offset).limit(pageSize).get();
    let sessions = snapshot.docs.map(doc => ({
      sessionId: doc.id,
      phoneNumber: doc.data().phoneNumber || 'N/A',
      status: doc.data().status,
      currentStep: doc.data().currentStep || 0,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt,
      lastMessage: doc.data().lastMessage || '',
    }));

    // Apply search filter (client-side for simplicity)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      sessions = sessions.filter(s => 
        s.phoneNumber.toLowerCase().includes(term) ||
        s.sessionId.toLowerCase().includes(term)
      );
    }

    res.json({
      sessions,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('[ADMIN_SESSIONS_LIST] Error:', error.message);
    res.status(500).json({ error: 'Failed to list sessions', details: error.message });
  }
});

/**
 * API 2: GET /api/kylo/admin/sessions/{id}
 * Get full session details
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const sessionDoc = await sessionsCollection().doc(sessionId).get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found', sessionId });
    }

    const sessionData = sessionDoc.data();

    res.json({
      sessionId,
      ...sessionData,
      createdAt: sessionData.createdAt || null,
      updatedAt: sessionData.updatedAt || null,
    });
  } catch (error) {
    console.error('[ADMIN_SESSION_DETAILS] Error:', error.message);
    res.status(500).json({ error: 'Failed to get session', details: error.message });
  }
});

/**
 * API 3: PATCH /api/kylo/admin/sessions/{id}
 * Update session (admin notes, tags, priority)
 */
router.patch('/sessions/:id', async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { adminNotes, tags, priority } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Validate session exists
    const sessionDoc = await sessionsCollection().doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found', sessionId });
    }

    // Build update object (only include provided fields)
    const updateData = {};
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (priority !== undefined) updateData.priority = priority;
    
    // Always update timestamp
    updateData.updatedAt = new Date();
    updateData.updatedBy = req.userId;

    // Perform update
    await sessionsCollection().doc(sessionId).update(updateData);

    res.json({
      success: true,
      sessionId,
      updated: true,
      updatedFields: Object.keys(updateData).filter(k => k !== 'updatedAt' && k !== 'updatedBy')
    });
  } catch (error) {
    console.error('[ADMIN_SESSION_UPDATE] Error:', error.message);
    res.status(500).json({ error: 'Failed to update session', details: error.message });
  }
});

/**
 * API 4: GET /api/kylo/admin/sessions/{id}/transcript
 * Get full conversation transcript/message history
 */
router.get('/sessions/:id/transcript', async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const sessionDoc = await sessionsCollection().doc(sessionId).get();

    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found', sessionId });
    }

    const sessionData = sessionDoc.data();
    const messages = sessionData.conversationHistory || [];

    // Ensure messages are properly formatted
    const formattedMessages = messages.map((msg, index) => ({
      messageId: msg.messageId || `msg-${index}`,
      sender: msg.sender || 'unknown',
      text: msg.text || msg.content || '',
      timestamp: msg.timestamp || msg.createdAt,
      step: msg.step || null,
      type: msg.type || 'text', // text, file, image, etc
    }));

    res.json({
      sessionId,
      phoneNumber: sessionData.phoneNumber,
      status: sessionData.status,
      currentStep: sessionData.currentStep,
      messages: formattedMessages,
      totalMessages: formattedMessages.length,
      startedAt: sessionData.createdAt,
      lastMessageAt: formattedMessages.length > 0 
        ? formattedMessages[formattedMessages.length - 1].timestamp 
        : null
    });
  } catch (error) {
    console.error('[ADMIN_SESSION_TRANSCRIPT] Error:', error.message);
    res.status(500).json({ error: 'Failed to get transcript', details: error.message });
  }
});

/**
 * API 5: POST /api/kylo/admin/escalate/{id}
 * Manual escalation of a session to human review
 */
router.post('/escalate/:id', async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { reason, assignedTo, notes } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    // Validate session exists
    const sessionDoc = await sessionsCollection().doc(sessionId).get();
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found', sessionId });
    }

    const now = new Date();

    // Update session status
    await sessionsCollection().doc(sessionId).update({
      status: 'escalated',
      escalationTracking: {
        reason,
        assignedTo: assignedTo || null,
        notes: notes || '',
        escalatedAt: now,
        escalatedBy: req.userId,
        status: 'pending' // pending, assigned, resolved
      },
      updatedAt: now
    });

    // Create escalation record
    const escalationId = `esc-${Date.now()}`;
    await escalationsCollection().doc(escalationId).set({
      sessionId,
      reason,
      assignedTo: assignedTo || null,
      notes: notes || '',
      escalatedAt: now,
      escalatedBy: req.userId,
      status: 'pending',
      createdAt: now
    });

    // Log to audit
    await auditLogsCollection().add({
      action: 'session_escalated',
      sessionId,
      escalationId,
      reason,
      performedBy: req.userId,
      timestamp: now
    });

    res.json({
      success: true,
      escalationId,
      sessionId,
      escalatedAt: now.toISOString(),
      status: 'pending'
    });
  } catch (error) {
    console.error('[ADMIN_ESCALATE] Error:', error.message);
    res.status(500).json({ error: 'Failed to escalate session', details: error.message });
  }
});

/**
 * API 6: GET /api/kylo/admin/analytics
 * Get dashboard analytics summary
 */
router.get('/analytics', async (req, res) => {
  try {
    // Get all sessions
    const allSessionsSnapshot = await sessionsCollection().get();
    const sessions = allSessionsSnapshot.docs.map(doc => doc.data());

    // Calculate summary statistics
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const escalatedSessions = sessions.filter(s => s.status === 'escalated').length;
    const pausedSessions = sessions.filter(s => s.status === 'paused').length;

    const successRate = totalSessions > 0 
      ? Math.round((completedSessions / totalSessions) * 100) 
      : 0;

    const averageStepsCompleted = totalSessions > 0
      ? (sessions.reduce((sum, s) => sum + (s.currentStep || 0), 0) / totalSessions).toFixed(1)
      : 0;

    // Get escalations
    const escalationsSnapshot = await escalationsCollection().get();
    const escalations = escalationsSnapshot.docs.map(doc => doc.data());

    // Count escalation reasons
    const topIssues = {};
    escalations.forEach(esc => {
      const reason = esc.reason || 'unknown';
      topIssues[reason] = (topIssues[reason] || 0) + 1;
    });

    const topIssuesList = Object.entries(topIssues)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      summary: {
        totalSessions,
        activeSessions,
        completedSessions,
        escalatedSessions,
        pausedSessions,
        successRate,
        averageStepsCompleted: parseFloat(averageStepsCompleted)
      },
      byStatus: {
        active: activeSessions,
        completed: completedSessions,
        escalated: escalatedSessions,
        paused: pausedSessions
      },
      topIssues: topIssuesList,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ADMIN_ANALYTICS] Error:', error.message);
    res.status(500).json({ error: 'Failed to get analytics', details: error.message });
  }
});

/**
 * API 7: GET /api/kylo/admin/analytics/trends
 * Get time-series analytics trends
 */
router.get('/analytics/trends', async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const periodDays = parseInt(period) || 30;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    startDate.setHours(0, 0, 0, 0);

    // Get sessions in period
    const snapshot = await sessionsCollection()
      .where('createdAt', '>=', startDate)
      .orderBy('createdAt')
      .get();

    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Group by date
    const dailyData = {};
    
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      dailyData[dateStr] = {
        date: dateStr,
        sessionsCreated: 0,
        sessionsCompleted: 0,
        escalations: 0,
        conversionRate: 0
      };
    }

    // Populate data
    sessions.forEach(session => {
      const dateStr = session.createdAt?.toISOString().split('T')[0] || '';
      if (dailyData[dateStr]) {
        dailyData[dateStr].sessionsCreated++;
        if (session.status === 'completed') {
          dailyData[dateStr].sessionsCompleted++;
        }
        if (session.status === 'escalated') {
          dailyData[dateStr].escalations++;
        }
      }
    });

    // Calculate conversion rates
    Object.values(dailyData).forEach(day => {
      day.conversionRate = day.sessionsCreated > 0
        ? Math.round((day.sessionsCompleted / day.sessionsCreated) * 100)
        : 0;
    });

    // Convert to array
    const data = Object.values(dailyData);

    // Calculate trend
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);

    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, d) => sum + d.sessionsCreated, 0) / firstHalf.length
      : 0;

    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, d) => sum + d.sessionsCreated, 0) / secondHalf.length
      : 0;

    const percentChange = firstHalfAvg > 0
      ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
      : 0;

    const direction = percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'stable';
    const momentum = direction === 'up' ? 'positive' : direction === 'down' ? 'negative' : 'neutral';

    res.json({
      period: `${periodDays}days`,
      data,
      trend: {
        direction,
        percentChange,
        momentum,
        firstHalfAvg: parseFloat(firstHalfAvg.toFixed(2)),
        secondHalfAvg: parseFloat(secondHalfAvg.toFixed(2))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ADMIN_TRENDS] Error:', error.message);
    res.status(500).json({ error: 'Failed to get trends', details: error.message });
  }
});

/**
 * API 8: POST /api/kylo/admin/export/sessions
 * Export sessions to CSV/JSON format
 */
router.post('/export/sessions', async (req, res) => {
  try {
    const {
      format = 'json',      // json, csv
      filters = {}
    } = req.body;

    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use json or csv' });
    }

    // Build query with filters
    let query = sessionsCollection();

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.startDate) {
      query = query.where('createdAt', '>=', new Date(filters.startDate));
    }
    if (filters.endDate) {
      query = query.where('createdAt', '<=', new Date(filters.endDate));
    }

    // Get sessions
    const snapshot = await query.get();
    const sessions = snapshot.docs.map(doc => ({
      sessionId: doc.id,
      phoneNumber: doc.data().phoneNumber || 'N/A',
      status: doc.data().status || 'unknown',
      currentStep: doc.data().currentStep || 0,
      createdAt: doc.data().createdAt?.toISOString() || '',
      updatedAt: doc.data().updatedAt?.toISOString() || '',
      adminNotes: doc.data().adminNotes || '',
      tags: Array.isArray(doc.data().tags) ? doc.data().tags.join(';') : ''
    }));

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'No sessions found matching filters' });
    }

    let exportData = '';
    let mimeType = 'application/json';
    let filename = `sessions-${new Date().toISOString().split('T')[0]}.json`;

    if (format === 'json') {
      exportData = JSON.stringify(sessions, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(sessions[0]);
      const rows = sessions.map(s => 
        headers.map(h => {
          const val = s[h] || '';
          // Escape quotes and wrap in quotes if contains comma
          return typeof val === 'string' && (val.includes(',') || val.includes('"'))
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        }).join(',')
      );
      exportData = [headers.join(','), ...rows].join('\n');
      mimeType = 'text/csv';
      filename = `sessions-${new Date().toISOString().split('T')[0]}.csv`;
    }

    res.json({
      success: true,
      format,
      filename,
      rowCount: sessions.length,
      data: format === 'json' ? sessions : exportData,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ADMIN_EXPORT] Error:', error.message);
    res.status(500).json({ error: 'Failed to export sessions', details: error.message });
  }
});

/**
 * Health check for admin routes
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'admin-api',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
