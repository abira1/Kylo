/**
 * Session Manager Service for AS AI Agent
 * Manages all session state for WhatsApp-based UAE Business License Application flow
 * 
 * Responsibilities:
 * - Create and initialize sessions
 * - Manage session state (step progression, collected fields)
 * - Track pending items and documents
 * - Handle shareholder loops
 * - Log all actions for audit trail
 */

const admin = require('firebase-admin');
const { db } = require('./firebaseService');
const cache = require('./cacheService');

/**
 * Firestore Collection Reference
 */
const sessionsCollection = () => db.collection('kylo-ai').doc('prod').collection('sessions');
const escalationsCollection = () => db.collection('kylo-ai').doc('prod').collection('escalations');
const auditLogsCollection = () => db.collection('kylo-ai').doc('prod').collection('audit-logs');

/**
 * Initialize session state structure
 */
function initializeSessionState() {
  return {
    currentStep: 1,                    // 1-18
    status: 'active',                  // active, paused, escalated, completed
    language: 'en',                    // en or ar
    
    // Collected fields (all form data)
    collectedFields: {
      // Personal Data
      firstName: null,
      lastName: null,
      email: null,
      phone: null,
      passportNumber: null,
      passportExpiry: null,
      nationality: null,
      dateOfBirth: null,
      
      // Address
      address: null,
      city: null,
      country: null,
      
      // UAE Entry Status
      uaeEntryStatus: null,            // visa, residency, visit, etc
      visaType: null,
      residencyExpiry: null,
      
      // Company
      businessName: null,
      businessActivityCode: null,
      businessActivityDescription: null,
      businessLocation: null,
      numberOfShareholders: null,
      
      // Management Structure
      manager: null,
      director: null,
      ublList: [],                     // Ultimate Beneficial Owners
      
      // Compliance
      sourceOfFunds: null,
      businessRationale: null,
      previousAML: null,
    },
    
    // Document tracking
    documents: {
      passport: {
        fileUrl: null,
        uploadedAt: null,
        extractedData: null,
        status: 'pending',              // pending, extracted, verified
      },
      visa: {
        fileUrl: null,
        uploadedAt: null,
        extractedData: null,
        status: 'pending',
      },
      residency: {
        fileUrl: null,
        uploadedAt: null,
        extractedData: null,
        status: 'pending',
      },
      bankStatements: {
        fileUrl: null,
        uploadedAt: null,
        extractedData: null,
        status: 'pending',
      },
    },
    
    // Pending items (outstanding items to collect)
    pendingItems: [],                  // e.g., ['visa_copy', 'bank_statements']
    
    // Shareholder tracking for multi-shareholder loops
    shareholderQueue: [],              // Additional shareholders if count disputed
    currentShareholder: null,
    shareholdersProcessed: [],
    
    // OTP & Verification
    otpVerified: false,
    otpAttempts: 0,
    otpExpiresAt: null,
    
    // Escalation tracking
    escalated: false,
    escalationReason: null,
    escalationNotes: null,
    escalationResolvedAt: null,
    
    // Metadata
    metadata: {
      createdAt: null,
      updatedAt: null,
      lastActivityAt: null,
      completedAt: null,
      totalInteractions: 0,
      currentInteractionLength: 0,
    }
  };
}

/**
 * CREATE SESSION
 * Initialize a new AS AI session
 */
