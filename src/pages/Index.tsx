
import { useState } from "react";
import { CointegrationTest } from "@/components/CointegrationTest";
import { BacktestEngine } from "@/components/BacktestEngine";
import { DataFetcher } from "@/components/DataFetcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const [stockData, setStockData] = useState(null);
  const [cointegrationResults, setCointegrationResults] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Statistical Arbitrage with ML Enhancement
          </h1>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            A quantitative trading strategy using cointegration, mean reversion, and machine learning 
            to identify and exploit statistical arbitrage opportunities in stock pairs.
          </p>
        </header>

        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="data">Data & Setup</TabsTrigger>
            <TabsTrigger value="cointegration">Cointegration Test</TabsTrigger>
            <TabsTrigger value="backtest">Backtesting</TabsTrigger>
            <TabsTrigger value="ml">ML Enhancement</TabsTrigger>
          </TabsList>

          <TabsContent value="data">
            <Card className="bg-white/10 backdrop-blur-lg border-purple-300/20">
              <CardHeader>
                <CardTitle className="text-white">Phase 1: Data Collection</CardTitle>
                <CardDescription className="text-purple-200">
                  Fetch historical stock data for cointegrated pairs analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataFetcher onDataFetched={setStockData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cointegration">
            <Card className="bg-white/10 backdrop-blur-lg border-purple-300/20">
              <CardHeader>
                <CardTitle className="text-white">Phase 2: Cointegration Analysis</CardTitle>
                <CardDescription className="text-purple-200">
                  Test for cointegration and calculate hedge ratios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CointegrationTest 
                  stockData={stockData} 
                  onResultsGenerated={setCointegrationResults}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backtest">
            <Card className="bg-white/10 backdrop-blur-lg border-purple-300/20">
              <CardHeader>
                <CardTitle className="text-white">Phase 3: Strategy Backtesting</CardTitle>
                <CardDescription className="text-purple-200">
                  Simulate mean reversion trading strategy and analyze performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BacktestEngine 
                  stockData={stockData}
                  cointegrationResults={cointegrationResults}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ml">
            <Card className="bg-white/10 backdrop-blur-lg border-purple-300/20">
              <CardHeader>
                <CardTitle className="text-white">Phase 4: ML Enhancement</CardTitle>
                <CardDescription className="text-purple-200">
                  Machine learning features to improve trade timing (Coming Soon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <h3 className="text-2xl font-semibold text-white mb-4">ML Features Coming Soon</h3>
                  <p className="text-purple-200">
                    This phase will include feature engineering, model training, 
                    and ML-enhanced signal filtering.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
