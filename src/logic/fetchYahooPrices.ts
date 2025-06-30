export async function fetchYahooPrices(symbol: string, range = '3y', interval = '1d') {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    const res = await fetch(url);
  
    if (!res.ok) {
      throw new Error(`Network error: ${res.status} ${res.statusText}`);
    }
  
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(
        `Server returned non-JSON response. First 100 chars: ${text.slice(0, 100)}`
      );
    }
  
    const data = await res.json();
    if (!data.chart?.result?.[0]) throw new Error("Invalid ticker or data unavailable");
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const prices = result.indicators.quote[0].close;
    return timestamps.map((t: number, i: number) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      price: prices[i],
    }));
  }