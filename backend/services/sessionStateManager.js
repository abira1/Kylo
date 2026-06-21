/**
 * Session State Manager for UAE Agent
 * Manages the complete conversation state across 18 steps
 * 
 * Session State Structure:
 * {
 *   currentStep: 1-18,
 *   agentName: string,
 *   cspName: string,
 *   clientName: string,
 *   jurisdiction: string,
 *   businessActivity: string,
 *   visaAllocation: number,
 *   shareholderCount: number,
 *   collectedFields: { ...all fields collected... },
 *   pendingItems: [ ...outstanding items... ],
 *   shareholderQueue: [ ...additional shareholders... ],
 *   otpVerified: boolean,
 *   otpAttempts: number,
 *   rescheduleUntil: timestamp or null,
 *   ... other tracking fields
 * }
 */

const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Initialize new session with base state
 */
async function initializeSession(clientId, clientData) {
  try {
    const initialState = {
      currentStep: 1,
      agentName: clientData.agentName || 'AS AI Agent',
      cspName: clientData.cspName || 'AS AI',
      clientName: clientData.clientName || 'Client',
      jurisdiction: clientData.jurisdiction || 'UAE',
      businessActivity: clientData.businessActivity || '',
      visaAllocation: clientData.visaAllocation || 0,
      shareholderCount: clientData.shareholderCount || 1,
      
      // Collection tracking
      collectedFields: {
        // Personal Info
        firstName: null,
        lastName: null,
        gender: null,
        dateOfBirth: null,
        placeOfBirth: null,
        nationality: null,
        email: clientData.email || null,
        mobileNumber: clientData.mobileNumber || null,
        countryOfResidence: null,
        alternateNationality: null,
        residentialAddress: null,
        
        // Passport
        passportNumber: null,
        passportIssuingLocation: null,
        passportIssuanceCountry: null,
        passportIssueDate: null,
        passportExpiryDate: null,
        
        // Company
        preferredCompanyNames: [], // [name1, name2, name3]
        businessActivityConfirmed: false,
        visaAllocationConfirmed: false,
        shareholderCountConfirmed: false,
        
        // Share Structure
        numberOfShares: null,
        valuePerShare: null,
        totalShareCapital: null,
        
        // Roles
        manager: null,
        director: null,
        ubo: null,
        
        // Business Profile
        estimatedRevenue: null,
        countriesSelling: [],
        countriesBuying: [],
        businessNewOrExisting: null,
        existingCompanyName: null,
        paidUpCapital: null,
        hasWebsite: null,
        websiteUrl: null,
        multinationalGroup: null,
        groupName: null,
        
        // AML/Source of Funds
        employmentStatus: null, // 'salaried' or 'business_owner'
        bankStatementReceived: false,
        ownershipDocumentReceived: false,
      },
      
      // Outstanding items
      pendingItems: [],
      
      // Multi-shareholder tracking
      shareholderQueue: [],
      currentShareholderIndex: 0,
      
      // OTP tracking
      otpVerified: false,
      otpAttempts: 0,
      otpCode: null,
      otpGeneratedAt: null,
      otpExpiry: null,
      
      // Scheduling
      rescheduleUntil: null,
      
      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      conversationHistory: [], // Track all messages
    };

    return initialState;
  } catch (error) {
    console.error('[SessionInit] Error:', error.message);
    throw error;
  }
}

/**
 * Get session state from Firestore
 */
async function getSessionState(clientId, sessionId) {
  try {
    const sessionRef = db
      .collection('clients')
      .doc(clientId)
      .collection('agentSessions')
      .doc(sessionId);

    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return sessionDoc.data();
  } catch (error) {
    console.error('[SessionGet] Error:', error.message);
    throw error;
  }
}

/**
 * Update session state
 */
async function updateSessionState(clientId, sessionId, updates) {
  try {
    const sessionRef = db
      .collection('clients')
      .doc(clientId)
      .collection('agentSessions')
      .doc(sessionId);

    await sessionRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('[SessionUpdate] Error:', error.message);
    throw error;
  }
}

/**
 * Add message to conversation history
 */
async function addMessageToHistory(clientId, sessionId, message, sender = 'user') {
  try {
    const sessionRef = db
      .collection('clients')
      .doc(clientId)
      .collection('agentSessions')
      .doc(sessionId);

    await sessionRef.update({
      conversationHistory: admin.firestore.FieldValue.arrayUnion({
        sender, // 'user' or 'agent'
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }),
    });

    return true;
  } catch (error) {
    console.error('[HistoryAdd] Error:', error.message);
    throw error;
  }
}

