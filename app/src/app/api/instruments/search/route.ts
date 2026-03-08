import { NextResponse } from "next/server";

interface YahooQuote {
  symbol: string;
  shortname: string;
  longname: string;
  quoteType: string;
  exchange: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    const quotes: YahooQuote[] = (data.quotes || []).map(
      (q: Record<string, string>) => ({
        symbol: q.symbol || "",
        shortname: q.shortname || "",
        longname: q.longname || "",
        quoteType: q.quoteType || "",
        exchange: q.exchange || "",
      })
    );

    return NextResponse.json({ results: quotes });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
