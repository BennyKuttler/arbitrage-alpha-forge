from fastapi import APIRouter, Query
import httpx

router = APIRouter()

@router.get("/yahoo-prices")
async def yahoo_prices(symbol: str, range: str = '3y', interval: str = '1d'):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range={range}&interval={interval}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        return resp.json()