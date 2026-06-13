import { NextResponse } from "next/server";

const TENOR_KEY = process.env.TENOR_API_KEY || "LIVDSRZULELA";

interface TenorMedia {
  gif?: { url?: string };
  tinygif?: { url?: string };
  nanogif?: { url?: string };
}

interface TenorResult {
  id: string;
  media?: TenorMedia[];
  title?: string;
}

interface TenorResponse {
  results?: TenorResult[];
}

function parseResults(data: TenorResponse) {
  return (data.results || []).map((item) => ({
    id: item.id,
    url: item.media?.[0]?.gif?.url || "",
    preview: item.media?.[0]?.tinygif?.url || item.media?.[0]?.nanogif?.url || item.media?.[0]?.gif?.url || "",
    title: item.title || "",
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "trending";
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

  try {
    let apiUrl: string;
    if (q === "__trending__") {
      apiUrl = `https://api.tenor.com/v1/trending?key=${TENOR_KEY}&limit=${limit}&media_filter=minimal&contentfilter=low`;
    } else {
      apiUrl = `https://api.tenor.com/v1/search?q=${encodeURIComponent(q)}&key=${TENOR_KEY}&limit=${limit}&media_filter=minimal&contentfilter=low`;
    }

    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`Tenor API hatası: ${res.status}`);
    const data = await res.json();

    return NextResponse.json({ results: parseResults(data) });
  } catch (error) {
    console.error("GIF arama hatası:", error);
    return NextResponse.json({ error: "GIF arama başarısız" }, { status: 500 });
  }
}
