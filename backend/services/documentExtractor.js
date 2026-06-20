/**
 * Document Extractor Service for AS AI Agent
 * Uses Claude Vision API to extract data from documents
 * 
 * Supports:
 * - Passport extraction
 * - Bank statement extraction
 * - Visa documents
 * - Any image-based document
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

/**
 * Initialize Anthropic client
 */
const anthropicClient = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

/**
 * Vision Prompts for extraction
 */
const EXTRACTION_PROMPTS = {
  passport: `Extract all passport information from this image. Return as JSON with these exact fields:
{
  "firstName": "first name",
  "lastName": "last name",
  "fullName": "full name",
  "passportNumber": "passport number",
  "nationality": "nationality/country",
  "dateOfBirth": "date of birth (YYYY-MM-DD)",
  "gender": "M/F",
  "issueDate": "issue date (YYYY-MM-DD)",
  "expiryDate": "expiry date (YYYY-MM-DD)",
  "issuingCountry": "country code",
  "pageNumber": "page number if visible",
  "mrzLine1": "machine readable zone line 1",
  "mrzLine2": "machine readable zone line 2",
  "confidence": "confidence score (0-100)"
}
Return ONLY valid JSON, no other text. If a field cannot be extracted, use null.`,

  visa: `Extract visa information from this image. Return as JSON with these exact fields:
{
  "visaNumber": "visa number",
  "visaType": "type of visa",
  "issueDate": "issue date (YYYY-MM-DD)",
  "expiryDate": "expiry date (YYYY-MM-DD)",
  "issuingCountry": "country code",
  "passportNumber": "passport number if visible",
  "numberOfEntries": "number of entries allowed",
  "duration": "duration of stay",
  "conditions": "any conditions or restrictions",
  "confidence": "confidence score (0-100)"
}
Return ONLY valid JSON, no other text. If a field cannot be extracted, use null.`,

  bankStatement: `Extract account and transaction information from this bank statement. Return as JSON with these exact fields:
{
  "accountHolder": "account holder name",
  "accountNumber": "account number",
  "bankName": "bank name",
  "iban": "IBAN if available",
  "statementPeriod": {
    "from": "start date (YYYY-MM-DD)",
    "to": "end date (YYYY-MM-DD)"
  },
  "openingBalance": "opening balance amount",
  "closingBalance": "closing balance amount",
  "currency": "currency code (e.g., AED, USD)",
  "totalCredits": "total credit amount",
  "totalDebits": "total debit amount",
  "transactionCount": "number of transactions",
  "branches": ["branch names if visible"],
  "accountType": "account type",
  "confidence": "confidence score (0-100)"
}
Return ONLY valid JSON, no other text. Extract summary info only, not individual transactions. Use null for unknown fields.`,

  license: `Extract UAE Business License information from this document. Return as JSON with these exact fields:
{
  "licenseNumber": "license number",
  "licenseType": "trade license type",
  "businessNameEnglish": "business name in English",
  "businessNameArabic": "business name in Arabic",
  "businessActivityCode": "activity code",
  "businessActivityDescription": "activity description",
  "issueDate": "issue date (YYYY-MM-DD)",
  "expiryDate": "expiry date (YYYY-MM-DD)",
  "licenseStatus": "license status",
  "registrationNumber": "registration number",
  "owner": "owner name",
  "jurisdiction": "jurisdiction/emirate",
  "confidence": "confidence score (0-100)"
}
Return ONLY valid JSON, no other text. If a field cannot be extracted, use null.`
};

/**
 * EXTRACT PASSPORT DATA
 * Use Claude Vision to extract passport information
 */
async function extractPassportData(imageUrl) {
  try {
    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    console.log(`[DOCUMENT_EXTRACTOR] Extracting passport data from: ${imageUrl.substring(0, 50)}...`);

    const response = await anthropicClient.messages.create({
      model: 'claude-opus-4-1-20250805', // Use latest model with Vision
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPTS.passport,
            },
          ],
        },
      ],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    console.log(`[DOCUMENT_EXTRACTOR] Passport extraction successful: ${extractedData.fullName || 'N/A'}`);

    return {
      success: true,
      documentType: 'passport',
      extractedData,
      confidence: extractedData.confidence || 0,
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[DOCUMENT_EXTRACTOR] Error extracting passport:', error.message);
    throw error;
  }
}

