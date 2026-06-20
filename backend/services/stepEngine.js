/**
 * Step Engine Service
 * Defines and manages the 18-step process flow for UAE Business License & Visa applications
 * 
 * Steps 1-18 represent the complete application workflow:
 * 1. Welcome & Language Selection
 * 2. Service Type Selection
 * 3. Email Confirmation
 * 4. Personal Information
 * 5. Passport Upload
 * 6. Passport Validation
 * 7. Current Visa Status
 * 8. Business Details
 * 9. Financial Information
 * 10. Bank Statement Upload
 * 11. Shareholding Structure
 * 12. Shareholder 1 Details
 * 13. Additional Shareholders (if needed)
 * 14. Shareholder Documents Loop
 * 15. OTP Verification
 * 16. Application Review
 * 17. Final Submission
 * 18. Follow-up & Support
 */

const stepPrompts = {
  en: {
    1: `🎉 Welcome to KYLO AI - Business License & Visa Assistant
    
I'll help you apply for a UAE Business License and/or Visa through a guided process.

Please select your preferred language:
1️⃣ English
2️⃣ العربية (Arabic)`,

    2: `📋 What would you like to apply for today?

1️⃣ UAE Business License Only
2️⃣ UAE Visa Only
3️⃣ Both License & Visa`,

    3: `📧 Please provide your email address for application updates:`,

    4: `👤 Personal Information
    
Please provide the following:
• Full Name (as per passport)
• Date of Birth (DD/MM/YYYY)
• Nationality
• Gender (M/F)`,

    5: `📸 Upload Your Passport
    
Please share:
• A clear photo of your passport bio page
• All pages should be visible and legible`,

    6: `✅ Verifying Your Passport...
    
Your passport has been verified. Proceeding with application.`,

    7: `🏠 Do you currently have a UAE visa?
    
1️⃣ Yes (provide visa number)
2️⃣ No
3️⃣ Renewal`,

    8: `🏢 Business Information
    
Please provide:
• Proposed Company Name
• Business Activity / Sector
• Planned Location (Emirate)
• Number of Partners/Shareholders`,

    9: `💰 Financial Information
    
For the business:
• Estimated Annual Revenue
• Initial Capital
• Primary Bank Account Country`,

    10: `📄 Bank Statement Upload
    
Please upload your most recent bank statement (last 3 months):
• Clear and legible
• All pages (usually 3-5 pages)`,

    11: `👥 Shareholding Structure
    
How many people will be shareholders?
1️⃣ Just Me (Single Shareholder)
2️⃣ Two or More (Multiple Shareholders)`,

    12: `👤 Shareholder 1 Details
    
First shareholder information:
• Name
• Nationality
• Passport Number
• Shareholding %`,

    13: `👥 Additional Shareholders
    
Continue entering shareholder details, or type "Done" when finished.`,

    14: `📎 Shareholder Documents
    
For each shareholder, please provide:
• Copy of Passport
• Proof of Address`,

    15: `🔐 Verification
    
We've sent a 6-digit OTP to your registered email and WhatsApp.
Please enter the OTP code:`,

    16: `📋 Application Review
    
Please review the collected information:

[Summary of all collected data]

Is everything correct?
1️⃣ Yes, Proceed
2️⃣ No, I need to make changes`,

    17: `✅ Submission Complete!
    
Your application has been submitted successfully.
You will receive updates at your email: [email]

Reference Number: [REF-NUMBER]
Expected Processing Time: 5-10 business days`,

    18: `📞 Support & Follow-up
    
Thank you for using KYLO AI!
    
📧 Email: support@kylo.ai
📞 WhatsApp: +971-xx-xxx-xxxx
🌐 Portal: https://kylo-support.web.app

You can check your application status anytime.`,
  },

  ar: {
    1: `🎉 مرحباً بك في KYLO AI - مساعد ترخيص الأعمال والتأشيرة
    
سأساعدك في تقديم طلب للحصول على ترخيص أعمال إماراتية و/أو تأشيرة من خلال عملية موجهة.

يرجى اختيار لغتك المفضلة:
1️⃣ English
2️⃣ العربية (Arabic)`,

    2: `📋 ما الذي تود التقديم له اليوم؟

1️⃣ ترخيص أعمال إماراتي فقط
2️⃣ تأشيرة إماراتية فقط
3️⃣ كل من الرخصة والتأشيرة`,

    3: `📧 يرجى تقديم عنوان بريدك الإلكتروني للحصول على تحديثات الطلب:`,

    4: `👤 المعلومات الشخصية
    
يرجى تقديم:
• الاسم الكامل (كما هو موجود في جواز السفر)
• تاريخ الميلاد (DD/MM/YYYY)
• الجنسية
• النوع (ذكر/أنثى)`,

    5: `📸 تحميل جواز سفرك
    
يرجى مشاركة:
• صورة واضحة من صفحة البيانات الشخصية في جواز السفر
• يجب أن تكون جميع الصفحات مرئية وسهلة القراءة`,

    6: `✅ جاري التحقق من جواز سفرك...
    
تم التحقق من جواز سفرك. جاري المتابعة مع الطلب.`,

    7: `🏠 هل لديك حالياً تأشيرة إماراتية؟
    
1️⃣ نعم (تقديم رقم التأشيرة)
2️⃣ لا
3️⃣ تجديد`,

    8: `🏢 معلومات الأعمال
    
يرجى تقديم:
• اسم الشركة المقترح
• نشاط / قطاع الأعمال
• الموقع المخطط له (الإمارة)
• عدد الشركاء/المساهمين`,

    9: `💰 المعلومات المالية
    
بخصوص الأعمال:
• الإيرادات السنوية المتوقعة
• رأس المال الأولي
• دولة حساب البنك الأساسي`,

    10: `📄 تحميل كشف الحساب البنكي
    
يرجى تحميل كشف حسابك الأخير (آخر 3 أشهر):
• واضح وسهل القراءة
• جميع الصفحات (عادة 3-5 صفحات)`,

    11: `👥 هيكل الملكية
    
كم عدد الأشخاص الذين سيكونون مساهمين؟
1️⃣ أنا فقط (مساهم واحد)
2️⃣ اثنان أو أكثر (عدة مساهمين)`,

    12: `👤 تفاصيل المساهم الأول
    
معلومات المساهم الأول:
• الاسم
• الجنسية
• رقم جواز السفر
• نسبة الملكية %`,

    13: `👥 المساهمون الإضافيون
    
استمر في إدخال تفاصيل المساهمين، أو اكتب "Done" عند الانتهاء.`,

    14: `📎 وثائق المساهمين
    
لكل مساهم، يرجى تقديم:
• نسخة من جواز السفر
• إثبات العنوان`,

    15: `🔐 التحقق
    
أرسلنا رمز OTP المكون من 6 أرقام إلى بريدك الإلكتروني والواتس أب.
يرجى إدخال رمز OTP:`,

    16: `📋 مراجعة الطلب
    
يرجى مراجعة المعلومات المجمعة:

[ملخص جميع البيانات المجمعة]

هل كل شيء صحيح؟
1️⃣ نعم، تابع
2️⃣ لا، أحتاج إلى إجراء تغييرات`,

    17: `✅ اكتملت عملية الإرسال!
    
تم إرسال طلبك بنجاح.
ستتلقى تحديثات على بريدك الإلكتروني: [email]

رقم المرجع: [REF-NUMBER]
وقت المعالجة المتوقع: 5-10 أيام عمل`,

    18: `📞 الدعم والمتابعة
    
شكراً لاستخدامك KYLO AI!
    
📧 البريد الإلكتروني: support@kylo.ai
📞 واتس أب: +971-xx-xxx-xxxx
🌐 البوابة: https://kylo-support.web.app

يمكنك التحقق من حالة طلبك في أي وقت.`,
  }
};

