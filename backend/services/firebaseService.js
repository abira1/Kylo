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
    
    const newClient = {
      id: clientId,
      name: `Client ${clientId.substring(0, 8)}`,
      displayName: `Client ${clientId.substring(0, 8)}`,
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
    
    console.log(`[FIREBASE] Client created: ${clientId}`);
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
  upsertKBItem,
  deleteKBItem
};
