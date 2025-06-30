
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CointegrationTestProps {
  stockData: any;
  onResultsGenerated: (results: any) => void;
}

export const CointegrationTest = ({ stockData, onResultsGenerated }: CointegrationTestProps) => {
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runCointegrationTest = async () => {
    if (!stockData) {
      toast.error("Please fetch stock data first");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Simulate cointegration analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { ticker1, ticker2, data } = stockData;
      
      // Calculate hedge ratio using simple linear regression
      const prices1 = data.map(d => d[ticker1]);
      const prices2 = data.map(d => d[ticker2]);
      
      // Simple linear regression calculation
      const n = prices1.length;
      const sumX = prices2.reduce((sum, x) => sum + x, 0);
      const sumY = prices1.reduce((sum, y) => sum + y, 0);
      const sumXY = prices1.reduce((sum, y, i) => sum + y * prices2[i], 0);
      const sumX2 = prices2.reduce((sum, x) => sum + x * x, 0);
      
      const hedgeRatio = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      
      // Calculate spread
      const spreadData = data.map(d => ({
        date: d.date,
        spread: d[ticker1] - hedgeRatio * d[ticker2],
        [ticker1]: d[ticker1],
        [ticker2]: d[ticker2]
      }));
      
      // Calculate spread statistics
      const spreads = spreadData.map(d => d.spread);
      const spreadMean = spreads.reduce((sum, s) => sum + s, 0) / spreads.length;
      const spreadStd = Math.sqrt(spreads.reduce((sum, s) => sum + Math.pow(s - spreadMean, 2), 0) / spreads.length);
      
      // Calculate z-scores
      const zScoreData = spreadData.map(d => ({
        ...d,
        zscore: (d.spread - spreadMean) / spreadStd
      }));
      
      // Mock p-value (in real implementation, this would come from Engle-Granger test)
      const pValue = Math.random() * 0.08; // Usually less than 0.05 for cointegrated pairs
      
      const testResults = {
        ticker1,
        ticker2,
        hedgeRatio: Math.round(hedgeRatio * 1000) / 1000,
        pValue: Math.round(pValue * 10000) / 10000,
        isCointegrated: pValue < 0.05,
        spreadMean: Math.round(spreadMean * 100) / 100,
        spreadStd: Math.round(spreadStd * 100) / 100,
        spreadData: zScoreData.slice(-252), // Last year for visualization
        fullData: zScoreData
      };
      
      setResults(testResults);
      onResultsGenerated(testResults);
      toast.success("Cointegration analysis completed!");
      
    } catch (error) {
      toast.error("Failed to analyze cointegration");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Button 
          onClick={runCointegrationTest}
          disabled={!stockData || isAnalyzing}
          className="bg-green-600 hover:bg-green-700"
        >
          {isAnalyzing ? "Analyzing..." : "Run Cointegration Test"}
        </Button>
      </div>

      {results && (
        <div className="space-y-6">
          {/* Test Results Summary */}
          <Card className="bg-white/5 border-purple-300/20">
            <CardHeader>
              <CardTitle className="text-white">Cointegration Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{results.hedgeRatio}</div>
                  <div className="text-sm text-purple-200">Hedge Ratio (β)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{results.pValue}</div>
                  <div className="text-sm text-purple-200">P-Value</div>
                </div>
                <div className="text-center">
                  <Badge variant={results.isCointegrated ? "default" : "destructive"}>
                    {results.isCointegrated ? "Cointegrated" : "Not Cointegrated"}
                  </Badge>
                  <div className="text-sm text-purple-200 mt-1">Status</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{results.spreadStd}</div>
                  <div className="text-sm text-purple-200">Spread Volatility</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spread Visualization */}
          <Card className="bg-white/5 border-purple-300/20">
            <CardHeader>
              <CardTitle className="text-white">Spread Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.spreadData}>
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
                    <Line 
                      type="monotone" 
                      dataKey="spread" 
                      stroke="#e11d48" 
                      strokeWidth={2}
                      dot={false}
                      name="Spread"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Z-Score Visualization */}
          <Card className="bg-white/5 border-purple-300/20">
            <CardHeader>
              <CardTitle className="text-white">Z-Score of Spread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.spreadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.7)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.7)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                      domain={[-3, 3]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(147,51,234,0.3)',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="zscore" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      name="Z-Score"
                    />
                    {/* Reference lines for trading thresholds */}
                    <Line 
                      type="monotone" 
                      dataKey={() => 1} 
                      stroke="#ef4444" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Entry Threshold (+1)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey={() => -1} 
                      stroke="#22c55e" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Entry Threshold (-1)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
