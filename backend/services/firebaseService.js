const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let db;
let auth;

function initializeFirebase() {
  try {
    let credential;
    
    // Try multiple auth methods in order of preference
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      // Method 1: Use base64-encoded JSON from environment variable
      try {
        const decodedJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8');
        credential = admin.credential.cert(JSON.parse(decodedJson));
        console.log('[FIREBASE] Using service account from FIREBASE_SERVICE_ACCOUNT_JSON');
      } catch (e) {
        console.error('[FIREBASE] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
        throw e;
      }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Method 2: Use file path from environment variable
      credential = admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      console.log('[FIREBASE] Using service account from FIREBASE_SERVICE_ACCOUNT_PATH');
    } else {
      // Method 3: Try local file
      const localPath = path.join(__dirname, '../kylo-firebase-key.json');
      credential = admin.credential.cert(localPath);
      console.log('[FIREBASE] Using local service account file');
    }
    
    admin.initializeApp({
      credential: credential,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    db = admin.firestore();
    auth = admin.auth();
    console.log('[FIREBASE] Initialized successfully');
  } catch (error) {
    console.error('[FIREBASE] Service account auth failed:', error.message);
    console.log('[FIREBASE] Attempting to use Firebase CLI authentication...');
    try {
      admin.initializeApp();
      db = admin.firestore();
      auth = admin.auth();
      console.log('[FIREBASE] Initialized with CLI credentials');
    } catch (cliError) {
      console.error('[FIREBASE] CLI authentication failed:', cliError.message);
      throw new Error('Firebase initialization failed. Please provide service account or set up Firebase CLI.');
    }
  }
}

// Initialize on module load
initializeFirebase();

/**
 * Get client by ID with validation
 */
async function getClient(clientId) {
  if (!clientId) throw new Error('clientId is required');
  
  const clientDoc = await db.collection('clients').doc(clientId).get();
  if (!clientDoc.exists) {
    throw new Error(`Client not found: ${clientId}`);
  }
  
  return {
    id: clientDoc.id,
    ...clientDoc.data()
  };
}

/**
 * Get or create client (auto-provision new users)
 */
async function getOrCreateClient(clientId) {
  if (!clientId) throw new Error('clientId is required');
  
  try {
    return await getClient(clientId);
  } catch (error) {
    // Client doesn't exist - auto-create it
    console.log(`[FIREBASE] Auto-provisioning new client: ${clientId}`);
    
    // Generate a unique public widget key
    const generatePublicKey = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let key = '';
      for (let i = 0; i < 20; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `pk_live_${key}`;
    };
    
    const newClient = {
      id: clientId,
      name: `Client ${clientId.substring(0, 8)}`,
      displayName: `Client ${clientId.substring(0, 8)}`,
      publicWidgetKey: generatePublicKey(),
      tier: 'free',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('clients').doc(clientId).set(newClient);
    
    // Also create an empty KB for the client
    await db.collection('knowledgeBases').doc(clientId).set({
      clientId,
      faqs: {},
      documents: [],
      createdAt: new Date()
    });
    
    console.log(`[FIREBASE] Client created: ${clientId} with publicKey: ${newClient.publicWidgetKey}`);
    return newClient;
  }
}

/**
 * Get global knowledge base
 */
async function getGlobalKB() {
  try {
    const globalDoc = await db.collection('knowledgeBases').doc('global').get();
    return globalDoc.exists ? globalDoc.data() : { faqs: [], documents: [] };
  } catch (error) {
    console.error('[FIREBASE] Error getting global KB:', error.message);
    return { faqs: [], documents: [] };
  }
}

/**
 * Get client-specific knowledge base
 */
async function getClientKB(clientId) {
  try {
    const clientDoc = await db.collection('knowledgeBases').doc(clientId).get();
    return clientDoc.exists ? clientDoc.data() : { faqs: [], documents: [] };
  } catch (error) {
    console.error('[FIREBASE] Error getting client KB:', error.message);
    return { faqs: [], documents: [] };
  }
}

/**
 * Convert Firestore object/array to array
 */
function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

/**
 * Merge global + client KBs (client takes priority)
 */
async function getMergedKB(clientId) {
  const [globalKB, clientKB] = await Promise.all([
    getGlobalKB(),
    getClientKB(clientId)
  ]);

  const globalFaqs = toArray(globalKB?.faqs || []);
  const clientFaqs = toArray(clientKB?.faqs || []);
  const globalDocs = toArray(globalKB?.documents || []);
  const clientDocs = toArray(clientKB?.documents || []);

  return {
    faqs: [...globalFaqs, ...clientFaqs],
    documents: [...globalDocs, ...clientDocs],
    clientId
  };
}

/**
 * Save conversation message
 */
async function saveConversation(clientId, conversationId, messages) {
  try {
    await db.collection('conversations')
      .doc(clientId)
      .collection('chats')
      .doc(conversationId)
      .set({
        messages,
        updatedAt: admin.firestore.Timestamp.now(),
        clientId
      }, { merge: true });
  } catch (error) {
    console.error('[FIREBASE] Error saving conversation:', error.message);
    // Don't throw - conversation save failure shouldn't block chat response
  }
}

/**
 * Get conversation history
 */
async function getConversation(clientId, conversationId) {
  try {
    const doc = await db.collection('conversations')
      .doc(clientId)
      .collection('chats')
      .doc(conversationId)
      .get();

    return doc.exists ? doc.data().messages : [];
  } catch (error) {
    console.error('[FIREBASE] Error getting conversation:', error.message);
    return [];
  }
}

/**
 * Create or update client KB item
 */
async function upsertKBItem(clientId, itemId, item) {
  try {
    const kbRef = db.collection('knowledgeBases').doc(clientId);
    
    // Ensure KB document exists
    await kbRef.set({ 
      createdAt: admin.firestore.Timestamp.now(),
      clientId 
    }, { merge: true });
    
    // Update or add FAQ
    await kbRef.update({
      [`faqs.${itemId}`]: {
        id: itemId,
        ...item,
        updatedAt: admin.firestore.Timestamp.now()
      }
    });
  } catch (error) {
    console.error('[FIREBASE] Error upserting KB item:', error.message);
    throw error;
  }
}

/**
 * Delete KB item
 */
async function deleteKBItem(clientId, itemId) {
  try {
    const kbRef = db.collection('knowledgeBases').doc(clientId);
    await kbRef.update({
      [`faqs.${itemId}`]: admin.firestore.FieldValue.delete()
    });
  } catch (error) {
    console.error('[FIREBASE] Error deleting KB item:', error.message);
    throw error;
  }
}

/**
 * Save lead from chat conversation
 */
async function saveLead(clientId, leadData) {
  try {
    console.log(`[FIREBASE SAVESLEAD] Starting save for client: ${clientId}`);
    
    // FAST DUPLICATE CHECK with timeout
    if (leadData.conversationId) {
      try {
        console.log(`[FIREBASE SAVESLEAD] Checking conversationId: ${leadData.conversationId}`);
        const existingDocs = await Promise.race([
          db.collection('leads')
            .doc(clientId)
            .collection('items')
            .where('conversationId', '==', leadData.conversationId)
            .limit(1)
            .get(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ]);
        
        if (!existingDocs.empty) {
          const existingLead = existingDocs.docs[0].data();
          console.log(`[FIREBASE SAVESLEAD] ⚠️ DUPLICATE PREVENTED - Lead ID: ${existingLead.id}`);
          return {
            id: existingLead.id,
            clientId: existingLead.clientId,
            name: existingLead.name,
            phone: existingLead.phone,
            isDuplicate: true
          };
        }
      } catch (dupError) {
        console.log(`[FIREBASE SAVESLEAD] Duplicate check skipped (${dupError.message})`);
      }
    }
    
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[FIREBASE SAVESLEAD] Generated leadId: ${leadId}`);
    
    const lead = {
      id: leadId,
      clientId,
      name: leadData.name || '',
      email: leadData.email || '',
      phone: leadData.phone || '',
      country: leadData.country || '',
      businessType: leadData.businessType || '',
      conversationId: leadData.conversationId || '',
      messages: leadData.messages || [],
      extractedData: leadData.extractedData || {},
      documentUploads: leadData.documentUploads || [],
      status: leadData.status || 'new', // new, qualified, contacted, won, lost
      source: leadData.source || 'chat', // or 'form', 'whatsapp', etc
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      notes: leadData.notes || ''
    };

    console.log(`[FIREBASE SAVESLEAD] Lead object created:`, {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      source: lead.source,
      status: lead.status
    });

    console.log(`[FIREBASE SAVESLEAD] Writing to Firestore path: /leads/${clientId}/items/${leadId}`);
    await db.collection('leads')
      .doc(clientId)
      .collection('items')
      .doc(leadId)
      .set(lead);

    console.log(`[FIREBASE SAVESLEAD] ✓ Lead successfully saved: ${leadId} for client ${clientId}`);
    return lead;
  } catch (error) {
    console.error('[FIREBASE SAVESLEAD] Error saving lead:', error.message, error.stack);
    throw error;
  }
}

/**
 * Get all leads for a client
 */
async function getLeads(clientId, limit = 50) {
  try {
    console.log(`[FIREBASE GETLEADS] Fetching leads for client: ${clientId}, limit: ${limit}`);
    
    const snapshot = await db.collection('leads')
      .doc(clientId)
      .collection('items')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
    }));

    console.log(`[FIREBASE GETLEADS] ✓ Retrieved ${leads.length} leads for client: ${clientId}`);
    if (leads.length > 0) {
      console.log(`[FIREBASE GETLEADS] First lead:`, {
        id: leads[0].id,
        name: leads[0].name,
        email: leads[0].email,
        source: leads[0].source,
        createdAt: leads[0].createdAt
      });
    }
    
    return leads;
  } catch (error) {
    console.error('[FIREBASE GETLEADS] Error getting leads:', error.message, error.stack);
    return [];
  }
}

/**
 * Get lead by ID
 */
async function getLead(clientId, leadId) {
  try {
    const doc = await db.collection('leads')
      .doc(clientId)
      .collection('items')
      .doc(leadId)
      .get();

    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
    };
  } catch (error) {
    console.error('[FIREBASE] Error getting lead:', error.message);
    return null;
  }
}

/**
 * Update lead
 */
async function updateLead(clientId, leadId, updates) {
  try {
    await db.collection('leads')
      .doc(clientId)
      .collection('items')
      .doc(leadId)
      .update({
        ...updates,
        updatedAt: admin.firestore.Timestamp.now()
      });

    console.log(`[FIREBASE] Lead updated: ${leadId}`);
  } catch (error) {
    console.error('[FIREBASE] Error updating lead:', error.message);
    throw error;
  }
}

/**
 * Delete lead
 */
async function deleteLead(clientId, leadId) {
  try {
    await db.collection('leads')
      .doc(clientId)
      .collection('items')
      .doc(leadId)
      .delete();

    console.log(`[FIREBASE] Lead deleted: ${leadId}`);
  } catch (error) {
    console.error('[FIREBASE] Error deleting lead:', error.message);
    throw error;
  }
}

/**
 * Get all conversations for a client
 */
async function getConversations(clientId, limit = 50) {
  try {
    const snapshot = await db.collection('conversations')
      .doc(clientId)
      .collection('chats')
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
    }));
  } catch (error) {
    console.error('[FIREBASE] Error getting conversations:', error.message);
    return [];
  }
}

/**
 * Save file metadata (for uploads)
 */
async function saveFileMetadata(clientId, conversationId, fileData) {
  try {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const file = {
      id: fileId,
      clientId,
      conversationId,
      name: fileData.name || '',
      type: fileData.type || '',
      size: fileData.size || 0,
      uploadUrl: fileData.uploadUrl || '',
      extractedData: fileData.extractedData || {},
      createdAt: admin.firestore.Timestamp.now()
    };

    await db.collection('files')
      .doc(clientId)
      .collection('items')
      .doc(fileId)
      .set(file);

    console.log(`[FIREBASE] File metadata saved: ${fileId}`);
    return file;
  } catch (error) {
    console.error('[FIREBASE] Error saving file metadata:', error.message);
    throw error;
  }
}

/**
 * Delete invalid leads (missing name or phone)
 */
async function cleanupInvalidLeads(clientId) {
  try {
    console.log(`[FIREBASE CLEANUP] Starting cleanup for client: ${clientId}`);
    
    const leadsRef = db.collection('leads').doc(clientId).collection('items');
    const snapshot = await leadsRef.get();
    
    let deleted = 0;
    const batch = db.batch();
    
    for (const doc of snapshot.docs) {
      const lead = doc.data();
      const hasName = lead.name && lead.name.trim();
      const hasPhone = lead.phone && lead.phone.trim();
      
      if (!hasName || !hasPhone) {
        console.log(`[FIREBASE CLEANUP] Deleting invalid: "${lead.name}" (phone: "${lead.phone}")`);
        batch.delete(doc.ref);
        deleted++;
      }
    }
    
    await batch.commit();
    console.log(`[FIREBASE CLEANUP] Deleted ${deleted} invalid leads for ${clientId}`);
    return { deleted, total: snapshot.size };
  } catch (error) {
    console.error('[FIREBASE CLEANUP] Error:', error.message);
    throw error;
  }
}

module.exports = {
  db,
  auth,
  getClient,
  getOrCreateClient,
  getGlobalKB,
  getClientKB,
  getMergedKB,
  saveConversation,
  getConversation,
  getConversations,
  upsertKBItem,
  deleteKBItem,
  saveLead,
  getLeads,
  getLead,
  updateLead,
  deleteLead,
  saveFileMetadata,
  cleanupInvalidLeads
};
