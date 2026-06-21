#!/usr/bin/env node
/**
 * Migration Script: Add publicWidgetKey to all existing clients
 * Run this once to generate secure public keys for all clients
 * Usage: node migrate-public-keys.js
 */

require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase
let credential;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const decodedJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8');
    credential = admin.credential.cert(JSON.parse(decodedJson));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    credential = admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  } else {
    credential = admin.credential.cert(path.join(__dirname, '../../firebase-key.json'));
  }
} catch (e) {
  console.error('Failed to load Firebase credentials:', e.message);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: credential,
  });
}

const db = admin.firestore();

/**
 * Generate a unique public widget key
 * Format: pk_live_[20 random alphanumeric chars]
 */
function generatePublicKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 20; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `pk_live_${key}`;
}

async function migrateClients() {
  try {
    console.log('Starting migration: Adding publicWidgetKey to all clients...\n');

    const clientsRef = db.collection('clients');
    const snapshot = await clientsRef.get();

    if (snapshot.empty) {
      console.log('No clients found to migrate.');
      process.exit(0);
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const updates = [];

    for (const doc of snapshot.docs) {
      const clientData = doc.data();
      const clientId = doc.id;

      // Skip if already has publicWidgetKey
      if (clientData.publicWidgetKey) {
        console.log(`⏭️  Skipped ${clientId}: Already has publicWidgetKey (${clientData.publicWidgetKey})`);
        skippedCount++;
        continue;
      }

      // Generate new key
      const publicKey = generatePublicKey();
      updates.push({
        id: clientId,
        publicKey: publicKey,
      });

      console.log(`✅ Generated for ${clientId}: ${publicKey}`);
    }

    // Apply all updates in parallel batches
    if (updates.length > 0) {
      console.log(`\nApplying ${updates.length} updates to Firestore...\n`);

      const batchSize = 500;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = db.batch();
        const batchUpdates = updates.slice(i, i + batchSize);

        for (const update of batchUpdates) {
          const docRef = clientsRef.doc(update.id);
          batch.update(docRef, {
            publicWidgetKey: update.publicKey,
            publicKeyGeneratedAt: new Date().toISOString(),
          });
        }

        await batch.commit();
        updatedCount += batchUpdates.length;
        console.log(`Committed batch: ${Math.min(i + batchSize, updates.length)} of ${updates.length}`);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated: ${updatedCount} clients`);
    console.log(`   Skipped: ${skippedCount} clients (already had keys)`);
    console.log(`   Total:   ${updatedCount + skippedCount} clients`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateClients();
