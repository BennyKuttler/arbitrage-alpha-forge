export async function fetchYahooPrices(symbol: string, range = '3y', interval = '1d') {
    const url = `/api/yahoo-prices?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`;
    const res = await fetch(url);
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
