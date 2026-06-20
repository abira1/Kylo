/**
 * Tool Executor Service for AS AI Agent
 * Maps Claude tool calls to actual implementations
 * 
 * Supported tools:
 * - send_otp: Generate and send OTP
 * - verify_otp: Verify OTP code
 * - extract_passport: Extract data from passport image (Vision)
 * - extract_bank_statement: Extract data from bank statement (Vision)
 * - escalate_to_human: Escalate session to human agent
 * - log_pending: Mark item as pending (needed later)
 */

const sessionManager = require('./sessionManagerService');
const otpService = require('./otpService');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');
const documentExtractor = require('./documentExtractor');
const { db } = require('./firebaseService');

/**
 * SEND OTP TOOL
 * Generate and send OTP to user
 */
async function toolSendOTP(sessionId, phoneNumber, email = null, language = 'en') {
  try {
    console.log(`[TOOL_EXECUTOR] Executing send_otp for session ${sessionId}`);

    // Send OTP
    const result = await otpService.sendOTP(sessionId, phoneNumber, email, language);

    // Update session to indicate OTP was sent
    await sessionManager.addPendingItem(sessionId, 'verify_otp', 'User must verify OTP');

    console.log(`[TOOL_EXECUTOR] send_otp completed for session ${sessionId}`);

    return {
      success: true,
      toolName: 'send_otp',
      result: {
        message: 'OTP sent successfully',
        expiresInMinutes: otpService.OTP_EXPIRY_MINUTES,
        channels: ['whatsapp', email ? 'email' : null].filter(Boolean),
        phoneNumber,
        email: email ? email.substring(0, 3) + '***' : null  // Masked for privacy
      }
    };
  } catch (error) {
    console.error('[TOOL_EXECUTOR] Error in send_otp:', error.message);
    return {
      success: false,
      toolName: 'send_otp',
      error: error.message
    };
  }
}

/**
 * VERIFY OTP TOOL
 * Verify user-submitted OTP code
 */
async function toolVerifyOTP(sessionId, submittedCode) {
  try {
    console.log(`[TOOL_EXECUTOR] Executing verify_otp for session ${sessionId}`);

    const result = await otpService.verifyOTP(sessionId, submittedCode);

    if (result.success) {
      // Update session state
      const session = await sessionManager.getSession(sessionId);
      const newState = { ...session.state };
      newState.otpVerified = true;
      
      await sessionManager.updateSession(sessionId, { state: newState });

      console.log(`[TOOL_EXECUTOR] verify_otp succeeded for session ${sessionId}`);

      return {
        success: true,
        toolName: 'verify_otp',
        result: {
          message: 'OTP verified successfully',
          verified: true,
          nextStep: 'Proceed with personal information collection'
        }
      };
    }
  } catch (error) {
    console.error('[TOOL_EXECUTOR] Error in verify_otp:', error.message);

    // Check if escalation needed (max attempts exceeded)
    if (error.message.includes('Maximum OTP attempts')) {
      const escalationResult = await toolEscalateToHuman(sessionId, 'OTP_MAX_ATTEMPTS', {
        reason: 'User exceeded maximum OTP attempts',
        details: error.message
      });

      return {
        success: false,
        toolName: 'verify_otp',
        error: error.message,
        escalation: escalationResult
      };
    }

    return {
      success: false,
      toolName: 'verify_otp',
      error: error.message
    };
  }
}

/**
 * EXTRACT PASSPORT TOOL
 * Extract data from passport using Claude Vision
 */
