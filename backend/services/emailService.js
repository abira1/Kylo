/**
 * Email Service for AS AI Agent
 * Handles OTP delivery and notifications via email
 * 
 * Supports:
 * - SendGrid API
 * - Generic SMTP (Nodemailer)
 */

const nodemailer = require('nodemailer');

/**
 * Email Configuration
 */
const EMAIL_CONFIG = {
  provider: process.env.EMAIL_PROVIDER || 'sendgrid', // 'sendgrid' or 'smtp'
  from: process.env.EMAIL_FROM || 'noreply@kylo.ai',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@kylo.ai',
};

/**
 * Email Templates
 */
const emailTemplates = {
  otp: (otpCode, language = 'en') => {
    if (language === 'ar') {
      return {
        subject: 'رمز التحقق الخاص بك',
        html: `
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2>مرحبا</h2>
            <p>رمز التحقق الخاص بك هو:</p>
            <h1 style="background-color: #f0f0f0; padding: 20px; text-align: center; letter-spacing: 5px;">
              ${otpCode}
            </h1>
            <p>الرمز صالح لمدة 10 دقائق فقط.</p>
            <p>إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد الإلكتروني.</p>
            <hr />
            <p style="font-size: 12px; color: #666;">
              جميع الحقوق محفوظة © KYLO AI
            </p>
          </div>
        `,
        text: `رمز التحقق الخاص بك: ${otpCode}\nالرمز صالح لمدة 10 دقائق فقط.`
      };
    }
    
    // English
    return {
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Hello,</h2>
          <p>Your verification code is:</p>
          <h1 style="background-color: #f0f0f0; padding: 20px; text-align: center; letter-spacing: 5px;">
            ${otpCode}
          </h1>
          <p>This code is valid for 10 minutes only.</p>
          <p>If you did not request this code, please ignore this email.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">
            © KYLO AI - All Rights Reserved
          </p>
        </div>
      `,
      text: `Your verification code is: ${otpCode}\nValid for 10 minutes only.`
    };
  },

  sessionAlert: (sessionData, language = 'en') => {
    if (language === 'ar') {
      return {
        subject: 'تنبيه: جلسة الطلب',
        html: `
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2>تنبيه مهم</h2>
            <p>معرف الجلسة: ${sessionData.sessionId}</p>
            <p>الحالة: ${sessionData.status}</p>
            <p>الخطوة الحالية: ${sessionData.currentStep} من 18</p>
          </div>
        `,
        text: `جلسة جديدة: ${sessionData.sessionId}\nالحالة: ${sessionData.status}\nالخطوة: ${sessionData.currentStep}`
      };
    }
    
    return {
      subject: 'Session Alert',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Important Alert</h2>
          <p>Session ID: ${sessionData.sessionId}</p>
          <p>Status: ${sessionData.status}</p>
          <p>Current Step: ${sessionData.currentStep} of 18</p>
        </div>
      `,
      text: `New session: ${sessionData.sessionId}\nStatus: ${sessionData.status}\nStep: ${sessionData.currentStep}`
    };
  },

  escalation: (escalationData, language = 'en') => {
    if (language === 'ar') {
      return {
        subject: 'تصعيد: يتطلب إجراء فوري',
        html: `
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #fff3cd; padding: 20px; border-radius: 5px;">
            <h2 style="color: #856404;">⚠️ تنبيه تصعيد</h2>
            <p>معرف الجلسة: <strong>${escalationData.sessionId}</strong></p>
            <p>السبب: <strong>${escalationData.reason}</strong></p>
            <p>الملاحظات: ${escalationData.notes || 'لا توجد ملاحظات'}</p>
            <p style="margin-top: 20px;">يرجى مراجعة لوحة التحكم للمزيد من التفاصيل.</p>
          </div>
        `,
        text: `تصعيد: ${escalationData.sessionId}\nالسبب: ${escalationData.reason}`
      };
    }
    
    return {
      subject: 'Escalation Alert - Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #fff3cd; padding: 20px; border-radius: 5px;">
          <h2 style="color: #856404;">⚠️ Escalation Alert</h2>
          <p>Session ID: <strong>${escalationData.sessionId}</strong></p>
          <p>Reason: <strong>${escalationData.reason}</strong></p>
          <p>Notes: ${escalationData.notes || 'No notes'}</p>
          <p style="margin-top: 20px;">Please review the dashboard for more details.</p>
        </div>
      `,
      text: `Escalation: ${escalationData.sessionId}\nReason: ${escalationData.reason}`
    };
  }
};

/**
 * Send Email via SendGrid
 */
async function sendViaSendGrid(to, subject, html, text) {
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to,
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      subject,
      text,
      html,
    };

    await sgMail.send(msg);

    console.log(`[EMAIL_SERVICE] Email sent to ${to} via SendGrid`);
    return { success: true, provider: 'sendgrid' };
  } catch (error) {
    console.error('[EMAIL_SERVICE] SendGrid error:', error.message);
    throw error;
  }
}

/**
 * Send Email via SMTP (Nodemailer)
 */
async function sendViaSMTP(to, subject, html, text) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`[EMAIL_SERVICE] Email sent to ${to} via SMTP: ${info.messageId}`);
    return { success: true, provider: 'smtp', messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] SMTP error:', error.message);
    throw error;
  }
}

/**
 * SEND OTP EMAIL
 * Send OTP verification code
 */
async function sendOTPEmail(to, otpCode, language = 'en') {
  try {
    if (!to || !otpCode) {
      throw new Error('to and otpCode are required');
    }

    const template = emailTemplates.otp(otpCode, language);

    const result = EMAIL_CONFIG.provider === 'sendgrid'
      ? await sendViaSendGrid(to, template.subject, template.html, template.text)
      : await sendViaSMTP(to, template.subject, template.html, template.text);

    return {
      success: true,
      to,
      emailType: 'otp',
      sentAt: new Date().toISOString(),
      result
    };
  } catch (error) {
    console.error('[EMAIL_SERVICE] Error sending OTP email:', error.message);
    throw error;
  }
}

/**
 * SEND SESSION ALERT EMAIL
 */
async function sendSessionAlert(to, sessionData, language = 'en') {
  try {
    if (!to || !sessionData) {
      throw new Error('to and sessionData are required');
    }

    const template = emailTemplates.sessionAlert(sessionData, language);

    const result = EMAIL_CONFIG.provider === 'sendgrid'
      ? await sendViaSendGrid(to, template.subject, template.html, template.text)
      : await sendViaSMTP(to, template.subject, template.html, template.text);

    return {
      success: true,
      to,
      emailType: 'sessionAlert',
      sentAt: new Date().toISOString(),
      result
    };
  } catch (error) {
    console.error('[EMAIL_SERVICE] Error sending session alert:', error.message);
    throw error;
  }
}

/**
 * SEND ESCALATION ALERT EMAIL
 */
async function sendEscalationAlert(to, escalationData, language = 'en') {
  try {
    if (!to || !escalationData) {
      throw new Error('to and escalationData are required');
    }

    const template = emailTemplates.escalation(escalationData, language);

    const result = EMAIL_CONFIG.provider === 'sendgrid'
      ? await sendViaSendGrid(to, template.subject, template.html, template.text)
      : await sendViaSMTP(to, template.subject, template.html, template.text);

    return {
      success: true,
      to,
      emailType: 'escalation',
      sentAt: new Date().toISOString(),
      result
    };
  } catch (error) {
    console.error('[EMAIL_SERVICE] Error sending escalation alert:', error.message);
    throw error;
  }
}

/**
 * SEND BATCH EMAILS
 * Send same email to multiple recipients
 */
async function sendBatchEmails(recipients, template) {
  try {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('recipients array is required');
    }

    const results = await Promise.allSettled(
      recipients.map(recipient => 
        EMAIL_CONFIG.provider === 'sendgrid'
          ? sendViaSendGrid(recipient, template.subject, template.html, template.text)
          : sendViaSMTP(recipient, template.subject, template.html, template.text)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`[EMAIL_SERVICE] Batch email sent: ${successful} successful, ${failed} failed`);

    return {
      success: failed === 0,
      totalSent: successful,
      totalFailed: failed,
      results
    };
  } catch (error) {
    console.error('[EMAIL_SERVICE] Error sending batch emails:', error.message);
    throw error;
  }
}

module.exports = {
  sendOTPEmail,
  sendSessionAlert,
  sendEscalationAlert,
  sendBatchEmails,
  emailTemplates,
  EMAIL_CONFIG,
};
