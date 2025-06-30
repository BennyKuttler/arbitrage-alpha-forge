
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toast } from "sonner";
import { LoadingSpinner } from "./LoadingSpinner";

interface BacktestEngineProps {
  stockData: any;
  cointegrationResults: any;
}

export const BacktestEngine = ({ stockData, cointegrationResults }: BacktestEngineProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null);
  const [entryThreshold, setEntryThreshold] = useState([1.5]);
  const [exitThreshold, setExitThreshold] = useState([0.2]);
  const [positionSize, setPositionSize] = useState([10000]);

  const runBacktest = async () => {
    if (!cointegrationResults?.dataWithSpread) {
      toast.error("Please run cointegration test first");
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const { ticker1, ticker2, hedgeRatio, dataWithSpread } = cointegrationResults;
      const entryZ = entryThreshold[0];
      const exitZ = exitThreshold[0];
      const position_size = positionSize[0];
      
      let position = 0; // 1 = long spread, -1 = short spread
      let cash = 100000;
      let totalValue = cash;
      const trades = [];
      const equityCurve = [];
      let tradeCount = 0;
      let winningTrades = 0;
      
      dataWithSpread.forEach((day, i) => {
        if (i < 30) return; // Skip initial period for rolling calculations
        
        const { date, zscore } = day;
        const price1 = day[ticker1];
        const price2 = day[ticker2];
        let action = null;
        
        // Entry logic
        if (position === 0) {
          if (zscore < -entryZ) {
            // Long spread: buy stock1, sell stock2
            position = 1;
            action = `LONG ${ticker1}, SHORT ${ticker2}`;
            tradeCount++;
          } else if (zscore > entryZ) {
            // Short spread: sell stock1, buy stock2  
            position = -1;
            action = `SHORT ${ticker1}, LONG ${ticker2}`;
            tradeCount++;
          }
        }
        // Exit logic
        else if (Math.abs(zscore) < exitZ) {
          const pnl = position * zscore * position_size * 0.01; // Simplified P&L calculation
          cash += pnl;
          if (pnl > 0) winningTrades++;
          
          trades.push({
            date,
            action: `CLOSE (P&L: $${pnl.toFixed(0)})`,
            pnl,
            position: position,
            zscore
          });
          
          position = 0;
          action = `CLOSE POSITION`;
        }
        
        // Calculate portfolio value (simplified)
        totalValue = cash + Math.abs(position) * position_size;
        
        equityCurve.push({
          date,
          value: totalValue,
          zscore,
          position,
          drawdown: (totalValue / 100000 - 1) * 100
        });
        
        if (action) {
          trades.push({
            date,
            action,
            zscore: Math.round(zscore * 1000) / 1000,
            price1: price1,
            price2: price2
          });
        }
      });
      
      // Calculate performance metrics
      const returns = equityCurve.map((d, i) => 
        i === 0 ? 0 : (d.value / equityCurve[i-1].value - 1) * 100
      ).slice(1);
      
      const totalReturn = (totalValue / 100000 - 1) * 100;
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
      const sharpeRatio = volatility > 0 ? (avgReturn / volatility) * Math.sqrt(252) : 0;
      const maxDrawdown = Math.min(...equityCurve.map(d => d.drawdown));
      const winRate = tradeCount > 0 ? (winningTrades / tradeCount) * 100 : 0;
      
      const results = {
        totalReturn: Math.round(totalReturn * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        winRate: Math.round(winRate * 10) / 10,
        totalTrades: tradeCount,
        winningTrades,
        finalValue: Math.round(totalValue),
        equityCurve,
        trades: trades.slice(-10), // Show last 10 trades
        parameters: { entryZ, exitZ, position_size }
      };
      
      setBacktestResults(results);
      toast.success(`Backtest complete! Total return: ${results.totalReturn}%`);
      
    } catch (error) {
      console.error('Backtest error:', error);
      toast.error("Failed to run backtest");
    } finally {
      setIsLoading(false);
    }
  };

  if (!stockData || !cointegrationResults) {
    return (
      <Alert className="bg-yellow-500/10 border-yellow-500/20">
        <AlertDescription className="text-yellow-200">
          Please complete the cointegration analysis first to run backtests.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Parameter Controls */}
      <Card className="bg-white/5 border-purple-300/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Strategy Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-purple-200">Entry Threshold (Z-Score)</Label>
              <div className="mt-2">
                <Slider
                  value={entryThreshold}
                  onValueChange={setEntryThreshold}
                  max={3}
                  min={0.5}
                  step={0.1}
                  className="mb-2"
                />
                <div className="text-center text-white font-mono">{entryThreshold[0]}</div>
              </div>
            </div>
            <div>
              <Label className="text-purple-200">Exit Threshold (Z-Score)</Label>
              <div className="mt-2">
                <Slider
                  value={exitThreshold}
                  onValueChange={setExitThreshold}
                  max={1}
                  min={0.05}
                  step={0.05}
                  className="mb-2"
                />
                <div className="text-center text-white font-mono">{exitThreshold[0]}</div>
              </div>
            </div>
            <div>
              <Label className="text-purple-200">Position Size ($)</Label>
              <div className="mt-2">
                <Slider
                  value={positionSize}
                  onValueChange={setPositionSize}
                  max={50000}
                  min={5000}
                  step={1000}
                  className="mb-2"
                />
                <div className="text-center text-white font-mono">${positionSize[0].toLocaleString()}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run Backtest Button */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={runBacktest} 
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Running Backtest...
            </>
          ) : (
            "Run Backtest"
          )}
        </Button>
      </div>

      {/* Results Display */}
      {backtestResults && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <Card className="bg-white/5 border-purple-300/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-purple-200">Total Return:</span>
                    <span className={`font-mono font-semibold ${backtestResults.totalReturn > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {backtestResults.totalReturn}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Sharpe Ratio:</span>
                    <span className="text-white font-mono">{backtestResults.sharpeRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Max Drawdown:</span>
                    <span className="text-red-400 font-mono">{backtestResults.maxDrawdown}%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-purple-200">Win Rate:</span>
                    <span className="text-white font-mono">{backtestResults.winRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Total Trades:</span>
                    <span className="text-white font-mono">{backtestResults.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Final Value:</span>
                    <span className="text-white font-mono">${backtestResults.finalValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equity Curve */}
          <Card className="bg-white/5 border-purple-300/20">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Equity Curve</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={backtestResults.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.7)"
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
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
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8b5cf6" 
                      fill="rgba(139,92,246,0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