async function toolExtractPassport(sessionId, passportImageUrl) {
  try {
    console.log(`[TOOL_EXECUTOR] Executing extract_passport for session ${sessionId}`);

    if (!passportImageUrl) {
      throw new Error('passportImageUrl is required');
    }

    // Use Claude Vision to extract passport data
    const extractionResult = await documentExtractor.extractPassportData(passportImageUrl);

    if (!extractionResult.success) {
      throw new Error('Passport extraction failed');
    }

    // Validate extracted data
    const validation = documentExtractor.validateExtractedData('passport', extractionResult.extractedData);

    // Add document to session
    await sessionManager.addDocument(
      sessionId,
      'passport',
      passportImageUrl,
      extractionResult.extractedData
    );

    // Update session with extracted fields
    for (const [key, value] of Object.entries(extractionResult.extractedData)) {
      if (value && key !== 'confidence') {
        await sessionManager.addCollectedField(sessionId, key, value);
      }
    }

    console.log(`[TOOL_EXECUTOR] extract_passport completed for session ${sessionId}`);

    return {
      success: true,
      toolName: 'extract_passport',
      result: {
        message: 'Passport data extracted successfully',
        extractedFields: extractionResult.extractedData,
        confidence: extractionResult.confidence,
        validation: validation,
        fieldsExtracted: Object.keys(extractionResult.extractedData).filter(k => extractionResult.extractedData[k] !== null).length
      }
    };
  } catch (error) {
    console.error('[TOOL_EXECUTOR] Error in extract_passport:', error.message);

    // Add to pending items if extraction failed
    await sessionManager.addPendingItem(
      sessionId,
      'manual_passport_data',
      'Automated passport extraction failed - manual entry required'
    );

    return {
      success: false,
      toolName: 'extract_passport',
      error: error.message,
      fallback: 'Manual data entry required - please provide passport details manually'
    };
  }
}

/**
 * EXTRACT BANK STATEMENT TOOL
 * Extract account data from bank statement
 */
async function toolExtractBankStatement(sessionId, bankStatementImageUrl) {
  try {
    console.log(`[TOOL_EXECUTOR] Executing extract_bank_statement for session ${sessionId}`);

    if (!bankStatementImageUrl) {
      throw new Error('bankStatementImageUrl is required');
    }

    // Use Claude Vision to extract bank statement data
    const extractionResult = await documentExtractor.extractBankStatementData(bankStatementImageUrl);

    if (!extractionResult.success) {
      throw new Error('Bank statement extraction failed');
    }

    // Validate extracted data
    const validation = documentExtractor.validateExtractedData('bankStatement', extractionResult.extractedData);

    // Add document to session
    await sessionManager.addDocument(
      sessionId,
      'bankStatements',
      bankStatementImageUrl,
      extractionResult.extractedData
    );

    // Update session with extracted fields
    for (const [key, value] of Object.entries(extractionResult.extractedData)) {
      if (value && key !== 'confidence') {
        await sessionManager.addCollectedField(sessionId, `bankStatement_${key}`, value);
      }
    }

    console.log(`[TOOL_EXECUTOR] extract_bank_statement completed for session ${sessionId}`);

    return {
      success: true,
      toolName: 'extract_bank_statement',
      result: {
        message: 'Bank statement data extracted successfully',
        extractedFields: extractionResult.extractedData,
        confidence: extractionResult.confidence,
        validation: validation,
        accountNumber: extractionResult.extractedData.accountNumber ? extractionResult.extractedData.accountNumber.substring(0, 6) + '***' : 'N/A' // Masked
      }
    };
  } catch (error) {
    console.error('[TOOL_EXECUTOR] Error in extract_bank_statement:', error.message);

    await sessionManager.addPendingItem(
      sessionId,
      'manual_bank_data',
      'Automated bank statement extraction failed - manual entry required'
    );

    return {
      success: false,
      toolName: 'extract_bank_statement',
      error: error.message,
      fallback: 'Manual data entry required - please provide bank statement details manually'
    };
  }
}

/**
 * ESCALATE TO HUMAN TOOL
 * Escalate session to human agent
 */
