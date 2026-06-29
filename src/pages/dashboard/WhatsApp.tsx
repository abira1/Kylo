import {
  Smartphone,
  ShieldCheck,
  AppWindow,
  Phone,
  KeyRound,
  Webhook,
  MessageSquareText,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const NEEDS = [
  'Meta Business Account with Business Verification completed',
  'App ID (from a Meta "App" with the WhatsApp product added)',
  'WhatsApp Business Account (WABA) ID',
  'Phone Number ID + the display phone number (the number customers message)',
  'Permanent Access Token (System User token — not the temporary 24-hour one)',
  'A Verify Token (a secret word you make up — for the webhook)',
  'Approved message templates (greeting + follow-up nudge)',
  'A payment method added to the WhatsApp account',
];

interface StepCardProps {
  index: string;
  icon: React.ElementType;
  title: string;
  required?: boolean;
  note?: string;
  children: React.ReactNode;
}

function StepCard({ index, icon: Icon, title, required, note, children }: StepCardProps) {
  return (
    <div className="bento-card p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shrink-0">
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{index}</span>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            {required && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Required
              </span>
            )}
          </div>
          {note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{note}</p>}
        </div>
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 pl-1">{children}</div>
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

export function WhatsApp() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
          <Smartphone size={24} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            WhatsApp Business (Cloud API) Setup
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Follow these steps so your AI can send and receive WhatsApp messages through Meta's official Cloud API.
          </p>
        </div>
      </div>

      {/* What we need */}
      <div className="bento-card p-5 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3">
          What we need (collect all of these)
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {NEEDS.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 2A */}
      <StepCard
        index="2A"
        icon={ShieldCheck}
        title="Business Verification"
        required
        note="Required for production sending limits and to remove restrictions.">
        <ol className="list-decimal list-inside space-y-1.5">
          <li>
            Go to{' '}
            <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-cyan-400 font-medium hover:underline inline-flex items-center gap-1">
              business.facebook.com <ExternalLink size={12} />
            </a>{' '}
            → Settings (gear) → Business Info / Security Center.
          </li>
          <li>Start Business Verification and submit the requested legal documents (trade licence, etc.).</li>
          <li>Wait for Meta approval (can take 1–3 business days).</li>
        </ol>
      </StepCard>

      {/* 2B */}
      <StepCard index="2B" icon={AppWindow} title="Create the App & add WhatsApp">
        <ol className="list-decimal list-inside space-y-1.5">
          <li>
            Go to{' '}
            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-cyan-400 font-medium hover:underline inline-flex items-center gap-1">
              developers.facebook.com <ExternalLink size={12} />
            </a>{' '}
            → My Apps → Create App.
          </li>
          <li>Choose type <b>Business</b>, name it <code className="px-1 rounded bg-gray-100 dark:bg-navy-800">KYLO WhatsApp</code>, link it to your Business Account.</li>
          <li>On the app dashboard, find <b>WhatsApp</b> and click <b>Set up</b>.</li>
          <li>Note the <b>App ID</b> (top of the app dashboard). ➡️ Send to us.</li>
        </ol>
      </StepCard>

      {/* 2C */}
      <StepCard index="2C" icon={Phone} title="Add & verify the business phone number">
        <ol className="list-decimal list-inside space-y-1.5">
          <li>In the app: <b>WhatsApp → API Setup</b> (or "Getting Started").</li>
          <li>Click <b>Add phone number</b> and enter the number you'll use.</li>
          <li>Verify it via the SMS/voice code Meta sends.</li>
          <li>On the API Setup page you will now see: <b>Phone number ID</b>, <b>WABA ID</b>, and the <b>display number</b>. ➡️ Send all three to us.</li>
        </ol>
        <Warn>
          The number must <b>not</b> be currently active on the normal WhatsApp or WhatsApp Business app. If it is, delete that account first.
        </Warn>
      </StepCard>

      {/* 2D */}
      <StepCard
        index="2D"
        icon={KeyRound}
        title="Permanent Access Token"
        required
        note="The token on the API Setup page expires in 24 hours — useless for production. Create a permanent one:">
        <ol className="list-decimal list-inside space-y-1.5">
          <li>business.facebook.com → Settings → Users → System Users.</li>
          <li>Click <b>Add</b>, name it <code className="px-1 rounded bg-gray-100 dark:bg-navy-800">KYLO Automation</code>, role Admin, Create.</li>
          <li>Add Assets → select your WhatsApp Account (WABA) → enable Full control / Manage. Save.</li>
          <li>Click <b>Generate New Token</b>, select your app (KYLO WhatsApp).</li>
          <li>Set token expiration to <b>Never</b>.</li>
          <li>Tick: <code className="px-1 rounded bg-gray-100 dark:bg-navy-800">whatsapp_business_messaging</code> and <code className="px-1 rounded bg-gray-100 dark:bg-navy-800">whatsapp_business_management</code>.</li>
          <li>Generate → copy the token (starts with <code className="px-1 rounded bg-gray-100 dark:bg-navy-800">EAA...</code>). ➡️ Send to us securely.</li>
        </ol>
        <Warn>You only see the token once — copy it immediately.</Warn>
      </StepCard>

      {/* 2E */}
      <StepCard index="2E" icon={KeyRound} title="Verify Token (you invent this)" required>
        <ul className="list-disc list-inside space-y-1.5">
          <li>Make up any secret string, e.g. <code className="px-1 rounded bg-gray-100 dark:bg-navy-800">kylo-webhook-2026-x7Q</code>. ➡️ Send it to us.</li>
          <li>We enter the same value in n8n; Meta uses it to confirm the webhook is really yours.</li>
        </ul>
      </StepCard>

      {/* 2F */}
      <StepCard index="2F" icon={Webhook} title="Webhook (we set the URL; you click subscribe)">
        <ol className="list-decimal list-inside space-y-1.5">
          <li>In the app: <b>WhatsApp → Configuration → Edit</b> under Webhooks.</li>
          <li>Callback URL: <code className="px-1 rounded bg-gray-100 dark:bg-navy-800 break-all">https://&lt;YOUR-N8N-DOMAIN&gt;/webhook/whatsapp-incoming</code> (we confirm the exact path).</li>
          <li>Verify token: the value from §2E.</li>
          <li>Click <b>Verify and Save</b>.</li>
          <li>Under Webhook fields, <b>Subscribe</b> to <code className="px-1 rounded bg-gray-100 dark:bg-navy-800">messages</code>.</li>
        </ol>
        <Warn>Without subscribing to <b>messages</b>, the AI never receives replies.</Warn>
      </StepCard>

      {/* 2G */}
      <StepCard index="2G" icon={MessageSquareText} title="Message templates" required>
        <p>
          The first message to a brand-new lead must be a Meta-approved template (no exceptions). Create them in{' '}
          <b>WhatsApp Manager → Message Templates → Create template</b>:
        </p>
        <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-navy-800/50 space-y-1">
          <p className="font-semibold">Template 1 — Greeting (kylo_greeting)</p>
          <ul className="list-disc list-inside text-xs space-y-1">
            <li>Category: Marketing (or Utility) → type Custom</li>
            <li>Variable type: Number (gives {'{{1}}'})</li>
            <li>Body: greeting text with {'{{1}}'} for the lead's first name</li>
            <li>Footer (optional): "Reply STOP to opt out at any time."</li>
            <li>Buttons: NONE</li>
          </ul>
        </div>
        <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-navy-800/50 space-y-1">
          <p className="font-semibold">Template 2 — Follow-up nudge (kylo_followup_nudge)</p>
          <p className="text-xs">Same rules; a gentle "still there?" message with {'{{1}}'}, no buttons.</p>
        </div>
        <p className="mt-2 text-xs">Submit each and wait for Approved status. ➡️ Tell us the final approved template names.</p>
        <Warn>Do not add a "Catalog" or any button — it locks the template and blocks sending.</Warn>
      </StepCard>

      {/* 2H */}
      <StepCard index="2H" icon={CreditCard} title="Payment method" required>
        <ul className="list-disc list-inside space-y-1.5">
          <li>WhatsApp Manager → Settings → Payment methods → Add a card.</li>
          <li>WhatsApp conversations cost money beyond the free tier; without a payment method, sending stops.</li>
        </ul>
      </StepCard>

      {/* Footer */}
      <div className="bento-card p-5 sm:p-6 text-sm text-gray-600 dark:text-gray-400">
        Once you have everything above, send the details to us securely and we'll finish the connection. Need help? Contact your KYLO account manager.
      </div>
    </div>
  );
}
