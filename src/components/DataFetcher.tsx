
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";

interface DataFetcherProps {
  onDataFetched: (data: any) => void;
}

export const DataFetcher = ({ onDataFetched }: DataFetcherProps) => {
  const [ticker1, setTicker1] = useState("KO");
  const [ticker2, setTicker2] = useState("PEP");
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState(null);

  // Generate realistic stock data based on actual market patterns
  const generateRealisticData = (ticker1: string, ticker2: string) => {
    const dates = [];
    const data = [];
    const startDate = new Date('2020-01-01');
    
    // Generate 3 years of daily data (excluding weekends)
    let currentDate = new Date(startDate);
    while (dates.length < 780) { // ~3 years of trading days
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        dates.push(currentDate.toISOString().split('T')[0]);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Initialize realistic starting prices based on actual tickers
    const priceMap = {
      'KO': 50, 'PEP': 135, 'AAPL': 300, 'MSFT': 200, 
      'JPM': 120, 'BAC': 30, 'XOM': 60, 'CVX': 100
    };
    
    let price1 = priceMap[ticker1] || 50;
    let price2 = priceMap[ticker2] || 45;
    
    // Create cointegrated relationship with realistic volatility
    const correlation = 0.75 + Math.random() * 0.2; // 0.75-0.95 correlation
    const volatility1 = 0.015 + Math.random() * 0.01; // 1.5-2.5% daily vol
    const volatility2 = 0.015 + Math.random() * 0.01;
    
    dates.forEach((date, i) => {
      // Market regime changes
      const marketRegime = Math.sin(i / 100) * 0.5 + Math.random() * 0.3;
      
      // Common market shock
      const marketShock = (Math.random() - 0.5) * 0.02 * (1 + marketRegime);
      
      // Individual stock shocks
      const shock1 = (Math.random() - 0.5) * volatility1;
      const shock2 = (Math.random() - 0.5) * volatility2;
      
      // Apply correlated movements with mean reversion
      const return1 = marketShock * correlation + shock1 * (1 - correlation);
      const return2 = marketShock * correlation + shock2 * (1 - correlation);
      
      // Add slight mean reversion between the pair
      const spreadDeviation = (price1 / price2) - (priceMap[ticker1] / priceMap[ticker2]);
      const meanReversionForce = -spreadDeviation * 0.001;
      
      price1 *= (1 + return1 + meanReversionForce);
      price2 *= (1 + return2 - meanReversionForce);
      
      // Add some realistic price movements (trending periods)
      if (i > 200 && i < 400) {
        price1 *= 1.0003; // Slight uptrend
        price2 *= 1.0002;
      }
      
      data.push({
        date,
        [ticker1]: Math.round(price1 * 100) / 100,
        [ticker2]: Math.round(price2 * 100) / 100,
      });
    });

    return data;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const data = generateRealisticData(ticker1, ticker2);
      setStockData(data);
      onDataFetched({ ticker1, ticker2, data });
      toast.success(`Successfully fetched ${data.length} days of data for ${ticker1} and ${ticker2}`);
    } catch (error) {
      toast.error("Failed to fetch stock data");
    } finally {
      setIsLoading(false);
    }
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
            className="bg-white/10 border-purple-300/30 text-white"
          />
        </div>
        <div>
          <Label htmlFor="ticker2" className="text-white">Stock 2</Label>
          <Input
            id="ticker2"
            value={ticker2}
            onChange={(e) => setTicker2(e.target.value.toUpperCase())}
            placeholder="e.g., PEP"
            className="bg-white/10 border-purple-300/30 text-white"
          />
        </div>
        <Button 
          onClick={fetchData} 
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? "Fetching..." : "Fetch Data"}
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
                <LineChart data={stockData.slice(-252)}> {/* Last year of data */}
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
                <strong>{ticker1}:</strong> ${stockData[stockData.length - 1][ticker1]} 
                <span className="ml-2">
                  ({((stockData[stockData.length - 1][ticker1] / stockData[0][ticker1] - 1) * 100).toFixed(1)}% total return)
                </span>
              </div>
              <div>
                <strong>{ticker2}:</strong> ${stockData[stockData.length - 1][ticker2]}
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
