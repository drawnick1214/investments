import { NextResponse } from "next/server";

async function fetchTrmFromGov(date?: string): Promise<number | null> {
  try {
    const targetDate = date || new Date().toISOString().split("T")[0];
    // Get TRM where targetDate is within validity period (vigenciadesde <= targetDate <= vigenciahasta)
    const url = `https://www.datos.gov.co/resource/ceyp-9c7c.json?$where=vigenciadesde <= '${targetDate}' AND vigenciahasta >= '${targetDate}'&$order=vigenciadesde DESC&$limit=1`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      cache: date ? 'force-cache' : 'no-store' // Cache historical TRM
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      return parseFloat(data[0].valor);
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchTrmFallback(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.rates?.COP ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // Optional: YYYY-MM-DD for historical TRM

  let trm = await fetchTrmFromGov(date || undefined);
  let source = "datos.gov.co";

  if (!trm) {
    trm = await fetchTrmFallback();
    source = "exchangerate-api.com";
  }

  if (!trm) {
    return NextResponse.json(
      { error: "Could not fetch TRM from any source" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    trm,
    source,
    date: date || "current",
  });
}
