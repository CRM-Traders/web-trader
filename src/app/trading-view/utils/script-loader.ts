const TRADINGVIEW_SCRIPT_ID = "tradingview-widget-script";
const TRADINGVIEW_SCRIPT_URL = "https://s3.tradingview.com/tv.js";

let scriptLoadingPromise: Promise<void> | null = null;

export function loadTradingViewScript(): Promise<void> {
  // Return existing promise if script is already loading
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  // Check if script is already loaded
  if (document.getElementById(TRADINGVIEW_SCRIPT_ID)) {
    return Promise.resolve();
  }

  // Create and load script
  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = TRADINGVIEW_SCRIPT_ID;
    script.src = TRADINGVIEW_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      scriptLoadingPromise = null;
      resolve();
    };

    script.onerror = (error) => {
      scriptLoadingPromise = null;
      reject(new Error("Failed to load TradingView script"));
    };

    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

// Utility functions for safe iframe communication
export const iframeUtils = {
  // Safely access iframe contentWindow
  safeAccessContentWindow: (iframe: HTMLIFrameElement | null): Window | null => {
    if (!iframe) {
      console.warn("Iframe element is null");
      return null;
    }

    try {
      // Check if iframe is loaded and accessible
      if (!iframe.contentWindow) {
        console.warn("Iframe contentWindow is not available yet");
        return null;
      }

      // Check if we can access the contentWindow (same-origin policy)
      if (iframe.contentWindow.location.href === "about:blank") {
        console.warn("Iframe is still loading");
        return null;
      }

      return iframe.contentWindow;
    } catch (error) {
      console.warn("Cannot access iframe contentWindow due to cross-origin restrictions:", error);
      return null;
    }
  },

  // Wait for iframe to be ready
  waitForIframeReady: (iframe: HTMLIFrameElement, timeout: number = 10000): Promise<Window> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkIframe = () => {
        const contentWindow = iframeUtils.safeAccessContentWindow(iframe);
        
        if (contentWindow) {
          resolve(contentWindow);
          return;
        }

        // Check if timeout exceeded
        if (Date.now() - startTime > timeout) {
          reject(new Error("Timeout waiting for iframe to be ready"));
          return;
        }

        // Check again in a short delay
        setTimeout(checkIframe, 100);
      };

      checkIframe();
    });
  },

  // Safely send message to iframe
  sendMessageToIframe: (iframe: HTMLIFrameElement, message: any, targetOrigin: string = "*"): boolean => {
    try {
      const contentWindow = iframeUtils.safeAccessContentWindow(iframe);
      if (contentWindow) {
        contentWindow.postMessage(message, targetOrigin);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error sending message to iframe:", error);
      return false;
    }
  },

  // Add message listener for iframe communication
  addMessageListener: (
    handler: (event: MessageEvent) => void,
    allowedOrigins: string[] = ["https://s3.tradingview.com"]
  ): (() => void) => {
    const messageHandler = (event: MessageEvent) => {
      // Verify the message is from allowed origins
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }
      
      try {
        handler(event);
      } catch (error) {
        console.error("Error handling iframe message:", error);
      }
    };

    window.addEventListener("message", messageHandler);
    
    // Return cleanup function
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  },

  // Check if iframe is from TradingView
  isTradingViewIframe: (iframe: HTMLIFrameElement): boolean => {
    try {
      const src = iframe.src || "";
      return src.includes("tradingview.com") || src.includes("s3.tradingview.com");
    } catch (error) {
      return false;
    }
  },

  // Test iframe accessibility (for debugging)
  testIframeAccess: (iframe: HTMLIFrameElement): void => {
    console.log("Testing iframe access...");
    console.log("Iframe src:", iframe.src);
    console.log("Has contentWindow:", !!iframe.contentWindow);
    
    try {
      if (iframe.contentWindow) {
        console.log("ContentWindow location:", iframe.contentWindow.location.href);
        console.log("ContentWindow origin:", iframe.contentWindow.location.origin);
      }
    } catch (error) {
      console.log("Cannot access contentWindow location (cross-origin):", error);
    }
    
    console.log("Is TradingView iframe:", iframeUtils.isTradingViewIframe(iframe));
  }
};
