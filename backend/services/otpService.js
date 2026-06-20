/**
 * OTP Service for AS AI Agent
 * Handles OTP generation, sending, and verification
 * 
 * Responsibilities:
 * - Generate secure OTP codes
 * - Send OTP via WhatsApp
 * - Send OTP via Email
 * - Verify OTP submissions
 * - Track OTP attempts
 * - Handle 3-attempt escalation
 */

const crypto = require('crypto');
const admin = require('firebase-admin');
const { db } = require('./firebaseService');

/**
 * Firestore Collection Reference
 */
const otpLogsCollection = () => db.collection('kylo-ai').doc('prod').collection('otp-logs');

// Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

/**
 * GENERATE OTP CODE
 * Create a secure random 6-digit OTP
 */
function generateOTPCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * HASH OTP CODE
 * Hash OTP for secure storage (never store plain OTP)
 */
function hashOTP(code) {
  return crypto.createHash('sha256').update(code + process.env.OTP_SALT || 'kylo-salt').digest('hex');
}

/**
 * SEND OTP VIA WHATSAPP
 * Send OTP code through WhatsApp Business API
 */
async function sendOTPWhatsApp(phoneNumber, otpCode, language = 'en') {
  try {
    if (!phoneNumber || !otpCode) {
      throw new Error('phoneNumber and otpCode are required');
    }

    // For now, we'll log this as a placeholder
    // In production, this will integrate with Meta WhatsApp Business API
    // Format: POST https://graph.instagram.com/v18.0/{PHONE_NUMBER_ID}/messages

    const message = language === 'ar' 
      ? `رمز التحقق الخاص بك هو: ${otpCode}. ينتهي خلال 10 دقائق.`
      : `Your verification code is: ${otpCode}. Valid for 10 minutes.`;

    console.log(`[OTP_SERVICE] WhatsApp OTP would be sent to ${phoneNumber}: ${message}`);

    // TODO: Implement actual WhatsApp API call
    // const response = await fetch(WHATSAPP_API_URL, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_BUSINESS_TOKEN}` },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     recipient_type: 'individual',
    //     to: phoneNumber,
    //     type: 'template',
    //     template: { name: 'otp_verification', language: { code: 'en' }, parameters: { body: { parameters: [otpCode] } } }
    //   })
    // });

    return {
      success: true,
      channel: 'whatsapp',
      phoneNumber,
      sentAt: new Date().toISOString(),
      message: 'OTP sent via WhatsApp'
    };
  } catch (error) {
    console.error('[OTP_SERVICE] Error sending WhatsApp OTP:', error.message);
    throw error;
  }
}

/**
 * SEND OTP VIA EMAIL
 * Send OTP code through email service (SendGrid or similar)
 */
async function sendOTPEmail(email, otpCode, language = 'en') {
  try {
    if (!email || !otpCode) {
      throw new Error('email and otpCode are required');
    }

    // For now, we'll log this as a placeholder
    // In production, this will integrate with SendGrid or AWS SES

    const subject = language === 'ar' ? 'رمز التحقق الخاص بك' : 'Your Verification Code';
    const body = language === 'ar'
      ? `رمز التحقق الخاص بك هو: ${otpCode}\nينتهي خلال 10 دقائق.`
      : `Your verification code is: ${otpCode}\nValid for 10 minutes.`;

    console.log(`[OTP_SERVICE] Email OTP would be sent to ${email}: Subject: ${subject}`);

    // TODO: Implement actual email API call
    // const response = await sgMail.send({
    //   to: email,
    //   from: process.env.SENDGRID_FROM_EMAIL,
    //   subject,
    //   text: body,
    //   html: `<p>Your verification code is: <strong>${otpCode}</strong></p><p>Valid for 10 minutes.</p>`
    // });

    return {
      success: true,
      channel: 'email',
      email,
      sentAt: new Date().toISOString(),
      message: 'OTP sent via Email'
    };
  } catch (error) {
    console.error('[OTP_SERVICE] Error sending email OTP:', error.message);
    throw error;
  }
}

/**
 * SEND OTP
 * Generate and send OTP to user (both WhatsApp and Email)
 */
async function sendOTP(sessionId, phoneNumber, email, language = 'en') {
  try {
    if (!sessionId || !phoneNumber) {
      throw new Error('sessionId and phoneNumber are required');
    }

    // Check cooldown - prevent spam
    // Simplified: just get the most recent log without orderBy to avoid composite index requirement
    const recentLogs = await otpLogsCollection()
      .where('sessionId', '==', sessionId)
      .where('type', '==', 'SENT')
      .limit(5)
      .get();

    if (!recentLogs.empty) {
      // Sort in memory instead of in Firestore
      const sortedLogs = recentLogs.docs
        .map(doc => ({ doc, data: doc.data() }))
        .sort((a, b) => b.data.sentAt.toDate().getTime() - a.data.sentAt.toDate().getTime());

      const lastSent = sortedLogs[0].data.sentAt.toDate();
      const secondsSinceLastSend = (Date.now() - lastSent.getTime()) / 1000;

      if (secondsSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend);
        throw new Error(`OTP sent recently. Please wait ${waitSeconds} seconds before requesting again.`);
      }
    }

    // Generate OTP
    const otpCode = generateOTPCode();
    const otpHash = hashOTP(otpCode);
    const now = admin.firestore.Timestamp.now();
    const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Create OTP log entry
    const logId = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const otpLogData = {
      logId,
      sessionId,
      phoneNumber,
      email,
      otpHash,                        // Never store plain OTP
      type: 'SENT',
      attempts: 0,
      verified: false,
      status: 'pending',              // pending, verified, expired, failed
      sentAt: now,
      expiresAt: admin.firestore.Timestamp.fromDate(expiryTime),
      channels: ['whatsapp', 'email'],
      metadata: {
        language,
        userAgent: 'whatsapp-bot',
      }
    };

    await otpLogsCollection().doc(logId).set(otpLogData);

    // Send via WhatsApp
    const whatsappResult = await sendOTPWhatsApp(phoneNumber, otpCode, language);

    // Send via Email if provided
    let emailResult = null;
    if (email) {
      emailResult = await sendOTPEmail(email, otpCode, language);
    }

    console.log(`[OTP_SERVICE] OTP sent for session ${sessionId}`);

    return {
      success: true,
      logId,
      sessionId,
      expiresAt: expiryTime.toISOString(),
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      channels: {
        whatsapp: whatsappResult,
        email: emailResult
      }
    };
  } catch (error) {
    console.error('[OTP_SERVICE] Error sending OTP:', error.message);
    throw error;
  }
}

