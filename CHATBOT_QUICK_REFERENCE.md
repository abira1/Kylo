# CHATBOT TRAINING QUICK REFERENCE

## 🎯 The 18 Steps at a Glance

```
STEP 1  → Opening & Consent
STEP 2  → OTP Verification (MANDATORY GATE)
STEP 3  → Passport Collection
STEP 4  → Country of Residence
STEP 5  → Alternate Nationality
STEP 6  → Residential Address
STEP 7  → UAE Entry Status
STEP 8  → Company Name Preferences (3 names)
STEP 9  → Business Activity Confirmation
STEP 10 → Visa Allocation Confirmation
STEP 11 → Shareholder Count Confirmation (triggers multi-shareholder if needed)
STEP 12 → Share Structure Confirmation
STEP 13 → Manager Assignment
STEP 14 → Director Assignment
STEP 15 → UBO (Ultimate Beneficial Owner) Assignment
STEP 16 → Business Profile (revenue, trade countries, website, etc.)
STEP 17 → Source of Funds / AML Compliance (MANDATORY)
STEP 18 → Closing Summary (pending items or complete)
```

## 🔑 Core Rules (Never Break These)

1. **One Question at a Time** - Wait for answer before next Q
2. **Follow Fixed Order** - Don't skip or reorder unless branch says to
3. **Autofill, Never Re-Ask** - Once passport extracted, don't ask first name again
4. **Confirm, Don't Re-Collect** - Business activity/visas/shareholders pre-set
5. **Hard Stop on Documents** - Either receive or log_pending
6. **Warm Sales Tone** - Not robotic, not a checklist
7. **Buttons or Lists** - Fixed options only, never free text for yes/no
8. **Track Pending Items** - Everything outstanding must surface in Step 18
9. **Never Fabricate Data** - Ask directly if unsure
10. **Respect Scheduling** - If client asks to pause, stop until time arrives
11. **Stay in Scope** - Don't give legal/tax advice
12. **One Message Per Turn** - Never split across bubbles
13. **Mirror Language** - English default, switch to Arabic if client initiates

## 🛠️ Tool Calls (What Claude Requests)

```javascript
// Send OTP to client
[TOOL CALL: send_otp(clientPhone="+971501234567", clientEmail="ahmed@example.com")]

// Verify OTP submitted by client
[TOOL CALL: verify_otp(submittedCode="123456")]

// Extract passport fields from uploaded document
[TOOL CALL: extract_passport(fileUrl="https://...passport.pdf")]

// Notify BSA/CSP team, pause agent
[TOOL CALL: escalate_to_human(reason="OTP verification failed after 3 attempts", context="...")]

// Track item as outstanding until Step 18
[TOOL CALL: log_pending(item="UAE residence visa copy")]
```

## 📱 WhatsApp Message Types

```
PLAIN TEXT
├─ Use for: Questions, acknowledgements, information
└─ Example: "Thank you for your information"

QUICK REPLY BUTTONS (≤3 only)
├─ Use for: Yes/No, Correct/Incorrect, Inside/Outside
└─ Example: "Are you inside UAE?" [Inside UAE] [Outside UAE]
    OR: "Do you have alternate nationality?" [Yes] [No]

LIST MESSAGE (4+ options)
├─ Use for: Multiple-choice questions
├─ Example: "Select your entry proof type:"
│   1. Cancelled UAE Residence Visa
│   2. Tourist / Visit Visa  
│   3. Visa on Arrival
│   4. Other visa
└─ Max 10 items total per Meta API limit

DOCUMENT
├─ Use for: Sending files to client
└─ Example: Send passport template, form, etc.
```

## 🚨 Branching Logic

### OTP Failures (Step 2)
```
Attempt 1 fails → Ask retry/resend
Attempt 2 fails → Ask retry/resend
Attempt 3 fails → ESCALATE [TOOL_CALL: escalate_to_human(...)]
                  Stop flow, wait for BSA
```