async function toolEscalateToHuman(sessionId, escalationReason, context = {}) {
  try {
    console.log(`[TOOL_EXECUTOR] Executing escalate_to_human for session ${sessionId}, reason: ${escalationReason}`);

    const escalationResult = await sessionManager.escalateSession(sessionId, escalationReason, context);

    // Get session details for email
    const session = await sessionManager.getSession(sessionId);
    const escalationData = {
      sessionId,
      escalationId: escalationResult.escalationId,
      reason: escalationReason,
      notes: context.notes || '',
      clientId: session.clientId,
      phoneNumber: session.phoneNumber,
      currentStep: session.state.currentStep,
    };

    // Send email notification to team
    const teamEmail = process.env.TEAM_ESCALATION_EMAIL || 'escalations@kylo.ai';
    if (teamEmail && teamEmail !== 'escalations@kylo.ai') {
      try {
        await emailService.sendEscalationAlert(teamEmail, escalationData, session.state.language);
        console.log(`[TOOL_EXECUTOR] Escalation email sent to ${teamEmail}`);
      } catch (emailError) {
        console.warn(`[TOOL_EXECUTOR] Failed to send escalation email:`, emailError.message);
        // Don't fail escalation if email fails
      }
    }

    // Send WhatsApp message to user about escalation
    try {
      const message = session.state.language === 'ar'
        ? 'تم تصعيد طلبك. سيتصل بك أحد أعضاء الفريق قريباً. شكراً لصبرك.'
        : 'Your request has been escalated to our team. A team member will contact you shortly. Thank you for your patience.';
      
      await whatsappService.sendTextMessage(session.phoneNumber, message, session.state.language);
      console.log(`[TOOL_EXECUTOR] WhatsApp escalation message sent to ${session.phoneNumber}`);
    } catch (whatsappError) {
      console.warn(`[TOOL_EXECUTOR] Failed to send WhatsApp message:`, whatsappError.message);
    }

    console.log(`[TOOL_EXECUTOR] escalate_to_human completed for session ${sessionId}`);

    return {
      success: true,
      toolName: 'escalate_to_human',
      result: {
        message: 'Session escalated to human agent',
        escalationId: escalationResult.escalationId,
        reason: escalationReason,
        nextSteps: 'A team member will contact you shortly',
        notificationsSent: true
      }
    };
  } catch (error) {
    console.error('[TOOL_EXECUTOR] Error in escalate_to_human:', error.message);

    return {
      success: false,
      toolName: 'escalate_to_human',
      error: error.message
    };
  }
}

/**
 * LOG PENDING TOOL
 * Mark an item as pending (needed later)
 */
async function toolLogPending(sessionId, itemName, reason = '') {
  try {
    console.log(`[TOOL_EXECUTOR] Executing log_pending for session ${sessionId}, item: ${itemName}`);

    await sessionManager.addPendingItem(sessionId, itemName, reason);

    console.log(`[TOOL_EXECUTOR] log_pending completed for session ${sessionId}`);

    return {
      success: true,
      toolName: 'log_pending',
      result: {
        message: `Item marked as pending: ${itemName}`,
        itemName,
        reason
      }
    };
  } catch (error) {
    console.error('[TOOL_EXECUTOR] Error in log_pending:', error.message);

    return {
      success: false,
      toolName: 'log_pending',
      error: error.message
    };
  }
}

/**
 * EXECUTE TOOL
 * Main entry point - route tool calls to appropriate handler
 */
async function executeTool(toolName, toolInput, sessionId) {
  try {
    console.log(`[TOOL_EXECUTOR] Executing tool: ${toolName}`);

    switch (toolName) {
      case 'send_otp':
        return await toolSendOTP(
          sessionId,
          toolInput.phoneNumber,
          toolInput.email || null,
          toolInput.language || 'en'
        );

      case 'verify_otp':
        return await toolVerifyOTP(sessionId, toolInput.code);

      case 'extract_passport':
        return await toolExtractPassport(sessionId, toolInput.imageUrl);

      case 'extract_bank_statement':
        return await toolExtractBankStatement(sessionId, toolInput.imageUrl);

      case 'escalate_to_human':
        return await toolEscalateToHuman(
          sessionId,
          toolInput.reason,
          toolInput.context || {}
        );

      case 'log_pending':
        return await toolLogPending(
          sessionId,
          toolInput.itemName,
          toolInput.reason || ''
        );

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`
        };
    }
  } catch (error) {
    console.error(`[TOOL_EXECUTOR] Error executing tool ${toolName}:`, error.message);

    return {
      success: false,
      toolName,
      error: error.message
    };
  }
}

/**
 * PARSE TOOL CALLS FROM CLAUDE
 * Extract tool calls from Claude's response
 */
function parseToolCalls(claudeResponse) {
  try {
    // Claude returns tool calls in this format in content blocks
    const toolCalls = [];

    if (Array.isArray(claudeResponse.content)) {
      for (const block of claudeResponse.content) {
        if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input
          });
        }
      }
    }

    return toolCalls;
  } catch (error) {
    console.error('[TOOL_EXECUTOR] Error parsing tool calls:', error.message);
    return [];
  }
}

module.exports = {
  executeTool,
  parseToolCalls,
  toolSendOTP,
  toolVerifyOTP,
  toolExtractPassport,
  toolExtractBankStatement,
  toolEscalateToHuman,
  toolLogPending,
};