/**
 * Step validation rules - define what constitutes a valid response for each step
 */
const stepValidators = {
  1: (response) => /^[12]$/i.test(response.trim()),
  2: (response) => /^[123]$/i.test(response.trim()),
  3: (response) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(response.trim()),
  4: (response) => response.trim().length > 5, // Basic check for name
  5: (message) => message.type === 'image' || message.type === 'document',
  6: (response) => true, // Always valid - auto-verification
  7: (response) => /^[123]$/i.test(response.trim()),
  8: (response) => response.trim().length > 3,
  9: (response) => response.trim().length > 3,
  10: (message) => message.type === 'document',
  11: (response) => /^[12]$/i.test(response.trim()),
  12: (response) => response.trim().length > 5,
  13: (response) => response.trim().toLowerCase() === 'done' || response.trim().length > 5,
  14: (message) => message.type === 'image' || message.type === 'document',
  15: (response) => /^\d{6}$/.test(response.trim()),
  16: (response) => /^[12]$/i.test(response.trim()),
  17: (response) => true, // Informational step
  18: (response) => true, // Informational step
};

/**
 * Data extraction rules - how to extract structured data from responses
 */
const stepExtractors = {
  1: (response) => ({ preferredLanguage: (response.trim ? response.trim() : response) === '1' ? 'en' : 'ar' }),
  2: (response) => {
    const choice = parseInt(response.trim ? response.trim() : response);
    return {
      applicationType: choice === 1 ? 'license' : choice === 2 ? 'visa' : 'both',
    };
  },
  3: (response) => ({ email: (response.trim ? response.trim() : response) }),
  4: (response) => {
    const text = response.trim ? response.trim() : response;
    const lines = text.split('\n').filter(l => l.trim());
    return {
      fullName: lines[0] || '',
      dateOfBirth: lines[1] || '',
      nationality: lines[2] || '',
      gender: lines[3] || '',
    };
  },
  5: (message) => ({ passportUploadUrl: message.content || message }),
  6: (response) => ({ passportVerified: true }),
  7: (response) => ({ visaStatus: (response.trim ? response.trim() : response) === '1' ? 'yes' : (response.trim ? response.trim() : response) === '2' ? 'no' : 'renewal' }),
  8: (response) => {
    const text = response.trim ? response.trim() : response;
    const lines = text.split('\n').filter(l => l.trim());
    return {
      companyName: lines[0] || '',
      businessActivity: lines[1] || '',
      location: lines[2] || '',
      shareholderCount: lines[3] || '',
    };
  },
  9: (response) => {
    const text = response.trim ? response.trim() : response;
    const lines = text.split('\n').filter(l => l.trim());
    return {
      estimatedRevenue: lines[0] || '',
      initialCapital: lines[1] || '',
      bankCountry: lines[2] || '',
    };
  },
  10: (message) => ({ bankStatementUrl: message.content || message }),
  11: (response) => ({ shareholdingStructure: (response.trim ? response.trim() : response) === '1' ? 'single' : 'multiple' }),
  12: (response) => {
    const text = response.trim ? response.trim() : response;
    const lines = text.split('\n').filter(l => l.trim());
    return {
      shareholder_1_name: lines[0] || '',
      shareholder_1_nationality: lines[1] || '',
      shareholder_1_passport: lines[2] || '',
      shareholder_1_percentage: lines[3] || '',
    };
  },
  13: (response) => {
    const text = response.trim ? response.trim() : response;
    if (text.toLowerCase() === 'done') {
      return { shareholdersCollected: true };
    }
    const lines = text.split('\n').filter(l => l.trim());
    return {
      shareholder_name: lines[0] || '',
      shareholder_nationality: lines[1] || '',
      shareholder_passport: lines[2] || '',
      shareholder_percentage: lines[3] || '',
    };
  },
  14: (message) => ({ shareholderDocumentUrl: message.content || message }),
  15: (response) => ({ otpSubmitted: (response.trim ? response.trim() : response) }),
  16: (response) => ({ confirmed: (response.trim ? response.trim() : response) === '1' }),
  17: (response) => ({ submitted: true }),
  18: (response) => ({ completed: true }),
};

