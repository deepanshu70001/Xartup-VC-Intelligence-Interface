import * as cheerio from "cheerio";
import type { LiveNewsItem } from "../types";

function parseGoogleNewsRss(xml: string, company: string, perCompanyLimit: number): LiveNewsItem[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const items: LiveNewsItem[] = [];

  $("item").each((_, element) => {
    if (items.length >= perCompanyLimit) return;

    const title = $(element).find("title").text().trim();
    const url = $(element).find("link").text().trim();
    const source = $(element).find("source").text().trim() || "Google News";
    const publishedAt = $(element).find("pubDate").text().trim();

    if (!title || !url) return;

    items.push({
      id: `${company}-${Buffer.from(url).toString("base64").slice(0, 16)}`,
      company,
      title,
      source,
      url,
      publishedAt: new Date(publishedAt || Date.now()).toISOString(),
    });
  });

  return items;
}

export async function fetchLiveFeed(
  companies: string[],
  perCompanyLimit: number,
  totalLimit: number
) {
  const requests = companies.map(async (company) => {
    const query = encodeURIComponent(`"${company}" startup OR funding OR product OR hiring`);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    try {
      const response = await fetch(rssUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      if (!response.ok) return [] as LiveNewsItem[];

      const xml = await response.text();
      return parseGoogleNewsRss(xml, company, perCompanyLimit);
    } catch {
      return [] as LiveNewsItem[];
    }
  });

  const results = (await Promise.all(requests)).flat();
  return Array.from(new Map(results.map((item) => [item.url, item])).values())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, totalLimit);
}
