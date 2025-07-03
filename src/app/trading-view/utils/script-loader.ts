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
