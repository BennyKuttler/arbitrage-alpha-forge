
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import { LoadingSpinner } from "./LoadingSpinner";

interface DataFetcherProps {
  onDataFetched: (data: any) => void;
}

export const DataFetcher = ({ onDataFetched }: DataFetcherProps) => {
  const [ticker1, setTicker1] = useState("KO");
  const [ticker2, setTicker2] = useState("PEP");
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Use the direct Yahoo Finance API since we can't use the backend in Lovable
      const [response1, response2] = await Promise.all([
        fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker1}?range=3y&interval=1d`),
        fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker2}?range=3y&interval=1d`)
      ]);

      if (!response1.ok || !response2.ok) {
        throw new Error('Failed to fetch data from Yahoo Finance API');
      }

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Parse Yahoo Finance response structure
      const result1 = data1.chart?.result?.[0];
      const result2 = data2.chart?.result?.[0];

      if (!result1 || !result2) {
        throw new Error('Invalid ticker or data unavailable');
      }

      const timestamps1 = result1.timestamp;
      const prices1 = result1.indicators.quote[0].close;
      const timestamps2 = result2.timestamp;
      const prices2 = result2.indicators.quote[0].close;

      // Convert to date-price format
      const data1Formatted = timestamps1.map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString().slice(0, 10),
        price: prices1[i],
      }));

      const data2Formatted = timestamps2.map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString().slice(0, 10),
        price: prices2[i],
      }));

      // Merge by date
      const merged = [];
      const map2 = Object.fromEntries(data2Formatted.map(d => [d.date, d.price]));
      
      for (const d1 of data1Formatted) {
        if (map2[d1.date] !== undefined && d1.price !== null && map2[d1.date] !== null) {
          merged.push({
            date: d1.date,
            [ticker1]: d1.price,
            [ticker2]: map2[d1.date],
          });
        }
      }

      if (merged.length === 0) {
        throw new Error('No overlapping data found for the selected tickers');
      }

      setStockData(merged);
      onDataFetched({ ticker1, ticker2, data: merged });
      toast.success(`Successfully fetched ${merged.length} days of data for ${ticker1} and ${ticker2}`);
    } catch (error: any) {
      console.error('Data fetch error:', error);
      
      // If CORS error, provide helpful message
      if (error.message.includes('CORS') || error.name === 'TypeError') {
        toast.error("CORS error: Direct API access blocked by browser. Using demo data instead.");
        
        // Provide demo data as fallback
        const demoData = generateDemoData(ticker1, ticker2);
        setStockData(demoData);
        onDataFetched({ ticker1, ticker2, data: demoData });
        return;
      }
      
      toast.error("Failed to fetch stock data: " + (error.message || error));
    } finally {
      setIsLoading(false);
    }
  };

  // Generate realistic demo data as fallback
  const generateDemoData = (symbol1: string, symbol2: string) => {
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 3);
    
    const data = [];
    let price1 = 50 + Math.random() * 50; // Starting price for symbol1
    let price2 = 60 + Math.random() * 40; // Starting price for symbol2
    
    for (let i = 0; i < 750; i++) { // ~3 years of trading days
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Add some correlation and random walk
      const change1 = (Math.random() - 0.5) * 2;
      const change2 = change1 * 0.7 + (Math.random() - 0.5) * 1.5; // Somewhat correlated
      
      price1 += change1;
      price2 += change2;
      
      // Ensure prices stay positive
      price1 = Math.max(price1, 5);
      price2 = Math.max(price2, 5);
      
      data.push({
        date: date.toISOString().slice(0, 10),
        [symbol1]: Math.round(price1 * 100) / 100,
        [symbol2]: Math.round(price2 * 100) / 100,
      });
    }
    
    return data;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <Label htmlFor="ticker1" className="text-white">Stock 1</Label>
          <Input
            id="ticker1"
            value={ticker1}
            onChange={(e) => setTicker1(e.target.value.toUpperCase())}
            placeholder="e.g., KO"
            className="bg-white/10 border-purple-300/30 text-white placeholder:text-purple-200"
          />
        </div>
        <div>
          <Label htmlFor="ticker2" className="text-white">Stock 2</Label>
          <Input
            id="ticker2"
            value={ticker2}
            onChange={(e) => setTicker2(e.target.value.toUpperCase())}
            placeholder="e.g., PEP"
            className="bg-white/10 border-purple-300/30 text-white placeholder:text-purple-200"
          />
        </div>
        <Button 
          onClick={fetchData} 
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Fetching...
            </>
          ) : (
            "Fetch Data"
          )}
        </Button>
      </div>

      {stockData && (
        <Card className="bg-white/5 border-purple-300/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Price Series Comparison ({stockData.length} trading days)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockData.slice(-252)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.7)"
                    tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.7)"
                    tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(147,51,234,0.3)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey={ticker1} 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={ticker2} 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-purple-200">
              <div>
                <strong>{ticker1}:</strong> ${stockData[stockData.length - 1][ticker1].toFixed(2)} 
                <span className="ml-2">
                  ({((stockData[stockData.length - 1][ticker1] / stockData[0][ticker1] - 1) * 100).toFixed(1)}% total return)
                </span>
              </div>
              <div>
                <strong>{ticker2}:</strong> ${stockData[stockData.length - 1][ticker2].toFixed(2)}
                <span className="ml-2">
                  ({((stockData[stockData.length - 1][ticker2] / stockData[0][ticker2] - 1) * 100).toFixed(1)}% total return)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
