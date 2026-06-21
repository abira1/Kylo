import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Code,
  Copy,
  Check,
  Palette,
  MessageSquare,
  Settings2,
  Bot,
  X,
  Send,
  RefreshCw,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeData } from '../../hooks/useData';
import { subscribeToTrainingFiles, TrainingFile } from '../../services/dataService';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  options?: string[];
}

interface FormData {
  [key: string]: string | string[] | boolean | null;
}

// Backend API endpoint configuration
// Development: localhost backend on port 5001
// Production: Railway backend at kylo-production.up.railway.app
const API_BASE_URL = (() => {
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('5173')
  );
  
  if (isLocalhost) {
    return 'http://localhost:5001';
  }
  
  // Production: use Railway backend directly
  return 'https://kylo-production.up.railway.app';
})();

export function Embed() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [botName, setBotName] = useState('Support Assistant');
  const [welcomeMsg, setWelcomeMsg] = useState('Hi there! How can I help you today?');
  const [primaryColor, setPrimaryColor] = useState('#06b6d4');
  
  // Chat state
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Form-based flow state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  // Demo mode: use a fixed clientId for testing without authentication
  const demoClientId = 'gxx8SK6WQHfd9xZ2HOLUW3PDFGE3';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load training files as QA context
  const subscribe = useCallback((cb: (data: TrainingFile[]) => void) => {
    if (user?.uid) {
      return subscribeToTrainingFiles(user.uid, cb);
    }
    cb([]);
    return () => {};
  }, [user?.uid]);

  const { data: trainingFiles } = useRealtimeData<TrainingFile[]>(
    subscribe,
    []
  );

  // Form-based lead collection steps
  const formSteps = [
    {
      step: 0,
      question: "Hi! I'm here to help you with your UAE license application. Should we start now?",
      type: 'buttons',
      options: ['Yes, proceed', 'Later'],
      field: 'consent'
    },
    {
      step: 1,
      question: "What's your full name?",
      type: 'text',
      field: 'fullName'
    },
    {
      step: 2,
      question: "What's your email address?",
      type: 'text',
      field: 'email'
    },
    {
      step: 3,
      question: "What's your mobile number?",
      type: 'text',
      field: 'mobile'
    },
    {
      step: 4,
      question: "What country are you currently in?",
      type: 'text',
      field: 'country'
    },
    {
      step: 5,
      question: "Please share your passport number",
      type: 'text',
      field: 'passport'
    },
    {
      step: 6,
      question: "What type of business are you planning to establish?",
      type: 'text',
      field: 'businessType'
    },
    {
      step: 7,
      question: "Which UAE free zone or mainland location interests you?",
      type: 'buttons',
      options: ['Mainland', 'Dubai Free Zone', 'Ajman Free Zone', 'Other'],
      field: 'jurisdiction'
    },
    {
      step: 8,
      question: "How many visas will you need?",
      type: 'buttons',
      options: ['1', '2', '3', '4+'],
      field: 'visaCount'
    },
    {
      step: 9,
      question: "How many shareholders will be in this company?",
      type: 'buttons',
      options: ['1 (Just me)', '2', '3', '4+'],
      field: 'shareholderCount'
    },
    {
      step: 10,
      question: "What's your estimated monthly revenue (AED)?",
      type: 'buttons',
      options: ['Under 10K', '10K-50K', '50K-100K', '100K+'],
      field: 'revenue'
    },
    {
      step: 11,
      question: "Do you have existing business documents to share?",
      type: 'buttons',
      options: ['Yes', 'No'],
      field: 'existingDocs'
    }
  ];

  // Initialize chat with first message
  useEffect(() => {
    if (messages.length === 0 && currentStep === 0) {
      const firstStep = formSteps[0];
      setMessages([{
        id: 'step-0',
        text: firstStep.question,
        isBot: true,
        options: firstStep.type === 'buttons' ? firstStep.options : undefined
      }]);
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const embedCode = `<script>
  window.KYLO_AI_CONFIG = {
    botId: "${user?.uid || demoClientId}",
    theme: "${primaryColor}",
    position: "bottom-right",
    title: "${botName}"
  };
</script>
<script src="https://cdn.kylo-ai.com/widget.js" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOptionClick = async (option: string) => {
    // Handle special cases
    if (currentStep === 0 && option === 'Later') {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: option, isBot: false }
      ]);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: 'No problem! Feel free to come back anytime. 😊',
          isBot: true,
        }
      ]);
      return;
    }

    // Add user's response
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: option,
      isBot: false
    };
    setMessages((prev) => [...prev, newUserMsg]);

    // Update form data
    const currentStepData = formSteps[currentStep];
    setFormData((prev) => ({
      ...prev,
      [currentStepData.field]: option
    }));

    // Move to next step
    const nextStep = currentStep + 1;
    if (nextStep < formSteps.length) {
      setIsTyping(true);
      setTimeout(() => {
        const stepData = formSteps[nextStep];
        setMessages((prev) => [
          ...prev,
          {
            id: `step-${nextStep}`,
            text: stepData.question,
            isBot: true,
            options: stepData.type === 'buttons' ? stepData.options : undefined
          }
        ]);
        setCurrentStep(nextStep);
        setIsTyping(false);
      }, 500);
    } else {
      // Form complete - send to backend
      await submitFormToBackend();
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      isBot: false
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue('');

    // Update form data with text input
    const currentStepData = formSteps[currentStep];
    setFormData((prev) => ({
      ...prev,
      [currentStepData.field]: userMessage
    }));

    // Move to next step
    const nextStep = currentStep + 1;
    if (nextStep < formSteps.length) {
      setIsTyping(true);
      setTimeout(() => {
        const stepData = formSteps[nextStep];
        setMessages((prev) => [
          ...prev,
          {
            id: `step-${nextStep}`,
            text: stepData.question,
            isBot: true,
            options: stepData.type === 'buttons' ? stepData.options : undefined
          }
        ]);
        setCurrentStep(nextStep);
        setIsTyping(false);
      }, 500);
    } else {
      // Form complete - send to backend
      await submitFormToBackend();
    }
  };

  const submitFormToBackend = async () => {
    setIsTyping(true);
    setApiError(null);

    try {
      const clientId = user?.uid || demoClientId;

      // Convert form data to messages format
      const formMessages = Object.entries(formData).map(([key, value], idx) => ({
        role: 'user' as const,
        content: `${key}: ${value}`
      }));

      // Call Claude API via backend
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          conversationId,
          messages: formMessages,
          qaContext: trainingFiles.map(file => ({
            id: file.id,
            question: file.name,
            answer: `Document: ${file.name}`,
            category: 'training',
            usage: 0,
            createdAt: file.uploadedAt || new Date().toISOString(),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: data.message,
          isBot: true,
        }
      ]);
    } catch (error) {
      setIsTyping(false);
      const errorMsg = error instanceof Error ? error.message : 'Failed to get response';
      setApiError(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: `Thank you for providing your information! Our team will review your details and follow up shortly.`,
          isBot: true,
        }
      ]);
    }
  };

  const handleResetChat = () => {
    setMessages([{
      id: 'step-0',
      text: formSteps[0].question,
      isBot: true,
      options: formSteps[0].options
    }]);
    setCurrentStep(0);
    setFormData({});
    setInputValue('');
    setApiError(null);
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Embed & Setup
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
          Customize your widget and install it on your website. The preview uses Claude AI powered by your training documents.
        </p>
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-400">Backend Connection Error</p>
            <p className="text-sm text-red-800 dark:text-red-300 mt-1">{apiError}</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-2">
              💡 Tip: Run <code className="bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">npm run dev:backend</code> in another terminal to start the Claude API server.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bento-card">
            <div className="flex items-center gap-3 mb-5 border-b border-gray-100 dark:border-navy-700 pb-4">
              <Palette className="text-emerald-500 dark:text-cyan-400" size={20} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Appearance</h2>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label-text">Bot Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-text">Brand Color</label>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-navy-700 flex-shrink-0">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="absolute -inset-2 w-[200%] h-[200%] cursor-pointer border-0 p-0"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="input-field font-mono text-sm uppercase"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="label-text">Welcome Message</label>
                <textarea
                  className="input-field min-h-[100px] resize-none"
                  value={welcomeMsg}
                  onChange={(e) => setWelcomeMsg(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bento-card">
            <div className="flex items-center gap-3 mb-5 border-b border-gray-100 dark:border-navy-700 pb-4">
              <Code className="text-emerald-500 dark:text-cyan-400" size={20} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Installation Code</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
              Paste this snippet right before the closing{' '}
              <code className="bg-gray-100 dark:bg-navy-900 px-1.5 py-0.5 rounded-lg text-xs font-mono text-emerald-600 dark:text-cyan-400">
                &lt;/body&gt;
              </code>{' '}
              tag on your website.
            </p>
            <div className="relative group">
              <pre className="bg-navy-950 text-gray-300 p-5 rounded-2xl text-xs sm:text-sm overflow-x-auto font-mono shadow-inner border border-navy-800 leading-relaxed">
                {embedCode}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all text-white flex items-center gap-2 text-xs font-bold opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bento-card flex flex-col h-[600px] xl:sticky xl:top-24 overflow-hidden p-0 relative">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-navy-700 bg-white dark:bg-navy-900 z-10">
            <div className="flex items-center gap-3">
              <Settings2 className="text-emerald-500 dark:text-cyan-400" size={20} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Interactive Preview</h2>
            </div>
            <button
              onClick={handleResetChat}
              className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
              title="Reset Chat">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="flex-1 bg-gray-50 dark:bg-navy-950 relative overflow-hidden">
            {/* Fake Website Background */}
            <div className="absolute inset-0 p-6 sm:p-8 opacity-40 pointer-events-none">
              <div className="w-32 h-6 bg-gray-300 dark:bg-navy-800 rounded-md mb-12"></div>
              <div className="w-3/4 h-10 bg-gray-300 dark:bg-navy-800 rounded-lg mb-6"></div>
              <div className="w-1/2 h-4 bg-gray-300 dark:bg-navy-800 rounded mb-12"></div>
              <div className="grid grid-cols-2 gap-6">
                <div className="w-full h-32 bg-gray-300 dark:bg-navy-800 rounded-xl"></div>
                <div className="w-full h-32 bg-gray-300 dark:bg-navy-800 rounded-xl"></div>
              </div>
            </div>

            {/* Floating Widget Button */}
            <button
              onClick={() => setIsWidgetOpen(!isWidgetOpen)}
              className="absolute bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 z-20"
              style={{ backgroundColor: primaryColor }}>
              {isWidgetOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>

            {/* Widget Window */}
            <div
              className={`absolute bottom-24 right-6 w-[calc(100%-3rem)] sm:w-[340px] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900 transition-all duration-300 origin-bottom-right z-20 ${
                isWidgetOpen ? 'scale-100 opacity-100' : 'scale-50 opacity-0 pointer-events-none'
              }`}
              style={{ height: '420px' }}>
              
              {/* Widget Header */}
              <div className="p-4 text-white flex items-center justify-between shadow-sm z-10" style={{ backgroundColor: primaryColor }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Bot size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-tight">{botName}</div>
                    <div className="text-xs text-white/90 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                      Online
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsWidgetOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Widget Body (Chat Messages) */}
              <div className="flex-1 p-4 bg-gray-50/50 dark:bg-navy-900/50 overflow-y-auto flex flex-col gap-4">
                {messages.map((msg) =>
                  <div key={msg.id}>
                    <div className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[85%] p-3 text-sm shadow-sm ${
                          msg.isBot
                            ? 'bg-white dark:bg-navy-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-navy-700'
                            : 'text-white rounded-2xl rounded-tr-sm'
                        }`}
                        style={!msg.isBot ? { backgroundColor: primaryColor } : {}}>
                        {msg.text}
                      </div>
                    </div>
                    
                    {/* Show options if available */}
                    {msg.isBot && msg.options && (
                      <div className="flex flex-col gap-2 mt-3 ml-0">
                        {msg.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleOptionClick(option)}
                            className="text-left px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all"
                            style={{
                              borderColor: primaryColor,
                              color: primaryColor,
                              backgroundColor: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}>
                            {option}
                            <ChevronRight size={14} className="inline ml-2" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-navy-800 p-4 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-navy-700 shadow-sm flex gap-1.5 items-center h-[42px]">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Widget Input - Show based on current step type */}
              {currentStep < formSteps.length && formSteps[currentStep].type === 'text' ? (
                <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-navy-800 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    className="flex-1 bg-gray-100 dark:bg-navy-950 border border-transparent focus:border-gray-200 dark:focus:border-navy-700 rounded-full px-4 py-2.5 text-sm outline-none dark:text-white transition-colors"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="w-10 h-10 rounded-full text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}>
                    <Send size={16} className="ml-0.5" />
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-navy-800 text-center text-xs text-gray-500 dark:text-gray-400">
                  {currentStep >= formSteps.length ? '✓ Form complete' : 'Select an option above'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