async function createSession(clientId, cspId, phoneNumber, jurisdiction = 'UAE') {
  try {
    if (!clientId || !cspId || !phoneNumber) {
      throw new Error('clientId, cspId, and phoneNumber are required');
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = admin.firestore.Timestamp.now();

    const sessionData = {
      sessionId,
      clientId,
      cspId,
      phoneNumber,
      jurisdiction,
      state: initializeSessionState(),
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };

    await sessionsCollection().doc(sessionId).set(sessionData);

    // Cache the session (10 min TTL)
    await cache.session.set(sessionId, sessionData);

    console.log(`[SESSION_MANAGER] Session created: ${sessionId} for client ${clientId}`);

    // Log action in audit trail
    await logAction(sessionId, 'SESSION_CREATED', { clientId, cspId, phoneNumber, jurisdiction });

    return {
      sessionId,
      ...sessionData,
      state: sessionData.state
    };
  } catch (error) {
    console.error('[SESSION_MANAGER] Error creating session:', error.message);
    throw error;
  }
}

/**
 * GET SESSION
 * Retrieve session state (with cache-aside pattern)
 */
async function getSession(sessionId) {
  try {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    // Try cache first (cache-aside pattern)
    const cached = await cache.session.get(sessionId);
    if (cached) {
      console.log(`[SESSION_MANAGER] Cache HIT for session ${sessionId}`);
      return cached;
    }

    console.log(`[SESSION_MANAGER] Cache MISS for session ${sessionId}, fetching from Firestore`);

    // Not in cache, fetch from Firestore
    const sessionDoc = await sessionsCollection().doc(sessionId).get();

    if (!sessionDoc.exists) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const sessionData = sessionDoc.data();

    // Cache for next time
    await cache.session.set(sessionId, sessionData);

    return sessionData;
  } catch (error) {
    console.error('[SESSION_MANAGER] Error getting session:', error.message);
    throw error;
  }
}

/**
 * UPDATE SESSION
 * Update entire session data
 */
async function updateSession(sessionId, updates) {
  try {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    const now = admin.firestore.Timestamp.now();

    await sessionsCollection().doc(sessionId).update({
      ...updates,
      updatedAt: now,
      lastActivityAt: now,
    });

    console.log(`[SESSION_MANAGER] Session updated: ${sessionId}`);

    return await getSession(sessionId);
  } catch (error) {
    console.error('[SESSION_MANAGER] Error updating session:', error.message);
    throw error;
  }
}

/**
 * UPDATE STEP
 * Move to next step
 */
async function updateStep(sessionId, newStep) {
  try {
    if (!sessionId || !newStep) {
      throw new Error('sessionId and newStep are required');
    }

    if (newStep < 1 || newStep > 18) {
      throw new Error('Step must be between 1 and 18');
    }

    const session = await getSession(sessionId);
    const oldStep = session.state.currentStep;

    const newState = { ...session.state };
    newState.currentStep = newStep;
    newState.metadata.lastActivityAt = new Date().toISOString();

    await updateSession(sessionId, { state: newState });

    console.log(`[SESSION_MANAGER] Step changed ${oldStep} → ${newStep} for session ${sessionId}`);
    await logAction(sessionId, 'STEP_CHANGED', { oldStep, newStep });

    return await getSession(sessionId);
  } catch (error) {
    console.error('[SESSION_MANAGER] Error updating step:', error.message);
    throw error;
  }
}

/**
 * ADD COLLECTED FIELD
 * Add user-provided data to session
 */
async function addCollectedField(sessionId, fieldName, value) {
  try {
    if (!sessionId || !fieldName) {
      throw new Error('sessionId and fieldName are required');
    }

    const session = await getSession(sessionId);
    const newState = { ...session.state };

    // Nested field support (e.g., 'documents.passport.fileUrl')
    const keys = fieldName.split('.');
    let current = newState.collectedFields;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;

    newState.metadata.lastActivityAt = new Date().toISOString();

    await updateSession(sessionId, { state: newState });

    console.log(`[SESSION_MANAGER] Field added: ${fieldName} = ${JSON.stringify(value).substring(0, 50)}...`);
    await logAction(sessionId, 'FIELD_ADDED', { fieldName, value });

    return await getSession(sessionId);
  } catch (error) {
    console.error('[SESSION_MANAGER] Error adding field:', error.message);
    throw error;
  }
}

/**
 * ADD DOCUMENT
 * Track uploaded document
 */
async function addDocument(sessionId, documentType, fileUrl, extractedData = null) {
  try {
    if (!sessionId || !documentType || !fileUrl) {
      throw new Error('sessionId, documentType, and fileUrl are required');
    }

    const session = await getSession(sessionId);
    const newState = { ...session.state };

    if (!newState.documents[documentType]) {
      newState.documents[documentType] = {};
    }

    newState.documents[documentType].fileUrl = fileUrl;
    newState.documents[documentType].uploadedAt = new Date().toISOString();
    newState.documents[documentType].extractedData = extractedData;
    newState.documents[documentType].status = extractedData ? 'extracted' : 'pending';

    // Remove from pending items if present
    newState.pendingItems = newState.pendingItems.filter(item => item !== documentType);

    newState.metadata.lastActivityAt = new Date().toISOString();

    await updateSession(sessionId, { state: newState });

    console.log(`[SESSION_MANAGER] Document added: ${documentType} for session ${sessionId}`);
    await logAction(sessionId, 'DOCUMENT_ADDED', { documentType, fileUrl, hasExtractedData: !!extractedData });

    return await getSession(sessionId);
  } catch (error) {
    console.error('[SESSION_MANAGER] Error adding document:', error.message);
    throw error;
  }
}

/**
 * ADD PENDING ITEM
 * Track an item that needs to be provided
 */
async function addPendingItem(sessionId, itemName, reason = '') {
  try {
    if (!sessionId || !itemName) {
      throw new Error('sessionId and itemName are required');
    }

    const session = await getSession(sessionId);
    const newState = { ...session.state };

    // Avoid duplicates
    if (!newState.pendingItems.includes(itemName)) {
      newState.pendingItems.push(itemName);
    }

    newState.metadata.lastActivityAt = new Date().toISOString();

    await updateSession(sessionId, { state: newState });

    console.log(`[SESSION_MANAGER] Pending item added: ${itemName} (reason: ${reason})`);
    await logAction(sessionId, 'PENDING_ITEM_ADDED', { itemName, reason });

    return await getSession(sessionId);
  } catch (error) {
    console.error('[SESSION_MANAGER] Error adding pending item:', error.message);
    throw error;
  }
}

/**
 * ADD SHAREHOLDER
 * Add shareholder for multi-shareholder processing
 */
async function addShareholder(sessionId, shareholderData) {
  try {
    if (!sessionId || !shareholderData) {
      throw new Error('sessionId and shareholderData are required');
    }

    const session = await getSession(sessionId);
    const newState = { ...session.state };

    // Add to queue if not already processing
    if (!newState.currentShareholder) {
      newState.currentShareholder = shareholderData;
    } else {
      newState.shareholderQueue.push(shareholderData);
    }

    newState.metadata.lastActivityAt = new Date().toISOString();

    await updateSession(sessionId, { state: newState });

    console.log(`[SESSION_MANAGER] Shareholder added to session ${sessionId}`);
    await logAction(sessionId, 'SHAREHOLDER_ADDED', { shareholderData });

    return await getSession(sessionId);
  } catch (error) {
    console.error('[SESSION_MANAGER] Error adding shareholder:', error.message);
    throw error;
  }
}

/**
 * ESCALATE SESSION
 * Mark session as escalated (OTP failure, dispute, etc)
 */
async function escalateSession(sessionId, reason, context = {}) {
  try {
    if (!sessionId || !reason) {
      throw new Error('sessionId and reason are required');
    }

    const session = await getSession(sessionId);
    const newState = { ...session.state };

    newState.escalated = true;
    newState.escalationReason = reason;
    newState.escalationNotes = context.notes || null;
    newState.status = 'escalated';

    await updateSession(sessionId, { state: newState });

    // Create escalation record
    const escalationId = `esc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = admin.firestore.Timestamp.now();

    await escalationsCollection().doc(escalationId).set({
      escalationId,
      sessionId,
      clientId: session.clientId,
      cspId: session.cspId,
      reason,
      context,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[SESSION_MANAGER] Session escalated: ${sessionId} - reason: ${reason}`);
    await logAction(sessionId, 'SESSION_ESCALATED', { reason, context });

    return {
      sessionId,
      escalationId,
      reason,
    };
  } catch (error) {
    console.error('[SESSION_MANAGER] Error escalating session:', error.message);
    throw error;
  }
}

