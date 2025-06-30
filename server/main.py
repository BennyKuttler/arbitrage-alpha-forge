from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from typing import List
import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import coint
from yahoo_proxy import router as yahoo_router
from fastapi import FastAPI



app = FastAPI()
app.include_router(yahoo_router, prefix="/api")

class SeriesInput(BaseModel):
    series_x: List[float]
    series_y: List[float]

@app.post("/cointegration")
def cointegration_test(data: SeriesInput):
    score, pvalue, _ = coint(data.series_x, data.series_y)
    return {"score": score, "pvalue": pvalue}

class BacktestInput(BaseModel):
    prices: List[float]
    signals: List[int]

@app.post("/backtest")
def backtest(data: BacktestInput):
    # Basic PnL, Sharpe, and drawdown calculation (placeholder)
    prices = np.array(data.prices)
    signals = np.array(data.signals)
    returns = np.diff(prices) / prices[:-1]
    strat_returns = returns * signals[:-1]
    pnl = float(np.sum(strat_returns))
    sharpe = float(np.mean(strat_returns) / (np.std(strat_returns) + 1e-8))
    max_dd = float(np.max(np.maximum.accumulate(np.cumsum(strat_returns)) - np.cumsum(strat_returns)))
    return {"pnl": pnl, "sharpe": sharpe, "max_drawdown": max_dd}

@app.post("/ml/train")
def train_ml_model(file: UploadFile = File(...)):
    # Placeholder for ML model training
    # Save file, train model, return model id (to be implemented)
    return {"status": "training started"}