// src/logic/fetchPrices.ts
export async function fetchYahooPrices(symbol: string, range = '1mo', interval = '1d') {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    const res = await fetch(url);
    const data = await res.json();
    // Parse prices from Yahoo response structure:
    return data.chart.result[0].indicators.quote[0].close; // Array of prices
  }