### UAE Entry Status (Step 7)
```
Inside UAE → Ask for proof (List Message: 4 doc types)
Outside UAE → Ask: "Resident or visited before?"
              Resident → Request residence visa
              Visited → Request tourist/visit visa

If doc not available → log_pending, continue
```

### Shareholder Count (Step 11)
```
Correct → Continue to Step 12
Incorrect → Ask new count
           Add extras to shareholderQueue
           Repeat Steps 3-7 for EACH additional
           Then continue to Step 12
```

### Business Activity (Step 9)
```
Confirmed → Continue to Step 10
Disputed → ESCALATE [TOOL_CALL: escalate_to_human(...)]
          Wait for BSA phone call
          Update activity in system
          Resume from Step 10
```

### Source of Funds (Step 17)
```
Salaried → Request 3-month bank statement
Business Owner → Request 6-month bank statement + ownership proof

Either/both missing → log_pending, continue to Step 18
```

## ✅ Pre-Closing Checklist (Before Step 18)

Run this before sending closing message:

```
[ ] Identity verified via OTP
[ ] Passport(s) received & extracted for all shareholders
[ ] Alternate nationality resolved
[ ] Address collected & validated
[ ] UAE entry proof received OR log_pending
[ ] 3 company names collected
[ ] Business activity confirmed (or escalated & re-confirmed)
[ ] Visa allocation confirmed
[ ] Shareholder count confirmed
[ ] Share structure confirmed & capital calculated
[ ] Manager, director, UBO all assigned
[ ] Business profile complete
[ ] Source of funds / AML done
[ ] Pending list compiled
[ ] Reminder scheduled for pending
```

## 🔥 What You MUST NEVER Do

- Never ask for field extracted via passport
- Never skip OTP verification gate
- Never accept transit visa (24/48/96hr) as valid entry
- Never silently drop pending documents
- Never overwrite business activity yourself when disputed
- Never bundle two unrelated questions
- Never give legal/tax/immigration advice
- Never proceed while rescheduleUntil is active
- Never generate/guess/self-verify OTP
- Never perform OCR yourself
- Never send >3 buttons in one message
- Never split turn across multiple bubbles
- Never skip Step 17 (AML is mandatory)

## 📊 Data Fields Reference

### Personal Info (AUTO = extracted from passport)
```
First Name [AUTO]
Last Name [AUTO]
Gender [AUTO]
Date of Birth [AUTO]
Place of Birth [AUTO]
Nationality [AUTO]
Email [AUTO]
Mobile Number [AUTO]
Country of Residence [ASK]
Alternate Nationality [ASK]
Residential Address [ASK]
```

### Passport (AUTO from upload)
```
Passport Number [AUTO]
Issuing Location [AUTO]
Issuance Country [AUTO]
Issue Date [AUTO]
Expiry Date [AUTO]
Passport File [DOC]
```

### Company Setup (AUTO from BSA, confirm)
```
Business Activity [AUTO + CONFIRM]
Visa Allocation [AUTO + CONFIRM]
Shareholder Count [AUTO + CONFIRM]
```

### Company Details (ASK)
```
Preferred Company Names 1/2/3 [ASK]
New or Existing [ASK]
Paid-Up Capital [ASK]
Has Website [ASK]
Multinational Group [ASK]
```

### Share Structure (ASK/CONFIRM)
```
Number of Shares [ASK]
Value Per Share AED [ASK]
Total Share Capital [CALCULATED]
```

### Roles (ASK)
```
Manager [ASK: Self or New Person]
Director [ASK: Self or New Person]
UBO [ASK: Self or New Person]
```

### Business Profile (ASK)
```
Estimated Revenue AED [ASK]
Countries Selling To [ASK - List]
Countries Buying From [ASK - List]
```

### AML/Source of Funds (ASK + DOC)
```
Employment Status [ASK: Salaried/Business Owner]
Bank Statement - 3 months [DOC - if salaried]
Bank Statement - 6 months [DOC - if business owner]
Ownership Proof [DOC - if business owner]
```

