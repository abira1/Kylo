/**
 * KYLO AI Chat Widget
 * Production-ready embed script for client websites
 * 
 * Usage:
 *   window.KYLO_CONFIG = { publicKey: "pk_live_..." };
 *   <script src="https://kylo-production.up.railway.app/widget.js" async></script>
 * 
 * This script will:
 * - Load asynchronously (non-blocking)
 * - Fetch branding from the KYLO backend
 * - Create an isolated iframe for the chat
 * - Inject a floating launcher button
 * - Handle CORS and security properly
 */

(function() {
  'use strict';

  // Configuration from window.KYLO_CONFIG (set by client)
  const config = window.KYLO_CONFIG || {};
  const publicKey = config.publicKey;
  const position = config.position || 'bottom-right';
  const apiBase = config.apiBase || 'https://kylo-production.up.railway.app';
  const chatOrigin = config.chatOrigin || 'https://kylo-support.web.app';

  // Logging utility (debug mode controlled by config)
  const debug = config.debug !== false; // enabled by default
  const log = (...args) => {
    if (debug) {
      console.log('[KYLO Widget]', ...args);
    }
  };

  const error = (...args) => {
    console.error('[KYLO Widget Error]', ...args);
  };

  // Validation
  if (!publicKey) {
    error('Missing KYLO_CONFIG.publicKey. Widget not initialized.');
    return;
  }

  if (!/^pk_live_/.test(publicKey)) {
    error('Invalid public key format. Expected pk_live_...');
    return;
  }

  log(`Initializing with public key: ${publicKey}`);

  // State
  let isOpen = false;
  let branding = null;
  let iframe = null;
  let launcher = null;
  let container = null;

  /**
   * Fetch branding configuration from backend
   */
  async function fetchBranding() {
    try {
      log(`Fetching branding from: ${apiBase}/api/branding/${publicKey}`);
      const response = await fetch(`${apiBase}/api/branding/${publicKey}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      log('Branding fetched successfully:', data);
      return data;
    } catch (err) {
      error('Failed to fetch branding:', err.message);
      // Return default branding if fetch fails
      return {
        agentName: 'KYLO Assistant',
        primaryColor: '#6366f1',
        logoURL: '',
        position: position
      };
    }
  }

  /**
   * Create and inject stylesheet for widget
   */
  function injectStyles() {
    const styleId = 'kylo-widget-styles';
    if (document.getElementById(styleId)) return;

    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      #kylo-widget-container {
        position: fixed;
        ${position.includes('bottom') ? 'bottom: 20px' : 'top: 20px'};
        ${position.includes('right') ? 'right: 20px' : 'left: 20px'};
        width: 60px;
        height: 60px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      .kylo-launcher {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: var(--kylo-primary, #6366f1);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        font-size: 24px;
      }

      .kylo-launcher:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      .kylo-launcher:active {
        transform: scale(0.95);
      }

      .kylo-launcher.open {
        opacity: 0;
        pointer-events: none;
      }

      #kylo-chat-frame {
        position: fixed;
        ${position.includes('bottom') ? 'bottom: 80px' : 'top: 80px'};
        ${position.includes('right') ? 'right: 20px' : 'left: 20px'};
        width: 380px;
        height: 600px;
        max-height: 80vh;
        border: none;
        border-radius: 12px;
        box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
        z-index: 999998;
        opacity: 0;
        transform: scale(0.9) translateY(20px);
        transition: all 0.3s ease;
        pointer-events: none;
      }

      #kylo-chat-frame.open {
        opacity: 1;
        transform: scale(1) translateY(0);
        pointer-events: all;
      }

      /* Mobile responsive */
      @media (max-width: 480px) {
        #kylo-chat-frame {
          width: calc(100vw - 20px);
          height: calc(100vh - 100px);
          ${position.includes('bottom') ? 'bottom: 10px' : 'top: 10px'};
          ${position.includes('right') ? 'right: 10px' : 'left: 10px'};
        }
      }

      /* Prevent body scroll when widget open on mobile */
      body.kylo-no-scroll {
        overflow: hidden;
      }
    `;
    document.head.appendChild(styles);
    log('Styles injected');
  }

  /**
   * Create launcher button
   */
  function createLauncher() {
    const button = document.createElement('button');
    button.className = 'kylo-launcher';
    button.setAttribute('aria-label', 'Open chat');
    button.setAttribute('title', branding?.agentName || 'Chat with us');
    button.innerHTML = '💬';
    button.style.setProperty('--kylo-primary', branding?.primaryColor || '#6366f1');

    button.addEventListener('click', toggleWidget);
    return button;
  }

  /**
   * Create iframe for chat
   */
  function createIframe() {
    const frame = document.createElement('iframe');
    frame.id = 'kylo-chat-frame';
    frame.setAttribute('allow', 'microphone; camera');
    frame.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-presentation');
    frame.src = `${apiBase}/embed.html?publicKey=${encodeURIComponent(publicKey)}&agent=${encodeURIComponent(branding?.agentName || 'KYLO')}`;
    return frame;
  }

  /**
   * Initialize widget
   */
  async function init() {
    try {
      log('Fetching branding...');
      branding = await fetchBranding();

      log('Injecting styles...');
      injectStyles();

      log('Creating DOM elements...');
      container = document.createElement('div');
      container.id = 'kylo-widget-container';

      launcher = createLauncher();
      container.appendChild(launcher);

      iframe = createIframe();
      container.appendChild(iframe);

      document.body.appendChild(container);

      log('Widget initialized successfully');

      // Emit custom event for integrations to detect
      window.dispatchEvent(new CustomEvent('kylo-widget-ready', {
        detail: { publicKey, branding }
      }));
    } catch (err) {
      error('Failed to initialize widget:', err);
    }
  }

  /**
   * Toggle widget open/close
   */
  function toggleWidget() {
    isOpen = !isOpen;

    if (launcher) {
      launcher.classList.toggle('open', isOpen);
    }

    if (iframe) {
      iframe.classList.toggle('open', isOpen);
    }

    // Prevent body scroll on mobile when open
    if (isOpen && window.innerWidth <= 480) {
      document.body.classList.add('kylo-no-scroll');
    } else {
      document.body.classList.remove('kylo-no-scroll');
    }

    log(`Widget ${isOpen ? 'opened' : 'closed'}`);
  }

  /**
   * Close widget when message received from iframe
   */
  window.addEventListener('message', (event) => {
    if (event.origin !== chatOrigin) return;

    const { type } = event.data;

    if (type === 'kylo:close') {
      if (isOpen) toggleWidget();
    }

    if (type === 'kylo:ready') {
      log('Chat iframe ready');
    }
  });

  /**
   * Handle mobile back button
   */
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) {
      toggleWidget();
    }
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for client control
  window.KYLO = {
    open: () => !isOpen && toggleWidget(),
    close: () => isOpen && toggleWidget(),
    toggle: toggleWidget,
    getConfig: () => ({ publicKey, branding, position })
  };

  log('API exposed at window.KYLO');
})();