/**
 * Move to next step
 */
async function moveToNextStep(clientId, sessionId) {
  try {
    const session = await getSessionState(clientId, sessionId);
    const nextStep = Math.min(18, session.currentStep + 1);

    await updateSessionState(clientId, sessionId, {
      currentStep: nextStep,
    });

    return nextStep;
  } catch (error) {
    console.error('[StepMove] Error:', error.message);
    throw error;
  }
}

/**
 * Confirm pre-set data (business activity, visa allocation, shareholder count)
 */
async function confirmPresetData(clientId, sessionId, dataType, clientResponse) {
  try {
    const session = await getSessionState(clientId, sessionId);
    const isConfirmed = clientResponse?.toLowerCase?.() === 'yes' || 
                        clientResponse?.toLowerCase?.() === 'correct';

    if (!isConfirmed) {
      // Data disputed — needs escalation
      return {
        confirmed: false,
        needsEscalation: true,
        dataType,
      };
    }

    // Mark as confirmed
    const updateKey = `${dataType}Confirmed`;
    await updateSessionState(clientId, sessionId, {
      [`collectedFields.${updateKey}`]: true,
    });

    return {
      confirmed: true,
      needsEscalation: false,
    };
  } catch (error) {
    console.error('[DataConfirm] Error:', error.message);
    throw error;
  }
}

/**
 * Add shareholder to queue for multi-shareholder processing
 */
async function addShareholderToQueue(clientId, sessionId, shareholderCount) {
  try {
    const session = await getSessionState(clientId, sessionId);
    
    if (shareholderCount <= 1) {
      return { queued: false, message: 'Only one shareholder' };
    }

    // Create queue for additional shareholders (1 primary + rest in queue)
    const queue = [];
    for (let i = 1; i < shareholderCount; i++) {
      queue.push({
        index: i,
        status: 'pending',
        collectedFields: {},
      });
    }

    await updateSessionState(clientId, sessionId, {
      shareholderQueue: queue,
      shareholderCount: shareholderCount,
    });

    return {
      queued: true,
      queueLength: queue.length,
    };
  } catch (error) {
    console.error('[ShareholderQueue] Error:', error.message);
    throw error;
  }
}

/**
 * Check if all required data for closing has been collected
 */
async function checkClosingReadiness(clientId, sessionId) {
  try {
    const session = await getSessionState(clientId, sessionId);
    const collected = session.collectedFields || {};
    const pending = session.pendingItems || [];

    const checks = {
      identityVerified: session.otpVerified || false,
      passportReceived: !!collected.passportNumber,
      addressCollected: !!collected.residentialAddress,
      companyNamesCollected: (collected.preferredCompanyNames || []).length >= 3,
      businessActivityConfirmed: collected.businessActivityConfirmed || false,
      visaAllocationConfirmed: collected.visaAllocationConfirmed || false,
      shareholderCountConfirmed: collected.shareholderCountConfirmed || false,
      shareStructureConfirmed: !!collected.numberOfShares && !!collected.valuePerShare,
      rolesAssigned: !!collected.manager && !!collected.director && !!collected.ubo,
      businessProfileComplete: !!collected.estimatedRevenue && 
                               (collected.countriesSelling || []).length > 0,
      amlComplete: !!collected.employmentStatus && (
        (collected.employmentStatus === 'salaried' && collected.bankStatementReceived) ||
        (collected.employmentStatus === 'business_owner' && 
         collected.bankStatementReceived && collected.ownershipDocumentReceived)
      ),
      hasPendingItems: pending.length > 0,
    };

    const allComplete = Object.keys(checks)
      .filter(key => key !== 'hasPendingItems')
      .every(key => checks[key]);

    return {
      ready: allComplete && !checks.hasPendingItems,
      readyWithPending: allComplete && checks.hasPendingItems,
      checks,
      pendingItems: pending,
    };
  } catch (error) {
    console.error('[ClosingCheck] Error:', error.message);
    throw error;
  }
}

module.exports = {
  initializeSession,
  getSessionState,
  updateSessionState,
  addMessageToHistory,
  moveToNextStep,
  confirmPresetData,
  addShareholderToQueue,
  checkClosingReadiness,
};