/**
 * LOG ACTION
 * Audit trail for all session actions
 */
async function logAction(sessionId, actionType, details = {}) {
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = admin.firestore.Timestamp.now();

    await auditLogsCollection().doc(logId).set({
      logId,
      sessionId,
      actionType,
      details,
      createdAt: now,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[SESSION_MANAGER] Error logging action:', error.message);
    // Don't throw - logging failure shouldn't block flow
  }
}

/**
 * GET AUDIT LOG
 * Retrieve all actions for a session
 */
async function getAuditLog(sessionId) {
  try {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    const logs = await auditLogsCollection()
      .where('sessionId', '==', sessionId)
      .orderBy('createdAt', 'asc')
      .get();

    return logs.docs.map(doc => doc.data());
  } catch (error) {
    console.error('[SESSION_MANAGER] Error getting audit log:', error.message);
    throw error;
  }
}

/**
 * COMPLETE SESSION
 * Mark session as completed successfully
 */
async function completeSession(sessionId) {
  try {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    const session = await getSession(sessionId);
    const newState = { ...session.state };

    newState.status = 'completed';
    newState.metadata.completedAt = new Date().toISOString();

    await updateSession(sessionId, { state: newState });

    console.log(`[SESSION_MANAGER] Session completed: ${sessionId}`);
    await logAction(sessionId, 'SESSION_COMPLETED', {});

    return await getSession(sessionId);
  } catch (error) {
    console.error('[SESSION_MANAGER] Error completing session:', error.message);
    throw error;
  }
}

/**
 * PAUSE SESSION
 * Temporarily pause a session
 */
async function pauseSession(sessionId, reason = '') {
  try {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    const session = await getSession(sessionId);
    const newState = { ...session.state };

    newState.status = 'paused';

    await updateSession(sessionId, { state: newState });

    console.log(`[SESSION_MANAGER] Session paused: ${sessionId}`);
    await logAction(sessionId, 'SESSION_PAUSED', { reason });

    return await getSession(sessionId);
  } catch (error) {
    console.error('[SESSION_MANAGER] Error pausing session:', error.message);
    throw error;
  }
}

/**
 * CLEAR SESSION CACHE
 * Used when deleting or archiving a session
 */
async function clearSessionCache(sessionId) {
  try {
    await cache.session.delete(sessionId);
    console.log(`[SESSION_MANAGER] Cache cleared for session ${sessionId}`);
  } catch (error) {
    console.error('[SESSION_MANAGER] Error clearing session cache:', error.message);
  }
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  updateStep,
  addCollectedField,
  addDocument,
  addPendingItem,
  addShareholder,
  escalateSession,
  logAction,
  getAuditLog,
  completeSession,
  pauseSession,
  clearSessionCache,
};
