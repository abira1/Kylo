# KYLO Chat Widget - Implementation Guide

## Overview

The KYLO Chat Widget is a production-ready embed script that allows websites to integrate our AI chat assistant. The widget is:

- **Non-blocking**: Loads asynchronously, won't affect site performance
- **Isolated**: Runs in a secure iframe, won't conflict with host page CSS/JS
- **Customizable**: Supports branding, positioning, and custom styling
- **Secure**: Uses public keys instead of internal IDs, supports CORS
- **Responsive**: Works on mobile, tablet, and desktop devices

## Quick Start

### 1. Get Your Public Key

Log in to your KYLO dashboard and go to **Embed Setup** → **Installation Code**. Your public key looks like:
```
pk_live_IOS6KZgooLjVTZfbwl4v
```

### 2. Add Widget to Your Website

Paste this code snippet **before the closing `</body>` tag** on your website:

```html
<script>
  window.KYLO_CONFIG = {
    publicKey: 'pk_live_YOUR_KEY_HERE',
    position: 'bottom-right'  // bottom-right, bottom-left, top-right, top-left
  };
</script>
<script src="https://kylo-production.up.railway.app/widget.js" async></script>
```

That's it! The widget will appear as a floating button in the specified corner.

### 3. Optional: Control the Widget Programmatically

```javascript
// Open the chat
window.KYLO.open();

// Close the chat
window.KYLO.close();

// Toggle open/close
window.KYLO.toggle();

// Get current config
window.KYLO.getConfig();
```

---

## Configuration Options

```javascript
window.KYLO_CONFIG = {
  // REQUIRED: Your public widget key
  publicKey: 'pk_live_...',

  // OPTIONAL: Widget position (default: 'bottom-right')
  // Valid values: 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  position: 'bottom-right',

  // OPTIONAL: API base URL (default: 'https://kylo-production.up.railway.app')
  // Use this if you're self-hosting or using a custom domain
  apiBase: 'https://kylo-production.up.railway.app',

  // OPTIONAL: Chat origin (default: 'https://kylo-support.web.app')
  // The domain where the chat UI is hosted
  chatOrigin: 'https://kylo-support.web.app',

  // OPTIONAL: Debug mode (default: true)
  // Logs detailed information to browser console
  debug: true
};
```

---

## Implementation Examples

### HTML Integration (Simple Websites)

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <!-- Your website content -->
    <h1>Welcome to My Website</h1>
    <p>Lorem ipsum dolor sit amet...</p>

    <!-- Add KYLO widget -->
    <script>
      window.KYLO_CONFIG = {
        publicKey: 'pk_live_YOUR_KEY_HERE',
        position: 'bottom-right'
      };
    </script>
    <script src="https://kylo-production.up.railway.app/widget.js" async></script>
</body>
</html>
```

### React Integration

```jsx
// App.jsx
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Configure KYLO widget
    window.KYLO_CONFIG = {
      publicKey: 'pk_live_YOUR_KEY_HERE',
      position: 'bottom-right'
    };

    // Load widget script
    const script = document.createElement('script');
    script.src = 'https://kylo-production.up.railway.app/widget.js';
    script.async = true;
    document.body.appendChild(script);

    // Optional: Listen for widget ready event
    const handleReady = (e) => {
      console.log('Widget ready:', e.detail.branding);
    };
    window.addEventListener('kylo-widget-ready', handleReady);

    return () => {
      window.removeEventListener('kylo-widget-ready', handleReady);
    };
  }, []);

  return <div>Your app content</div>;
}
```

### React Component (Reusable)

```jsx
// useKyloWidget.js
import { useEffect } from 'react';

export function useKyloWidget(publicKey, position = 'bottom-right') {
  useEffect(() => {
    if (!publicKey) return;

    window.KYLO_CONFIG = {
      publicKey,
      position
    };

    const script = document.createElement('script');
    script.src = 'https://kylo-production.up.railway.app/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (window.KYLO) {
        window.KYLO.close();
      }
    };
  }, [publicKey, position]);

  return window.KYLO;
}

// Usage:
// const kylo = useKyloWidget('pk_live_YOUR_KEY_HERE');
// kylo?.open();
```

### Next.js Integration

```jsx
// app/layout.jsx
'use client';

