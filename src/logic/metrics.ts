export function computeSharpe(returns: number[]): number {
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const std = Math.sqrt(returns.map(x => (x - avg) ** 2).reduce((a, b) => a + b, 0) / returns.length);
    return avg / (std + 1e-8);
  }
  
  export function computeMaxDrawdown(equityCurve: number[]): number {
    let max = -Infinity, maxDd = 0;
    for (const v of equityCurve) {
      max = Math.max(max, v);
      maxDd = Math.max(maxDd, max - v);
    }
    return maxDd;
  }