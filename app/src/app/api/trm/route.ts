import { NextResponse } from "next/server";

async function fetchTrmFromGov(): Promise<number | null> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const url = `https://www.datos.gov.co/resource/ceyp-9c7c.json?$where=vigenciahasta >= '${today}'&$order=vigenciahasta DESC&$limit=1`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
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

export async function GET() {
  let trm = await fetchTrmFromGov();
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

  return NextResponse.json({ trm, source });
}