/**
 * EXTRACT VISA DATA
 */
async function extractVisaData(imageUrl) {
  try {
    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    console.log(`[DOCUMENT_EXTRACTOR] Extracting visa data from: ${imageUrl.substring(0, 50)}...`);

    const response = await anthropicClient.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPTS.visa,
            },
          ],
        },
      ],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    console.log(`[DOCUMENT_EXTRACTOR] Visa extraction successful`);

    return {
      success: true,
      documentType: 'visa',
      extractedData,
      confidence: extractedData.confidence || 0,
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[DOCUMENT_EXTRACTOR] Error extracting visa:', error.message);
    throw error;
  }
}

/**
 * EXTRACT BANK STATEMENT DATA
 */
async function extractBankStatementData(imageUrl) {
  try {
    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    console.log(`[DOCUMENT_EXTRACTOR] Extracting bank statement data from: ${imageUrl.substring(0, 50)}...`);

    const response = await anthropicClient.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPTS.bankStatement,
            },
          ],
        },
      ],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    console.log(`[DOCUMENT_EXTRACTOR] Bank statement extraction successful: ${extractedData.accountNumber || 'N/A'}`);

    return {
      success: true,
      documentType: 'bankStatement',
      extractedData,
      confidence: extractedData.confidence || 0,
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[DOCUMENT_EXTRACTOR] Error extracting bank statement:', error.message);
    throw error;
  }
}

/**
 * EXTRACT LICENSE DATA
 */
async function extractLicenseData(imageUrl) {
  try {
    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    console.log(`[DOCUMENT_EXTRACTOR] Extracting license data from: ${imageUrl.substring(0, 50)}...`);

    const response = await anthropicClient.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPTS.license,
            },
          ],
        },
      ],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    console.log(`[DOCUMENT_EXTRACTOR] License extraction successful: ${extractedData.licenseNumber || 'N/A'}`);

    return {
      success: true,
      documentType: 'license',
      extractedData,
      confidence: extractedData.confidence || 0,
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[DOCUMENT_EXTRACTOR] Error extracting license:', error.message);
    throw error;
  }
}

/**
 * EXTRACT DOCUMENT (Generic)
 * Route to appropriate extractor based on document type
 */
async function extractDocument(documentType, imageUrl) {
  try {
    if (!documentType || !imageUrl) {
      throw new Error('documentType and imageUrl are required');
    }

    switch (documentType.toLowerCase()) {
      case 'passport':
        return await extractPassportData(imageUrl);
      
      case 'visa':
        return await extractVisaData(imageUrl);
      
      case 'bankstatement':
      case 'bank_statement':
        return await extractBankStatementData(imageUrl);
      
      case 'license':
      case 'business_license':
        return await extractLicenseData(imageUrl);
      
      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }
  } catch (error) {
    console.error('[DOCUMENT_EXTRACTOR] Error extracting document:', error.message);
    throw error;
  }
}

/**
 * VALIDATE EXTRACTED DATA
 * Verify extracted data has required fields
 */
function validateExtractedData(documentType, extractedData) {
  try {
    if (!extractedData || typeof extractedData !== 'object') {
      return { valid: false, errors: ['Invalid data format'] };
    }

    const errors = [];
    const requiredFields = {
      passport: ['passportNumber', 'fullName', 'dateOfBirth'],
      visa: ['visaNumber', 'visaType', 'expiryDate'],
      bankStatement: ['accountNumber', 'accountHolder', 'currency'],
      license: ['licenseNumber', 'businessNameEnglish', 'businessActivityCode'],
    };

    const fields = requiredFields[documentType] || [];
    for (const field of fields) {
      if (!extractedData[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      fieldsChecked: fields.length,
      fieldsFound: fields.filter(f => extractedData[f]).length,
    };
  } catch (error) {
    console.error('[DOCUMENT_EXTRACTOR] Error validating data:', error.message);
    return { valid: false, errors: [error.message] };
  }
}

module.exports = {
  extractPassportData,
  extractVisaData,
  extractBankStatementData,
  extractLicenseData,
  extractDocument,
  validateExtractedData,
  EXTRACTION_PROMPTS,
};
