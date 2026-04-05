import { NextResponse } from "next/server";

interface StockPrice {
  ticker: string;
  price: number | null;
  error?: string;
}

async function fetchYahooPrice(ticker: string, date?: string): Promise<number | null> {
  try {
    let url: string;

    if (date) {
      // Historical price: get closing price for specific date
      const targetDate = new Date(date);
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 1); // Yahoo needs end date to be next day

      const period1 = Math.floor(targetDate.getTime() / 1000);
      const period2 = Math.floor(endDate.getTime() / 1000);

      url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;
    } else {
      // Current price
      url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 300 },
      cache: date ? 'force-cache' : 'no-store', // Cache historical prices
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];

    if (date) {
      // For historical data, get the close price from the first timestamp
      const closes = result?.indicators?.quote?.[0]?.close;
      if (closes && closes.length > 0) {
        // Find the first non-null close price
        for (const close of closes) {
          if (close !== null) return close;
        }
      }
      return null;
    } else {
      // Current price
      return result?.meta?.regularMarketPrice ?? null;
    }
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get("tickers")?.split(",") || [];
  const date = searchParams.get("date"); // Optional: YYYY-MM-DD for historical prices

  if (tickers.length === 0) {
    return NextResponse.json({ error: "No tickers provided" }, { status: 400 });
  }

  const results: StockPrice[] = await Promise.all(
    tickers.map(async (ticker) => {
      const price = await fetchYahooPrice(ticker.trim(), date || undefined);
      return {
        ticker: ticker.trim(),
        price,
        ...(price === null ? { error: "Could not fetch price" } : {}),
      };
    })
  );

  return NextResponse.json({
    prices: results,
    date: date || "current",
  });
}