/**
 * VERIFY OTP
 * Check if submitted OTP is correct
 */
async function verifyOTP(sessionId, submittedCode) {
  try {
    if (!sessionId || !submittedCode) {
      throw new Error('sessionId and submittedCode are required');
    }

    // Find the most recent OTP log for this session
    const otpLogs = await otpLogsCollection()
      .where('sessionId', '==', sessionId)
      .where('type', '==', 'SENT')
      .where('status', '==', 'pending')
      .limit(10)
      .get();

    if (otpLogs.empty) {
      throw new Error('No valid OTP found for this session');
    }

    // Sort in memory to get most recent
    const sortedLogs = otpLogs.docs
      .map(doc => ({ doc, data: doc.data() }))
      .sort((a, b) => b.data.sentAt.toDate().getTime() - a.data.sentAt.toDate().getTime());

    const otpLogDoc = sortedLogs[0].doc;
    const otpLogData = sortedLogs[0].data;

    // Check if OTP has expired
    const expiryTime = otpLogData.expiresAt.toDate();
    if (Date.now() > expiryTime.getTime()) {
      await otpLogsCollection().doc(otpLogDoc.id).update({
        status: 'expired',
        updatedAt: admin.firestore.Timestamp.now()
      });
      throw new Error('OTP has expired. Please request a new one.');
    }

    // Check attempts
    if (otpLogData.attempts >= MAX_OTP_ATTEMPTS) {
      await otpLogsCollection().doc(otpLogDoc.id).update({
        status: 'failed',
        updatedAt: admin.firestore.Timestamp.now()
      });
      throw new Error(`Maximum OTP attempts (${MAX_OTP_ATTEMPTS}) exceeded. Session escalated.`);
    }

    // Hash submitted code and compare
    const submittedHash = hashOTP(submittedCode);
    const isCorrect = submittedHash === otpLogData.otpHash;

    if (!isCorrect) {
      // Increment attempts
      const newAttempts = otpLogData.attempts + 1;
      await otpLogsCollection().doc(otpLogDoc.id).update({
        attempts: newAttempts,
        updatedAt: admin.firestore.Timestamp.now()
      });

      const remainingAttempts = MAX_OTP_ATTEMPTS - newAttempts;
      throw new Error(`Invalid OTP. ${remainingAttempts} attempts remaining.`);
    }

    // Correct OTP - update log
    await otpLogsCollection().doc(otpLogDoc.id).update({
      status: 'verified',
      verified: true,
      verifiedAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });

    console.log(`[OTP_SERVICE] OTP verified for session ${sessionId}`);

    return {
      success: true,
      sessionId,
      verified: true,
      message: 'OTP verified successfully'
    };
  } catch (error) {
    console.error('[OTP_SERVICE] Error verifying OTP:', error.message);
    throw error;
  }
}

/**
 * GET OTP STATUS
 * Check the status of an OTP attempt
 */
async function getOTPStatus(sessionId) {
  try {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    const otpLogs = await otpLogsCollection()
      .where('sessionId', '==', sessionId)
      .where('type', '==', 'SENT')
      .orderBy('sentAt', 'desc')
      .limit(1)
      .get();

    if (otpLogs.empty) {
      return {
        hasPendingOTP: false,
        status: 'none'
      };
    }

    const otpData = otpLogs.docs[0].data();
    const expiryTime = otpData.expiresAt.toDate();
    const isExpired = Date.now() > expiryTime.getTime();

    return {
      hasPendingOTP: !isExpired && otpData.status === 'pending',
      status: otpData.status,
      attempts: otpData.attempts,
      remainingAttempts: MAX_OTP_ATTEMPTS - otpData.attempts,
      expiresAt: expiryTime.toISOString(),
      verified: otpData.verified,
      maxAttempts: MAX_OTP_ATTEMPTS
    };
  } catch (error) {
    console.error('[OTP_SERVICE] Error getting OTP status:', error.message);
    throw error;
  }
}

/**
 * CLEAR OTP
 * Manually clear OTP (used after successful verification to prevent reuse)
 */
async function clearOTP(sessionId) {
  try {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    const otpLogs = await otpLogsCollection()
      .where('sessionId', '==', sessionId)
      .where('status', '==', 'pending')
      .get();

    for (const doc of otpLogs.docs) {
      await doc.ref.update({
        status: 'cleared',
        clearedAt: admin.firestore.Timestamp.now()
      });
    }

    console.log(`[OTP_SERVICE] OTP cleared for session ${sessionId}`);

    return { success: true };
  } catch (error) {
    console.error('[OTP_SERVICE] Error clearing OTP:', error.message);
    throw error;
  }
}

module.exports = {
  generateOTPCode,
  hashOTP,
  sendOTPWhatsApp,
  sendOTPEmail,
  sendOTP,
  verifyOTP,
  getOTPStatus,
  clearOTP,
  // Constants
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
  MAX_OTP_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
};
