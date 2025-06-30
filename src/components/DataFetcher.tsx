
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

  // Mock data generator for demo purposes
  const generateMockData = (ticker1: string, ticker2: string) => {
    const dates = [];
    const data = [];
    const startDate = new Date('2020-01-01');
    
    // Generate 3 years of daily data
    for (let i = 0; i < 1095; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Generate correlated stock prices with some noise
    let price1 = 50;
    let price2 = 45;
    const correlation = 0.8; // High correlation for demonstration
    
    dates.forEach((date, i) => {
      const shock = (Math.random() - 0.5) * 0.02; // Random daily return
      const commonShock = (Math.random() - 0.5) * 0.015;
      
      // Apply correlated movements
      price1 *= (1 + commonShock * correlation + shock * (1 - correlation));
      price2 *= (1 + commonShock * correlation + shock * 0.8 * (1 - correlation));
      
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
      
      const data = generateMockData(ticker1, ticker2);
      setStockData(data);
      onDataFetched({ ticker1, ticker2, data });
      toast.success(`Successfully fetched data for ${ticker1} and ${ticker2}`);
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
            <h3 className="text-lg font-semibold text-white mb-4">Price Series Comparison</h3>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};
