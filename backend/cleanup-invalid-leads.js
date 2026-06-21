/**
 * Cleanup script to remove invalid leads (missing name or phone)
 * Usage: node cleanup-invalid-leads.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase
const serviceAccountPath = path.join(__dirname, '../kylo-support-firebase-adminsdk.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://kylo-support.firebaseio.com'
});

const db = admin.firestore();

async function cleanupInvalidLeads() {
  try {
    console.log('[CLEANUP] Starting invalid leads cleanup...\n');

    // Get all client IDs (all documents in leads collection)
    const leadsRef = db.collection('leads');
    const clientDocs = await leadsRef.listDocuments();

    let totalDeleted = 0;

    for (const clientDoc of clientDocs) {
      const clientId = clientDoc.id;
      console.log(`\n[CLEANUP] Processing client: ${clientId}`);

      // Get all leads for this client
      const itemsRef = clientDoc.collection('items');
      const snapshot = await itemsRef.get();

      console.log(`[CLEANUP] Found ${snapshot.size} leads for this client`);

      for (const doc of snapshot.docs) {
        const lead = doc.data();
        const hasName = lead.name && lead.name.trim();
        const hasPhone = lead.phone && lead.phone.trim();

        if (!hasName || !hasPhone) {
          console.log(`  ❌ DELETING invalid lead: "${lead.name}" (phone: "${lead.phone}")`);
          await doc.ref.delete();
          totalDeleted++;
        } else {
          console.log(`  ✅ KEEPING valid lead: "${lead.name}" (${lead.phone})`);
        }
      }
    }

    console.log(`\n\n[CLEANUP] ✅ Cleanup complete!`);
    console.log(`[CLEANUP] Deleted ${totalDeleted} invalid leads`);
    process.exit(0);
  } catch (error) {
    console.error('[CLEANUP] Error:', error.message);
    process.exit(1);
  }
}

cleanupInvalidLeads();
