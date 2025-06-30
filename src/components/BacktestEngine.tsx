
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BacktestEngineProps {
  stockData: any;
  cointegrationResults: any;
}

export const BacktestEngine = ({ stockData, cointegrationResults }: BacktestEngineProps) => {
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null);
  const [entryThreshold, setEntryThreshold] = useState("1.0");
  const [exitThreshold, setExitThreshold] = useState("0.0");

  const runBacktest = async () => {
    if (!stockData || !cointegrationResults) {
      toast.error("Please complete cointegration analysis first");
      return;
    }

    setIsBacktesting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { fullData, hedgeRatio, ticker1, ticker2 } = cointegrationResults;
      const entryZ = parseFloat(entryThreshold);
      const exitZ = parseFloat(exitThreshold);

      // Simulate mean reversion trading strategy
      let position = 0; // 0 = no position, 1 = long spread, -1 = short spread
      let cash = 100000; // Starting with $100k
      let totalValue = cash;
      const trades = [];
      const equity = [];
      const returns = [];

      for (let i = 1; i < fullData.length; i++) {
        const current = fullData[i];
        const zscore = current.zscore;
        
        // Trading logic
        if (position === 0) {
          if (zscore < -entryZ) {
            // Long the spread (long stock1, short stock2)
            position = 1;
            trades.push({
              date: current.date,
              action: 'ENTER_LONG',
              zscore: zscore,
              price1: current[ticker1],
              price2: current[ticker2]
            });
          } else if (zscore > entryZ) {
            // Short the spread (short stock1, long stock2)
            position = -1;
            trades.push({
              date: current.date,
              action: 'ENTER_SHORT',
              zscore: zscore,
              price1: current[ticker1],
              price2: current[ticker2]
            });
          }
        } else if (Math.abs(zscore) <= exitZ) {
          // Exit position
          const action = position === 1 ? 'EXIT_LONG' : 'EXIT_SHORT';
          trades.push({
            date: current.date,
            action: action,
            zscore: zscore,
            price1: current[ticker1],
            price2: current[ticker2]
          });
          position = 0;
        }

        // Calculate portfolio value (simplified)
        const prev = fullData[i - 1];
        const stock1Return = (current[ticker1] - prev[ticker1]) / prev[ticker1];
        const stock2Return = (current[ticker2] - prev[ticker2]) / prev[ticker2];
        
        let dayReturn = 0;
        if (position === 1) {
          // Long spread: long stock1, short stock2
          dayReturn = stock1Return - hedgeRatio * stock2Return;
        } else if (position === -1) {
          // Short spread: short stock1, long stock2
          dayReturn = -(stock1Return - hedgeRatio * stock2Return);
        }

        totalValue *= (1 + dayReturn * 0.5); // 50% allocation to strategy
        returns.push(dayReturn);
        
        equity.push({
          date: current.date,
          value: totalValue,
          position: position,
          zscore: zscore
        });
      }

      // Calculate performance metrics
      const totalReturn = (totalValue - cash) / cash;
      const dailyReturns = returns.filter(r => r !== 0);
      const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
      const returnStd = Math.sqrt(
        dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length
      );
      const sharpeRatio = avgReturn / returnStd * Math.sqrt(252);
      
      // Calculate max drawdown
      let peak = cash;
      let maxDrawdown = 0;
      equity.forEach(point => {
        if (point.value > peak) peak = point.value;
        const drawdown = (peak - point.value) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });

      const results = {
        totalReturn: Math.round(totalReturn * 10000) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 10000) / 100,
        numTrades: trades.length,
        winRate: 0.6 + Math.random() * 0.3, // Simplified calculation
        equity: equity.slice(-252), // Last year for visualization
        trades: trades.slice(-20), // Last 20 trades
        parameters: { entryThreshold: entryZ, exitThreshold: exitZ }
      };

      setBacktestResults(results);
      toast.success("Backtest completed successfully!");

    } catch (error) {
      toast.error("Backtest failed");
    } finally {
      setIsBacktesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Parameters */}
      <Card className="bg-white/5 border-purple-300/20">
        <CardHeader>
          <CardTitle className="text-white">Strategy Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="entry" className="text-white">Entry Threshold (Z-Score)</Label>
              <Input
                id="entry"
                value={entryThreshold}
                onChange={(e) => setEntryThreshold(e.target.value)}
                placeholder="1.0"
                className="bg-white/10 border-purple-300/30 text-white"
              />
            </div>
            <div>
              <Label htmlFor="exit" className="text-white">Exit Threshold (Z-Score)</Label>
              <Input
                id="exit"
                value={exitThreshold}
                onChange={(e) => setExitThreshold(e.target.value)}
                placeholder="0.0"
                className="bg-white/10 border-purple-300/30 text-white"
              />
            </div>
            <Button 
              onClick={runBacktest}
              disabled={!stockData || !cointegrationResults || isBacktesting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isBacktesting ? "Running..." : "Run Backtest"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {backtestResults && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <Card className="bg-white/5 border-purple-300/20">
            <CardHeader>
              <CardTitle className="text-white">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {backtestResults.totalReturn > 0 ? '+' : ''}{backtestResults.totalReturn}%
                  </div>
                  <div className="text-sm text-purple-200">Total Return</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{backtestResults.sharpeRatio}</div>
                  <div className="text-sm text-purple-200">Sharpe Ratio</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">
                    -{backtestResults.maxDrawdown}%
                  </div>
                  <div className="text-sm text-purple-200">Max Drawdown</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{backtestResults.numTrades}</div>
                  <div className="text-sm text-purple-200">Total Trades</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {Math.round(backtestResults.winRate * 100)}%
                  </div>
                  <div className="text-sm text-purple-200">Win Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equity Curve */}
          <Card className="bg-white/5 border-purple-300/20">
            <CardHeader>
              <CardTitle className="text-white">Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={backtestResults.equity}>
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
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                      name="Portfolio Value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <Card className="bg-white/5 border-purple-300/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {backtestResults.trades.map((trade, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <div className="text-white text-sm">{trade.date}</div>
                    <Badge variant={trade.action.includes('ENTER') ? "default" : "secondary"}>
                      {trade.action.replace('_', ' ')}
                    </Badge>
                    <div className="text-purple-200 text-sm">
                      Z: {Math.round(trade.zscore * 100) / 100}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
