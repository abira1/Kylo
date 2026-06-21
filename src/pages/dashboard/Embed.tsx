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
  ChevronRight,
  Upload,
  Download,
  File
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeData } from '../../hooks/useData';
import { subscribeToTrainingFiles, TrainingFile } from '../../services/dataService';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  options?: string[];
  hasDocument?: boolean;
  documentType?: string;
}

interface ConversationContext {
  [key: string]: any;
}

const API_BASE_URL = (() => {
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('5173')
  );
  
  if (isLocalhost) {
    return 'http://localhost:5001';
  }
  
  return 'https://kylo-production.up.railway.app';
})();

/**
 * Parse markdown-style text and convert to React elements
 * Supports: **bold**, *italic*, _italic_, newlines, and lists
 */
const parseMessageText = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Split by newlines first to preserve line breaks
  const lines = text.split('\n');
  
  return lines.map((line, lineIdx) => {
    const lineParts: React.ReactNode[] = [];
    let index = 0;
    
    // Match **bold**, *italic*, _italic_
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;
    let match;
    let lastPos = 0;
    
    while ((match = regex.exec(line)) !== null) {
      // Add text before the match
      if (match.index > lastPos) {
        lineParts.push(line.substring(lastPos, match.index));
      }
      
      // Add the formatted text
      if (match[1]) {
        // **bold**
        lineParts.push(<strong key={`bold-${lineIdx}-${match.index}`} className="font-bold">{match[1]}</strong>);
      } else if (match[2]) {
        // *italic*
        lineParts.push(<em key={`italic-${lineIdx}-${match.index}`} className="italic">{match[2]}</em>);
      } else if (match[3]) {
        // _italic_
        lineParts.push(<em key={`italic-${lineIdx}-${match.index}`} className="italic">{match[3]}</em>);
      }
      
      lastPos = regex.lastIndex;
    }
    
    // Add remaining text
    if (lastPos < line.length) {
      lineParts.push(line.substring(lastPos));
    }
    
    // If the line is empty or only whitespace, add a space to preserve it
    if (lineParts.length === 0) {
      lineParts.push('\u00A0');
    }
    
    return (
      <div key={`line-${lineIdx}`}>
        {lineParts}
      </div>
    );
  });
};

