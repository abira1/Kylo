#!/usr/bin/env node
/**
 * Firebase Initialization Script
 * Run this once to set up the initial Firestore structure with test data
 * 
 * Usage: node setup-firebase.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase (uses service account or Firebase CLI)
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
    path.join(__dirname, 'kylo-firebase-key.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
} catch (error) {
  console.log('Using Firebase CLI authentication...');
  admin.initializeApp();
}

const db = admin.firestore();

async function setupFirebase() {
  try {
    console.log('📦 Setting up Firestore structure...\n');

    // 1. Create global knowledge base
    console.log('1️⃣ Creating global knowledge base...');
    await db.collection('knowledgeBases').doc('global').set({
      faqs: [
        {
          id: 'faq_001',
          question: 'What is KYLO AI?',
          answer: 'KYLO AI is an AI-powered conversational intelligence platform that helps businesses deploy custom AI chatbots.',
          category: 'general',
          updatedAt: admin.firestore.Timestamp.now()
        },
        {
          id: 'faq_002',
          question: 'How do I set up a chatbot?',
          answer: 'Log in to your dashboard, create a new agent, train it with your knowledge base, and embed it on your website using our embed code.',
          category: 'setup',
          updatedAt: admin.firestore.Timestamp.now()
        },
        {
          id: 'faq_003',
          question: 'Can I customize the chatbot appearance?',
          answer: 'Yes! You can customize colors, branding, messages, and behavior through your dashboard settings.',
          category: 'customization',
          updatedAt: admin.firestore.Timestamp.now()
        }
      ],
      documents: [],
      createdAt: admin.firestore.Timestamp.now()
    });
    console.log('   ✅ Global KB created\n');

    // 2. Create test client 1
    console.log('2️⃣ Creating test client (client_test_001)...');
    await db.collection('clients').doc('client_test_001').set({
      name: 'Test Support Company',
      displayName: 'Test Support Bot',
      plan: 'pro',
      email: 'test@example.com',
      mobile: '+971501234567',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      systemPromptAddition: 'You are a support agent for Test Support Company. Be helpful and professional.'
    });
    console.log('   ✅ Client created\n');

    // 3. Create test client 2 (E-commerce)
    console.log('3️⃣ Creating test client (client_ecommerce_001)...');
    await db.collection('clients').doc('client_ecommerce_001').set({
      name: 'E-Commerce Store',
      displayName: 'Shop Assistant',
      plan: 'starter',
      email: 'shop@example.com',
      mobile: '+971509876543',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      systemPromptAddition: 'You are a friendly shopping assistant. Help customers find products and answer questions about orders.'
    });
    console.log('   ✅ E-commerce client created\n');

    // 4. Create client-specific KB for test client 1
    console.log('4️⃣ Creating client-specific KB for test client...');
    await db.collection('knowledgeBases').doc('client_test_001').set({
      faqs: [
        {
          id: 'client_faq_001',
          question: 'What is your support hours?',
          answer: 'We provide 24/7 support via chat and email. Phone support is available 9 AM - 6 PM GST.',
          category: 'support',
          updatedAt: admin.firestore.Timestamp.now()
        },
        {
          id: 'client_faq_002',
          question: 'How do I reset my password?',
          answer: 'Click "Forgot Password" on the login page and follow the reset instructions sent to your email.',
          category: 'account',
          updatedAt: admin.firestore.Timestamp.now()
        }
      ],
      documents: [],
      clientId: 'client_test_001',
      createdAt: admin.firestore.Timestamp.now()
    });
    console.log('   ✅ Client-specific KB created\n');

    // 5. Create client-specific KB for e-commerce
    console.log('5️⃣ Creating client-specific KB for e-commerce...');
    await db.collection('knowledgeBases').doc('client_ecommerce_001').set({
      faqs: [
        {
          id: 'shop_faq_001',
          question: 'What is your return policy?',
          answer: 'We offer 30-day returns for all items in original condition with receipt.',
          category: 'shipping',
          updatedAt: admin.firestore.Timestamp.now()
        },
        {
          id: 'shop_faq_002',
          question: 'How long does delivery take?',
          answer: 'Standard delivery takes 3-5 business days. Express delivery available for 1-2 days.',
          category: 'shipping',
          updatedAt: admin.firestore.Timestamp.now()
        },
        {
          id: 'shop_faq_003',
          question: 'Do you offer international shipping?',
          answer: 'Yes! We ship to most countries. Shipping fees and times vary by location.',
          category: 'shipping',
          updatedAt: admin.firestore.Timestamp.now()
        }
      ],
      documents: [],
      clientId: 'client_ecommerce_001',
      createdAt: admin.firestore.Timestamp.now()
    });
    console.log('   ✅ E-commerce KB created\n');

    console.log('✨ Firebase setup complete!\n');
    console.log('📋 Test Clients Created:');
    console.log('   1. client_test_001 (Test Support Company)');
    console.log('   2. client_ecommerce_001 (E-Commerce Store)\n');
    console.log('🚀 You can now test the API with these clientIds\n');

  } catch (error) {
    console.error('❌ Error setting up Firebase:', error.message);
    process.exit(1);
  }
}

setupFirebase().then(() => {
  process.exit(0);
});
