export function backtestStrategy(prices: number[], signals: number[]): { pnl: number, returns: number[], equityCurve: number[] } {
    const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
    const stratReturns = returns.map((r, i) => r * (signals[i] || 0));
    let equity = 0;
    const equityCurve = stratReturns.map(r => (equity += r));
    const pnl = equity;
    return { pnl, returns: stratReturns, equityCurve };
  }
  
  // Placeholder for calling backend backtest
  export async function runBacktest(prices: number[], signals: number[]) {
    const res = await fetch('/api/backtest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prices, signals }),
    });
    return res.json();
  }