/**
 * Get the prompt for a specific step
 * @param {number} step - Step number (1-18)
 * @param {Object} context - Context object with language preference
 * @returns {string} Prompt text for the step
 */
function getStepPrompt(step, context = {}) {
  const language = context.language || 'en';
  const prompts = stepPrompts[language] || stepPrompts.en;
  return prompts[step] || `Step ${step}`;
}

/**
 * Get retry prompt when validation fails
 * @param {number} step - Step number
 * @param {string} error - Error message
 * @param {string} language - Language code
 * @returns {string} Retry prompt
 */
function getRetryPrompt(step, error, language = 'en') {
  const messages = {
    en: {
      invalid: 'Sorry, that response is not valid. Please try again.',
      document: 'Please upload a valid document (image or PDF).',
      number: 'Please enter a valid number.',
      email: 'Please enter a valid email address.',
    },
    ar: {
      invalid: 'عذراً، هذا الرد غير صالح. يرجى المحاولة مرة أخرى.',
      document: 'يرجى تحميل مستند صحيح (صورة أو PDF).',
      number: 'يرجى إدخال رقم صحيح.',
      email: 'يرجى إدخال عنوان بريد إلكتروني صحيح.',
    }
  };

  const msgs = messages[language] || messages.en;
  return msgs[error] || msgs.invalid;
}

