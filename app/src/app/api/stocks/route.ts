import { NextResponse } from "next/server";

interface StockPrice {
  ticker: string;
  price: number | null;
  error?: string;
}

async function fetchYahooPrice(ticker: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    return meta?.regularMarketPrice ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get("tickers")?.split(",") || [];

  if (tickers.length === 0) {
    return NextResponse.json({ error: "No tickers provided" }, { status: 400 });
  }

  const results: StockPrice[] = await Promise.all(
    tickers.map(async (ticker) => {
      const price = await fetchYahooPrice(ticker.trim());
      return {
        ticker: ticker.trim(),
        price,
        ...(price === null ? { error: "Could not fetch price" } : {}),
      };
    })
  );

  return NextResponse.json({ prices: results });
}
