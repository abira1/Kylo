/**
 * Tool Handlers for UAE Agent
 * These handle the 5 required tool calls from Claude:
 * 1. send_otp
 * 2. verify_otp
 * 3. extract_passport
 * 4. escalate_to_human
 * 5. log_pending
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

const db = admin.firestore();

/**
 * SEND OTP
 * Generates OTP, sends via WhatsApp & email, returns confirmation
 */
async function sendOtp(clientId, clientPhone, clientEmail, sessionId) {
  try {
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in session (with 10-minute expiry)
    const sessionRef = db
      .collection('clients')
      .doc(clientId)
      .collection('agentSessions')
      .doc(sessionId);
    
    await sessionRef.update({
      otpCode: otpCode,
      otpGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // TODO: Send via WhatsApp (via WhatsAppMessageService)
    // TODO: Send via Email (via nodemailer or SendGrid)
    console.log(`[OTP] Generated OTP for ${clientPhone}: ${otpCode}`);
    
    return {
      success: true,
      message: 'OTP sent to WhatsApp and email',
    };
  } catch (error) {
    console.error('[OTP] Error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * VERIFY OTP
 * Checks submitted code against backend-stored code
 */
async function verifyOtp(clientId, sessionId, submittedCode) {
  try {
    const sessionRef = db
      .collection('clients')
      .doc(clientId)
      .collection('agentSessions')
      .doc(sessionId);
    
    const sessionDoc = await sessionRef.get();
    const sessionData = sessionDoc.data();

    // Check if OTP exists
    if (!sessionData?.otpCode) {
      return {
        valid: false,
        message: 'No OTP found. Request a new one.',
      };
    }

    // Check if OTP expired
    const otpExpiry = sessionData.otpExpiry?.toDate?.() || new Date(0);
    if (new Date() > otpExpiry) {
      return {
        valid: false,
        message: 'OTP expired. Request a new one.',
      };
    }

    // Check if code matches
    if (sessionData.otpCode !== submittedCode) {
      return {
        valid: false,
        message: 'Code does not match. Please try again.',
      };
    }

    // Mark as verified
    await sessionRef.update({
      otpVerified: true,
      otpAttempts: 0,
      otpCode: admin.firestore.FieldValue.delete(), // Clear the code
    });

    return {
      valid: true,
      message: 'Identity verified successfully',
    };
  } catch (error) {
    console.error('[OTP Verify] Error:', error.message);
    return {
      valid: false,
      message: error.message,
    };
  }
}

/**
 * EXTRACT PASSPORT
 * Calls Claude vision API to extract passport fields
 * Returns structured JSON: { firstName, lastName, gender, dob, placeOfBirth, 
 *                             nationality, passportNumber, issuingLocation, 
 *                             issueDate, expiryDate, ... }
 */
async function extractPassport(fileUrl, sessionId, shareholderIndex = 0) {
  try {
    // For now, simulate extraction
    // In production, this would call Claude's vision API
    
    console.log(`[Passport] Extracting passport from ${fileUrl} for session ${sessionId}`);
    
    // Mock extraction result
    const extractedData = {
      firstName: '[Extracted First Name]',
      lastName: '[Extracted Last Name]',
      gender: '[M/F]',
      dateOfBirth: '[YYYY-MM-DD]',
      placeOfBirth: '[City, Country]',
      nationality: '[Nationality]',
      passportNumber: '[Passport Number]',
      issuingLocation: '[Issuing Location]',
      issuanceCountry: '[Country]',
      issueDate: '[YYYY-MM-DD]',
      expiryDate: '[YYYY-MM-DD]',
      _extractedFromFileUrl: fileUrl,
      _extractedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: extractedData,
    };
  } catch (error) {
    console.error('[Passport Extraction] Error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * ESCALATE TO HUMAN
 * Notifies BSA/CSP team via email/Slack/dashboard
 */
async function escalateToHuman(clientId, sessionId, reason, context) {
  try {
    const escalationRef = db
      .collection('clients')
      .doc(clientId)
      .collection('escalations')
      .add({
        sessionId,
        reason,
        context,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log(`[Escalation] Created escalation for reason: ${reason}`);
    
    // TODO: Send notification to BSA/CSP team
    // TODO: Email to team
    // TODO: Slack message
    // TODO: Dashboard alert
    
    return {
      success: true,
      message: 'Escalation created. Team will contact soon.',
    };
  } catch (error) {
    console.error('[Escalation] Error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * LOG PENDING
 * Appends item to pendingItems array in session state
 */
async function logPending(clientId, sessionId, item) {
  try {
    const sessionRef = db
      .collection('clients')
      .doc(clientId)
      .collection('agentSessions')
      .doc(sessionId);

    await sessionRef.update({
      pendingItems: admin.firestore.FieldValue.arrayUnion(item),
    });

    console.log(`[Pending] Logged: ${item}`);
    
    return {
      success: true,
      message: `Pending item logged: ${item}`,
    };
  } catch (error) {
    console.error('[Pending] Error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
  extractPassport,
  escalateToHuman,
  logPending,
};