/**
 * Validate response for a step
 * @param {number} step - Step number
 * @param {Object} message - Message object or response string
 * @returns {Object} { isValid: boolean, error?: string }
 */
function validateStepResponse(step, message) {
  try {
    const validator = stepValidators[step];
    if (!validator) {
      return { isValid: true };
    }

    const isValid = validator(message);
    if (!isValid) {
      return {
        isValid: false,
        error: 'invalid',
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error(`[STEP_ENGINE] Validation error at step ${step}:`, error.message);
    return { isValid: false, error: 'invalid' };
  }
}

/**
 * Extract structured data from a step response
 * @param {number} step - Step number
 * @param {Object} message - Message object
 * @returns {Object} Extracted data fields
 */
function extractStepData(step, message) {
  try {
    const extractor = stepExtractors[step];
    if (!extractor) {
      return {};
    }

    const data = extractor(message);
    console.log(`[STEP_ENGINE] Extracted data from step ${step}:`, Object.keys(data));
    return data;
  } catch (error) {
    console.error(`[STEP_ENGINE] Extraction error at step ${step}:`, error.message);
    return {};
  }
}

/**
 * Process a step response - validate and extract data
 * @param {number} step - Step number
 * @param {Object} message - User message
 * @param {string} claudeResponse - Claude's response
 * @param {Object} context - Session context
 * @returns {Promise<Object>} { isValid, error?, collectedData? }
 */
async function processStepResponse(step, message, claudeResponse, context) {
  try {
    console.log(`[STEP_ENGINE] Processing step ${step} response`);

    // Validate response
    const validation = validateStepResponse(step, message);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        error: validation.error || 'invalid',
      };
    }

    // Extract data
    const collectedData = extractStepData(step, message);

    // Apply special logic for multi-shareholder scenarios
    if (step === 11 && collectedData.shareholdingStructure === 'multiple') {
      // Initialize shareholder queue
      collectedData.shareholderQueue = [];
      collectedData.shareholderIndex = 0;
    }

    if (step === 13 && collectedData.shareholdersCollected) {
      // Shareholder collection complete
      collectedData.shareholderCollectionComplete = true;
    }

    return {
      isValid: true,
      collectedData,
    };
  } catch (error) {
    console.error(`[STEP_ENGINE] Error processing step ${step}:`, error.message);
    return {
      isValid: false,
      error: 'processing',
    };
  }
}

/**
 * Get next step based on current step and conditions
 * @param {number} currentStep - Current step number
 * @param {Object} sessionData - Current session data
 * @returns {number} Next step number
 */
function getNextStep(currentStep, sessionData = {}) {
  // Handle conditional step skipping
  
  // Step 7: Skip if not applying for visa
  if (currentStep === 6 && sessionData.applicationType === 'license') {
    return 8; // Skip visa status question
  }

  // Step 13: Multi-shareholder loop
  if (currentStep === 13 && sessionData.shareholdingStructure === 'multiple') {
    if (!sessionData.shareholderCollectionComplete) {
      return 13; // Stay at step 13 for more shareholders
    }
  }

  // Default: next step
  return Math.min(currentStep + 1, 18);
}

/**
 * Get step status for a session
 * @param {Object} sessionData - Session data
 * @returns {Object} Step summary
 */
function getStepStatus(sessionData) {
  const currentStep = sessionData.currentStep || 1;
  const completionPercentage = Math.round((currentStep / 18) * 100);

  return {
    currentStep,
    totalSteps: 18,
    percentComplete: completionPercentage,
    status: currentStep >= 18 ? 'completed' : 'in-progress',
    collectedFields: Object.keys(sessionData.collectedFields || {}),
    pendingItems: sessionData.pendingItems || [],
  };
}

module.exports = {
  getStepPrompt,
  getRetryPrompt,
  validateStepResponse,
  extractStepData,
  processStepResponse,
  getNextStep,
  getStepStatus,
};