export function Embed() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [botName, setBotName] = useState('Support Assistant');
  const [welcomeMsg, setWelcomeMsg] = useState('Hi there! How can I help you today?');
  const [primaryColor, setPrimaryColor] = useState('#06b6d4');
  
  // Chat state - now conversational, not form-based
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Hi! I am Support Assistant from KYLO-AI. I am here to help you with your UAE license application or answer any questions you might have. Would you like to:\n\n1. Learn more about our services?\n2. Apply for a UAE license?\n3. Ask a question?',
      isBot: true,
      options: ['Learn about services', 'Apply for license', 'Ask question']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({});
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  
  const demoClientId = 'gxx8SK6WQHfd9xZ2HOLUW3PDFGE3';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  /**
   * Parse Claude's response to extract options if they're formatted in the message
   * Claude can indicate options with markers like: [OPTION] text here [/OPTION]
   * or by listing them with numbers: 1) Option one 2) Option two or 1. Option one 2. Option two
   */
  const parseOptionsFromResponse = (text: string): { text: string; options: string[] | undefined } => {
    // Check for explicit option markers
    const optionMarkerRegex = /\[OPTION\](.*?)\[\/OPTION\]/gs;
    const matches = Array.from(text.matchAll(optionMarkerRegex));
    
    if (matches.length > 0) {
      const options = matches.map(m => m[1].trim());
      const cleanText = text.replace(optionMarkerRegex, '').trim();
      return { text: cleanText, options };
    }

    // Check for numbered list format with ) or . separators
    // Matches: "1) Option" or "1. Option" with 2-4 options
    const numberedListRegex = /(\d+)[.)]\s*([^\n\d]+?)(?=\s*\d+[.)]\s|$)/gs;
    const numberedMatches = Array.from(text.matchAll(numberedListRegex));
    
    if (numberedMatches.length >= 2 && numberedMatches.length <= 4) {
      const options = numberedMatches.map(m => m[2].trim());
      
      // Only use these as buttons if they're reasonably short (not long paragraphs)
      if (options.every(opt => opt.length < 100 && !opt.includes('\n'))) {
        // Remove the numbered list from the text
        const cleanText = text.replace(numberedListRegex, '').trim();
        return { text: cleanText, options };
      }
    }

    return { text, options: undefined };
  };

  /**
   * Check if we have enough lead data to auto-save
   */
  const hasEnoughLeadData = (): boolean => {
    const context = conversationContext;
    // SIMPLE: Need at least name + phone number to save a lead
    // Everything else is OPTIONAL
    const hasName = context.fullName || context.name;
    const hasPhone = context.phone && context.phone.trim();
    
    const isReady = !!(hasName && hasPhone);
    if (isReady) {
      console.log('[LEAD CHECK] ✅ Minimum data ready: name + phone');
    }
    return isReady;
  };

  /**
   * Auto-save lead to Firestore when enough data is collected
   */
  const autoSaveLead = async (forceSource?: string) => {
    // Prevent duplicate saves - check if already saved
    if (leadSaved) {
      console.log('[LEAD] ⚠️ Lead already saved, skipping duplicate save (leadSaved flag is TRUE)');
      return false;
    }

    if (!hasEnoughLeadData()) {
      console.log('[LEAD] Not enough data to save:', conversationContext);
      return false;
    }

    try {
      const clientId = user?.uid || demoClientId;
      console.log('[LEAD] 📤 Attempting auto-save for client:', clientId, '| conversationId:', conversationId);
      console.log('[LEAD] Current leadSaved flag:', leadSaved);
      console.log('[LEAD] Source:', forceSource || (conversationContext.passportNumber ? 'passport_upload' : 'chat'));
      
      const leadData = {
        conversationId,
        messages: messages,
        // REQUIRED: name and phone
        name: conversationContext.fullName || conversationContext.name || 'Unknown',
        phone: conversationContext.phone || '',
        // OPTIONAL: everything else
        email: conversationContext.email || '',
        country: conversationContext.nationality || conversationContext.country || '',
        businessType: conversationContext.businessType || '',
        passportNumber: conversationContext.passportNumber || '',
        dateOfBirth: conversationContext.dateOfBirth || '',
        extractedData: conversationContext,
        status: 'new',
        source: forceSource || (conversationContext.passportNumber ? 'passport_upload' : 'chat'),
        notes: `Lead auto-captured with name+phone. Source: ${forceSource || 'chat'}`
      };

      console.log('[LEAD] Sending POST request to /api/leads with data:', leadData);

      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, leadData }),
      });

      console.log('[LEAD] Response status:', response.status);
      const responseData = await response.json();
      console.log('[LEAD] Response data:', responseData);

      if (response.ok) {
        setLeadSaved(true);
        console.log('[LEAD] ✅ Auto-saved successfully!');
        console.log('[LEAD] Response leadId:', responseData.leadId);
        console.log('[LEAD] ConversationId for this lead:', conversationId);
        console.log('[LEAD] Next autoSaveLead call will skip (leadSaved=true)');
        
        // Show success message
        setMessages((prev) => [...prev, {
          id: `auto_save_${Date.now()}`,
          text: `✓ Your information has been saved to our system\n(Reference: ${responseData.leadId?.slice(0, 12)}...)`,
          isBot: true,
        }]);
        
        return true;
      } else {
        console.error('[LEAD] Save failed with status:', response.status, responseData);
        setMessages((prev) => [...prev, {
          id: `save_error_${Date.now()}`,
          text: `⚠ There was an issue saving your information. Error: ${responseData.error || 'Unknown error'}`,
          isBot: true,
        }]);
        return false;
      }
    } catch (error) {
      console.error('[LEAD] Auto-save error:', error);
      setMessages((prev) => [...prev, {
        id: `save_error_${Date.now()}`,
        text: `⚠ Error saving your information: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isBot: true,
      }]);
      return false;
    }
  };

  /**
   * Main conversation handler - sends to Claude, gets smart response
   */
  const handleSendMessage = async (userInput?: string) => {
    const messageToSend = userInput || inputValue;
    if (!messageToSend.trim()) return;

    // Add user message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: messageToSend,
      isBot: false
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);
    setApiError(null);

    try {
      const clientId = user?.uid || demoClientId;

      // Build message history for Claude
      const claudeMessages = messages.map(m => ({
        role: m.isBot ? 'assistant' : 'user',
        content: m.text
      })).concat([
        {
          role: 'user',
          content: messageToSend
        }
      ]);

      // Call Claude API via backend
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          conversationId,
          messages: claudeMessages,
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

      // Parse response to extract options if Claude included them
      const { text: responseText, options } = parseOptionsFromResponse(data.message);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isBot: true,
        options: options
      };

      setMessages((prev) => [...prev, botMsg]);

      // Update conversation context with extracted info
      // Try to parse user input for personal info
      updateContextFromInput(messageToSend);

      // Update conversation context with bot response info
      setConversationContext(prev => ({
        ...prev,
        lastBotResponse: responseText,
        lastOptions: options,
        lastUpdateTime: new Date().toISOString()
      }));

      // Auto-save if we have minimum data (name + phone)
      if (hasEnoughLeadData()) {
        console.log('[CHAT] User provided info, checking if we can save lead...');
        setTimeout(() => {
          autoSaveLead();
        }, 300);
      } else {
        console.log('[CHAT] Not enough data yet. Current context:', { 
          name: conversationContext.name, 
          phone: conversationContext.phone 
        });
      }

    } catch (error) {
      setIsTyping(false);
      const errorMsg = error instanceof Error ? error.message : 'Failed to get response';
      setApiError(errorMsg);
      
      // Show fallback message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: 'I apologize, there was a connection issue. Please try again or contact our support team.',
          isBot: true,
        }
      ]);
    }
  };

  /**
   * Extract personal info from user input
   */
  const updateContextFromInput = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    // Email pattern
    const emailMatch = input.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    if (emailMatch) {
      setConversationContext(prev => ({
        ...prev,
        email: emailMatch[0]
      }));
    }

    // Phone pattern - more flexible for international formats
    // Matches: 1234567890, +1234567890, +1 234 567 8900, 050-123-4567, etc.
    const phoneMatch = input.match(/(?:\+\d{1,3}[\s.-]?)?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4,})/);
    if (phoneMatch) {
      const cleanPhone = input.match(/[\d\s\-\+\.]/g)?.join('') || phoneMatch[0];
      setConversationContext(prev => {
        console.log('[INPUT] Detected phone:', cleanPhone);
        return { ...prev, phone: cleanPhone };
      });
    }

    // Country detection
    const countries = ['UAE', 'Saudi', 'Egypt', 'India', 'Pakistan', 'UK', 'US', 'Canada', 'Australia'];
    const detectedCountry = countries.find(c => lowerInput.includes(c.toLowerCase()));
    if (detectedCountry) {
      setConversationContext(prev => ({
        ...prev,
        country: detectedCountry
      }));
    }

    // Name detection - capture any text that looks like a name
    if (input.length < 50 && !input.includes('@') && !input.match(/\d{3,}/)) {
      // Simple heuristic: if it's short text with mostly letters, treat as name
      const alphaRatio = (input.match(/[a-zA-Z\s'-]/g) || []).length / input.length;
      if (alphaRatio > 0.7) {
        setConversationContext(prev => {
          const newName = input.trim();
          if (newName && newName.length > 1) {
            console.log('[INPUT] Detected name:', newName);
            return { ...prev, name: newName };
          }
          return prev;
        });
      }
    }
  };

  /**
   * Handle option button clicks
   */
  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  /**
   * Handle file uploads (passport, documents, etc.)
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);

    try {
      // Show file upload message to user
      const fileName = file.name;
      const fileMsg: Message = {
        id: Date.now().toString(),
        text: `📎 Uploading ${fileName}...`,
        isBot: false,
        hasDocument: true,
        documentType: file.type
      };
      setMessages((prev) => [...prev, fileMsg]);

      // Upload file to backend
      await uploadFile(file);

      setUploadingFile(false);
    } catch (error) {
      setUploadingFile(false);
      setApiError('File upload failed. Please try again.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Save lead to backend/Firestore
   */
  const saveLead = async () => {
    try {
      const clientId = user?.uid || demoClientId;
      
      // Extract lead data from conversation
      const leadData = {
        conversationId,
        messages: messages,
        name: conversationContext.name || 'Unknown',
        email: conversationContext.email || '',
        phone: conversationContext.phone || '',
        country: conversationContext.country || '',
        businessType: conversationContext.businessType || '',
        extractedData: conversationContext,
        status: 'new',
        notes: `Lead captured from chat widget. Total messages: ${messages.length}`
      };

      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          leadData
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[LEAD] Saved successfully:', data.leadId);
        return data.leadId;
      } else {
        console.error('[LEAD] Failed to save');
      }
    } catch (error) {
      console.error('[LEAD] Save error:', error);
    }
  };

  /**
   * Handle file upload to backend
   */
  const uploadFile = async (file: File) => {
    try {
      const clientId = user?.uid || demoClientId;
      const reader = new FileReader();

      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        
        // Store image URL for preview
        setUploadedImageUrl(fileData);
        setIsScanning(true);

        // Show image with scanning animation
        const imagePreviewMsg: Message = {
          id: `image_${Date.now()}`,
          text: `📸 Scanning your document...`,
          isBot: true,
          hasDocument: true
        };
        setMessages(prev => [...prev, imagePreviewMsg]);

        const base64Data = fileData.split(',')[1]; // Remove data URL prefix

        // Always send as passport for now - let Claude analyze what's actually in the image
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
            conversationId,
            fileName: file.name,
            fileType: file.type,
            fileData: base64Data,
            documentType: 'passport'
          }),
        });

        setIsScanning(false);

        if (response.ok) {
          const data = await response.json();
          console.log('[UPLOAD] Success:', data);
          
          // Check if Claude extracted any data
          if (data.extractedData && Object.keys(data.extractedData).length > 0) {
            console.log('[UPLOAD] Extracted keys:', Object.keys(data.extractedData));
            console.log('[UPLOAD] Extracted fullName:', data.extractedData.fullName);
            
            // Update context with all extracted data
            setConversationContext(prev => {
              const updated = {
                ...prev,
                ...data.extractedData,
                // Ensure we have a name for display
                name: data.extractedData.fullName || data.extractedData.firstName || prev.name || 'Unknown'
              };
              console.log('[UPLOAD] Updated context:', { 
                fullName: updated.fullName, 
                name: updated.name,
                hasEmail: !!updated.email,
                hasPhone: !!updated.phone
              });
              return updated;
            });

            // Format extracted data for display
            const formattedData = Object.entries(data.extractedData)
              .filter(([_, value]) => value) // Only show non-empty fields
              .map(([key, value]) => {
                // Format camelCase keys to readable format
                const readableKey = key
                  .replace(/([A-Z])/g, ' $1') // Add space before capitals
                  .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
                  .replace(/^Confidence/, 'Confidence Score'); // Special case
                return `${readableKey}: ${value}`;
              })
              .join('\n');

            if (formattedData.trim()) {
              // Update the scanning message with extracted data
              setMessages(prev => [
                ...prev.slice(0, -1), // Remove the scanning message
                {
                  id: `extraction_${Date.now()}`,
                  text: `✓ Perfect! I've successfully extracted the following information from your document:\n\n${formattedData}\n\nPlease review the details. Is everything correct?`,
                  isBot: true,
                  options: ['Yes, looks good!', 'No, let me correct']
                }
              ]);

              // IMMEDIATELY save the extracted lead data - don't wait for user confirmation
              console.log('[PASSPORT] Extracted data ready, auto-saving immediately...');
              setTimeout(() => {
                autoSaveLead('passport_upload');
              }, 500);
            } else {
              // Data was extracted but empty after filtering
              setMessages(prev => [
                ...prev.slice(0, -1),
                {
                  id: `retry_${Date.now()}`,
                  text: `I received your document, but I wasn't able to extract readable information from the image. This might be due to image quality or lighting.\n\nPlease try:\n• Upload a clearer photo with better lighting\n• Ensure the entire document is visible\n• Use good contrast (not blurry or at an angle)`,
                  isBot: true,
                  options: ['Upload another image', 'Fill manually instead']
                }
              ]);
            }
          } else {
            // No data extracted
            setMessages(prev => [
              ...prev.slice(0, -1),
              {
                id: `fallback_${Date.now()}`,
                text: `I've received your document, but I wasn't able to automatically extract the information. This might be because:\n• The image quality is too low\n• The document isn't fully visible\n• The text is unclear or at an angle\n\n**Let's fill in your information manually instead.** To start, what is your full name?`,
                isBot: true,
              }
            ]);
          }
        } else {
          setMessages(prev => [
            ...prev.slice(0, -1),
            {
              id: `error_${Date.now()}`,
              text: `Sorry, there was an issue processing your document. Please try uploading again or fill in your information manually.`,
              isBot: true,
              options: ['Upload another image', 'Fill manually instead']
            }
          ]);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('[UPLOAD] Error:', error);
      setApiError('File upload failed');
      setIsScanning(false);
    }
  };

  /**
   * Reset chat and start new conversation
   */
  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        text: 'Hi! I am Support Assistant from KYLO-AI. I am here to help you with your UAE license application or answer any questions you might have. Would you like to:\n\n1. Learn more about our services?\n2. Apply for a UAE license?\n3. Ask a question?',
        isBot: true,
        options: ['Learn about services', 'Apply for license', 'Ask question']
      }
    ]);
    setInputValue('');
    setConversationContext({});
    setUploadedImageUrl(null);
    setLeadSaved(false);
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
                      {msg.hasDocument && uploadedImageUrl ? (
                        // Image preview with scanning animation
                        <div className="max-w-[85%] p-0 overflow-hidden rounded-2xl border-2 border-gray-200 dark:border-navy-700 shadow-lg relative">
                          <img 
                            src={uploadedImageUrl} 
                            alt="Uploaded document" 
                            className="w-full h-auto max-h-64 object-cover"
                          />
                          {isScanning && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" 
                              style={{
                                animation: 'scan 1.5s infinite'
                              }}>
                              <style>{`
                                @keyframes scan {
                                  0% { transform: translateX(-100%); }
                                  100% { transform: translateX(100%); }
                                }
                              `}</style>
                            </div>
                          )}
                          {isScanning && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-3 border-white/50 border-t-white rounded-full animate-spin"></div>
                                <span className="text-white text-xs font-semibold bg-black/40 px-3 py-1 rounded-full backdrop-blur">Scanning...</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`max-w-[85%] p-3 text-sm shadow-sm whitespace-pre-wrap break-words ${
                            msg.isBot
                              ? 'bg-white dark:bg-navy-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-navy-700'
                              : 'text-white rounded-2xl rounded-tr-sm'
                          }`}
                          style={!msg.isBot ? { backgroundColor: primaryColor } : {}}>
                          {parseMessageText(msg.text)}
                        </div>
                      )}
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
                            <span className="inline">{parseMessageText(option)}</span>
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

              {/* Widget Input - Always show text input for free conversation */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-navy-800 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-100 dark:bg-navy-950 border border-transparent focus:border-gray-200 dark:focus:border-navy-700 rounded-full px-4 py-2.5 text-sm outline-none dark:text-white transition-colors"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isTyping}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isTyping || uploadingFile}
                    className="w-10 h-10 rounded-full text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}
                    title="Upload document">
                    <Upload size={16} />
                  </button>
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="w-10 h-10 rounded-full text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}>
                    <Send size={16} className="ml-0.5" />
                  </button>
                </div>
                {uploadingFile && (
                  <div className="text-xs text-gray-500 text-center">Uploading file...</div>
                )}
              </form>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