## 🎓 Code Examples

### Sending Quick Reply
```javascript
await WhatsAppMessageService.sendQuickReplyMessage(
  config,
  "+971501234567",
  "Do you have alternate nationality?",
  ["Yes", "No"]
);
```

### Sending List Message
```javascript
await WhatsAppMessageService.sendListMessage(
  config,
  "+971501234567",
  "Select your entry proof type:",
  [{
    title: "UAE Entry Documents",
    options: [
      { id: "visa_1", title: "Cancelled Residence Visa", description: "Valid cancellation" },
      { id: "visa_2", title: "Tourist/Visit Visa", description: "Active or expired" },
      { id: "visa_3", title: "Visa on Arrival", description: "Entry stamp" },
      { id: "visa_4", title: "Other Visa", description: "Another type" }
    ]
  }]
);
```

### Logging Pending Item
```javascript
[TOOL CALL: log_pending(item="UAE residence visa copy")]
```

### Handling Multi-Shareholder
```javascript
// After Step 11 shows shareholder count is 3
shareholderQueue = [
  { index: 1, status: "pending" },
  { index: 2, status: "pending" }
];

// Loop: for each shareholder in queue
//   Repeat Steps 3-7
//   Mark complete
//   Move to next

// After all collected, continue to Step 12
```

## 🚀 Testing a Conversation

### Test Sequence 1: Happy Path (OTP → Passport → Final)
```
Client: "Hi, I want to set up business"
Agent: Greeting + [YES] [LATER]
Client: "YES"
Agent: OTP sent + [TOOL: send_otp]
Client: "123456"
Agent: [TOOL: verify_otp] → Verified
Agent: "Kindly share passport"
Client: [uploads file]
Agent: [TOOL: extract_passport] → Extracted
Agent: "Country of residence?"
Client: "UAE"
Agent: "Alternate nationality?" [YES] [NO]
Client: "NO"
Agent: "Residential address?"
Client: "[address]"
... (continue through Step 17)
Agent: "All received! Thank you..."
```

### Test Sequence 2: OTP Failure
```
Client: "YES, proceed"
Agent: OTP sent [TOOL: send_otp]
Client: "000000" (wrong)
Agent: "Invalid. Resend?" [Retry] [Resend]
Client: "Resend"
Agent: [TOOL: send_otp] (attempt 2)
Client: "111111" (wrong)
Agent: "Invalid. Retry?" [Retry] [Resend]
Client: "Resend"
Agent: [TOOL: send_otp] (attempt 3)
Client: "222222" (wrong)
Agent: [TOOL: escalate_to_human]
Agent: "Our team will contact you soon"
(Flow paused, BSA takes over)
```

### Test Sequence 3: Multi-Shareholder
```
Agent: "You are 1 of 1, correct?" [Correct] [Incorrect]
Client: "Incorrect, 3 people"
Agent: "OK, collecting data for 3 shareholders"
(Repeat Steps 3-7 for person 2)
(Repeat Steps 3-7 for person 3)
Agent: "Thank you all for the information"
(Continue to Step 12)
```

## 📈 Monitoring & Debugging

### Check Session State
```javascript
// In Firestore:
clients/{clientId}/agentSessions/{sessionId}
→ currentStep: which step?
→ collectedFields: what's been collected?
→ pendingItems: what's outstanding?
→ otpAttempts: how many attempts?
→ conversationHistory: full log of all messages
```

### Check for Escalations
```javascript
// In Firestore:
clients/{clientId}/escalations/{escalationId}
→ reason: why escalated?
→ status: pending/resolved?
→ context: details?
```

### Check OTP Status
```javascript
// In Firestore:
clients/{clientId}/agentSessions/{sessionId}
→ otpCode: encrypted code (if still pending)
→ otpExpiry: when does it expire?
→ otpVerified: true/false?
→ otpAttempts: count
```

---

**Need more help? See CHATBOT_TRAINING_IMPLEMENTATION_GUIDE.md**
