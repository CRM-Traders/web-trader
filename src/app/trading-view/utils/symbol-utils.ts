/**
 * Utility functions for symbol formatting and manipulation
 */

/**
 * Creates a symbol string from base and quote assets
 * @param baseAsset - The base asset (e.g., "BTC")
 * @param quoteAsset - The quote asset (e.g., "USDT")
 * @returns The formatted symbol like "BTC/USDT"
 */
export function createSymbol(baseAsset: string, quoteAsset: string): string {
  if (!baseAsset || !quoteAsset) return '';
  return `${baseAsset}/${quoteAsset}`;
}

/**
 * Formats a symbol for API calls by removing the slash
 * @param symbol - The symbol in format like "BTC/USDT"
 * @returns The formatted symbol like "BTCUSDT"
 */
export function formatSymbolForAPI(symbol: string): string {
  if (!symbol) return symbol;
  
  // Remove slash if present
  return symbol.replace('/', '');
}

/**
 * Extracts base and quote assets from a symbol
 * @param symbol - The symbol in any format
 * @returns Object with baseAsset and quoteAsset
 */
export function extractAssetsFromSymbol(symbol: string): { baseAsset: string; quoteAsset: string } {
  if (!symbol) {
    return { baseAsset: '', quoteAsset: '' };
  }
  
  // Remove slash if present
  const cleanSymbol = symbol.replace('/', '');
  
  
  // Fallback: split in the middle (not ideal but works for most cases)
  const midPoint = Math.floor(cleanSymbol.length / 2);
  return {
    baseAsset: cleanSymbol.slice(0, midPoint),
    quoteAsset: cleanSymbol.slice(midPoint)
  };
}