import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    window.KYLO_CONFIG = {
      publicKey: process.env.NEXT_PUBLIC_KYLO_KEY,
      position: 'bottom-right'
    };

    const script = document.createElement('script');
    script.src = 'https://kylo-production.up.railway.app/widget.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Vue.js Integration

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <!-- Your content -->
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  window.KYLO_CONFIG = {
    publicKey: import.meta.env.VITE_KYLO_PUBLIC_KEY,
    position: 'bottom-right'
  };

  const script = document.createElement('script');
  script.src = 'https://kylo-production.up.railway.app/widget.js';
  script.async = true;
  document.body.appendChild(script);
});
</script>
```

---

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## Styling & Customization

### Default Styles

The widget appears as a **60×60px floating button** with:
- Primary color: #6366f1 (indigo)
- Shadow: `0 4px 12px rgba(0, 0, 0, 0.15)`
- Border radius: 50% (perfect circle)

### Custom Styling

You can customize the widget appearance by injecting CSS before loading the widget:

```html
<style>
  #kylo-widget-container .kylo-launcher {
    width: 70px;
    height: 70px;
    background-color: #ff6b6b; /* Custom color */
    font-size: 28px;
  }

  #kylo-chat-frame {
    width: 400px;
    height: 650px;
    border-radius: 16px;
  }
</style>

<script>
  window.KYLO_CONFIG = { publicKey: 'pk_live_...' };
</script>
<script src="https://kylo-production.up.railway.app/widget.js" async></script>
```

---

## Events & API

### Listen for Widget Ready

```javascript
window.addEventListener('kylo-widget-ready', (event) => {
  console.log('Widget initialized with config:', event.detail);
  // event.detail = { publicKey, branding }
});
```

### Control Widget Programmatically

```javascript
// Check if widget is ready
if (window.KYLO) {
  // Open widget
  window.KYLO.open();
  
  // Close widget
  window.KYLO.close();
  
  // Toggle widget
  window.KYLO.toggle();
  
  // Get current configuration
  const config = window.KYLO.getConfig();
  console.log(config);
  // Returns: { publicKey, branding, position }
}
```

---

## Security & Privacy

### Public Keys

- Public keys start with `pk_live_` and are safe to share
- They're used only to fetch public branding information
- Your internal client ID is never exposed

### CORS

- Widget handles CORS properly through server-side configuration
- No sensitive data is transmitted to client-side fetch requests
- All API calls go through our secure backend

### Iframe Sandbox

- Chat runs in a sandboxed iframe
- CSS from your website cannot affect the widget
- JavaScript from your website cannot access chat messages

---

## Troubleshooting

### Widget not appearing?

1. Check browser console (F12) for errors
2. Verify your public key is correct
3. Ensure `KYLO_CONFIG` is set **before** loading widget.js
4. Check your internet connection

### "Failed to fetch branding"?

1. Verify public key format (should start with `pk_live_`)
2. Check network tab in DevTools for API calls
3. Ensure no browser extensions are blocking requests
4. Try accessing from a different network

### Chat not responding?

1. Open browser console for error messages
2. Check that your backend is online
3. Verify your public key is still valid

### Performance issues?

1. Widget loads asynchronously by default (non-blocking)
2. If slow, check your internet connection
3. Verify Railway backend is responding: `https://kylo-production.up.railway.app/api/health`

---

## API Endpoints Used by Widget

| Endpoint | Purpose | CORS |
|----------|---------|------|
| `GET /api/branding/{publicKey}` | Fetch branding config | ✅ Allowed |
| `POST /api/chat` | Send messages | ✅ Allowed |
| `GET /embed` | Load chat iframe | ✅ Allowed |

---

## Migration from Old Widget

If you're updating from our old widget:

**Old code:**
```html
<iframe src="https://kylo.ae/chat?botId=xxxxx"></iframe>
```

**New code:**
```html
<script>
  window.KYLO_CONFIG = { publicKey: 'pk_live_xxxxx' };
</script>
<script src="https://kylo-production.up.railway.app/widget.js" async></script>
```

---

## Support

- 📧 Email: support@kylo.ae
- 💬 Chat: Use the widget on kylo-support.web.app
- 📚 Docs: https://kylo.ae/docs

---

## Version History

### v1.0 (Current)
- ✅ Widget.js launch
- ✅ Iframe-based chat
- ✅ Branding customization
- ✅ Public key infrastructure
- ✅ Multi-position support
- ✅ Mobile responsive

---

## Example: Complete HTML Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website with KYLO Chat</title>
</head>
<body>
    <header>
        <h1>Welcome to My Website</h1>
    </header>

    <main>
        <section>
            <h2>About Us</h2>
            <p>We help businesses with AI-powered solutions...</p>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 My Company</p>
    </footer>

    <!-- KYLO Chat Widget -->
    <script>
      window.KYLO_CONFIG = {
        publicKey: 'pk_live_YOUR_PUBLIC_KEY_HERE',
        position: 'bottom-right'
      };
    </script>
    <script src="https://kylo-production.up.railway.app/widget.js" async></script>
</body>
</html>
```

Ready to integrate? Start with the Quick Start section above! 🚀
