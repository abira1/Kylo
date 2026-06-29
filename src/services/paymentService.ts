/**
 * Mock Stripe Payment Service
 * 
 * This service simulates Stripe payment processing.
 * In production, replace with actual Stripe API integration.
 */

import { database } from '../firebase/config';
import { ref, set, push } from 'firebase/database';

export interface Package {
  id: string;
  name: string;
  price: number;
  priceId: string; // Stripe price ID
  description: string;
  features: string[];
  billingCycle: 'monthly' | 'yearly';
  conversationLimit: number;
  leadCapture: boolean;
  analytics: boolean;
  whatsAppIntegration: boolean;
  customDomain: boolean;
}

export interface PaymentIntent {
  id: string;
  clientEmail: string;
  packageId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface ClientProfile {
  uid: string;
  email: string;
  displayName: string;
  packageId: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed';
  paymentId: string;
  createdAt: string;
  updatedAt: string;
}

// Available packages (like Stripe pricing tiers)
export const PACKAGES: Package[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    priceId: 'price_starter_monthly',
    description: 'Perfect for small businesses getting started',
    features: [
      '100 conversations/month',
      'Basic analytics',
      'Email support',
      'Single bot instance',
    ],
    billingCycle: 'monthly',
    conversationLimit: 100,
    leadCapture: false,
    analytics: true,
    whatsAppIntegration: false,
    customDomain: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    priceId: 'price_professional_monthly',
    description: 'For growing businesses',
    features: [
      '1,000 conversations/month',
      'Advanced analytics',
      'Priority email & chat support',
      'Multiple bot instances',
      'Lead capture & scoring',
      'Basic WhatsApp integration',
    ],
    billingCycle: 'monthly',
    conversationLimit: 1000,
    leadCapture: true,
    analytics: true,
    whatsAppIntegration: true,
    customDomain: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    priceId: 'price_enterprise_monthly',
    description: 'For large-scale operations',
    features: [
      'Unlimited conversations',
      'Advanced analytics & reporting',
      '24/7 phone & email support',
      'Unlimited bot instances',
      'Advanced lead capture & scoring',
      'Full WhatsApp integration',
      'Custom domain & branding',
      'API access',
      'Dedicated account manager',
    ],
    billingCycle: 'monthly',
    conversationLimit: 999999,
    leadCapture: true,
    analytics: true,
    whatsAppIntegration: true,
    customDomain: true,
  },
];

/**
 * Get all available packages
 */
export const getPackages = (): Package[] => {
  return PACKAGES;
};

/**
 * Get package by ID
 */
export const getPackageById = (packageId: string): Package | undefined => {
  return PACKAGES.find((pkg) => pkg.id === packageId);
};

/**
 * Process mock payment (simulate Stripe)
 * In production, this would call Stripe API
 */
export const processPayment = async (
  clientEmail: string,
  packageId: string,
  clientUid: string,
  clientName: string,
  card?: { brand: string; last4: string; expMonth: number; expYear: number } | null
): Promise<PaymentIntent> => {
  try {
    const pkg = getPackageById(packageId);
    if (!pkg) {
      throw new Error('Package not found');
    }

    // Simulate payment processing
    const paymentId = `mock_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Create payment record under client's workspace (not root)
    const paymentData: PaymentIntent = {
      id: paymentId,
      clientEmail,
      packageId,
      amount: pkg.price,
      currency: 'USD',
      status: 'succeeded', // Mock: always succeeds
      createdAt: now,
      updatedAt: now,
    };

    // Create client profile
    const clientProfile: ClientProfile = {
      uid: clientUid,
      email: clientEmail,
      displayName: clientName,
      packageId,
      paymentStatus: 'succeeded',
      paymentId,
      createdAt: now,
      updatedAt: now,
    };

    // Dashboard-shaped profile so Account/Plan/Payment sections render correctly
    const [firstName, ...rest] = (clientName || '').split(' ');
    const renews = new Date();
    renews.setMonth(renews.getMonth() + 1);
    const dashboardProfile = {
      firstName: firstName || '',
      lastName: rest.join(' ') || '',
      email: clientEmail,
      company: '',
      phone: '',
      jobTitle: '',
      plan: pkg.name,
      packageId,
      planStatus: 'active',
      renewsAt: renews.toISOString(),
      card: card || null,
    };

    // Initialize client data structures
    const initializationData = {
      profile: { ...dashboardProfile, account: clientProfile },
      analytics: {
        chartData: {},
        revenueData: {},
      },
      leads: {},
      conversations: {},
      invoices: {
        [paymentId]: {
          id: paymentId,
          date: now,
          amount: `$${pkg.price}.00`,
          status: 'Paid',
          plan: pkg.name,
        },
      },
      payments: {
        [paymentId]: paymentData,
      },
      trainingFiles: {},
      settings: {
        packageId,
        createdAt: now,
        language: 'English',
        timezone: 'UTC',
      },
    };

    // Create client workspace - all in one write to avoid permission issues
    const clientRef = ref(database, `clients/${clientUid}`);
    await set(clientRef, initializationData);

    return paymentData;
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId: string): Promise<PaymentIntent | null> => {
  try {
    const paymentRef = ref(database, `payments/${paymentId}`);
    // In a real app, you'd use get() here
    return null;
  } catch (error) {
    console.error('Get payment error:', error);
    throw error;
  }
};

/**
 * Get all payments for a client
 */
export const getClientPayments = async (clientUid: string): Promise<PaymentIntent[]> => {
  try {
    // This would query payments where clientUid matches
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Get client payments error:', error);
    throw error;
  }
};

/**
 * Mock Stripe card validation
 */
export const validateCardDetails = (
  cardNumber: string,
  expiryDate: string,
  cvc: string
): boolean => {
  // Basic validation - in production, never store card details
  const cardRegex = /^[0-9]{16}$/;
  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  const cvcRegex = /^[0-9]{3,4}$/;

  return cardRegex.test(cardNumber) && expiryRegex.test(expiryDate) && cvcRegex.test(cvc);
};

/**
 * Create setup intent for recurring billing
 */
export const createSetupIntent = async (clientEmail: string): Promise<string> => {
  try {
    // Mock setup intent ID
    const setupIntentId = `si_mock_${Date.now()}`;
    return setupIntentId;
  } catch (error) {
    console.error('Setup intent creation error:', error);
    throw error;
  }
};

/**
 * Update subscription package
 */
export const updateSubscriptionPackage = async (
  clientUid: string,
  newPackageId: string
): Promise<void> => {
  try {
    const pkg = getPackageById(newPackageId);
    if (!pkg) {
      throw new Error('Package not found');
    }

    const clientProfileRef = ref(database, `clients/${clientUid}/profile`);
    // Update with new package
    // In production, you'd also handle proration and billing updates
    const now = new Date().toISOString();

    // This would update the profile - in a real app, use more precise updates
    await set(clientProfileRef, {}, { merge: true });
  } catch (error) {
    console.error('Update subscription error:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (clientUid: string): Promise<void> => {
  try {
    const clientProfileRef = ref(database, `clients/${clientUid}/profile`);
    // Cancel subscription - in production, this would also cancel in Stripe
    await set(clientProfileRef, {}, { merge: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
};
