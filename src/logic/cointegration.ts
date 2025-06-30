export function computeZScore(series: number[]): number[] {
    const mean = series.reduce((a, b) => a + b, 0) / series.length;
    const std = Math.sqrt(series.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / series.length);
    return series.map(x => (x - mean) / (std + 1e-8));
  }
  
  // Placeholder for calling backend cointegration
  export async function runCointegrationTest(seriesX: number[], seriesY: number[]) {
    const res = await fetch('/api/cointegration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ series_x: seriesX, series_y: seriesY }),
    });
    return res.json();
  }