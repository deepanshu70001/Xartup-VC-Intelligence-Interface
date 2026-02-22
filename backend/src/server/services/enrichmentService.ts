import Groq from "groq-sdk";
import * as cheerio from "cheerio";

function getHeaders() {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  };
}

async function fetchPageText(candidateUrl: string) {
  const response = await fetch(candidateUrl, { headers: getHeaders() });
  if (!response.ok) return null;

  const html = await response.text();
  const $ = cheerio.load(html);
  $("script, style, svg, noscript, iframe, link, meta").remove();
  const title = $("title").text().trim();
  const text = $("body").text().replace(/\s+/g, " ").trim().substring(0, 12000);
  if (!text) return null;

  return { text: `${title ? `${title}\n` : ""}${text}`, html };
}

function buildEnrichmentPrompt(textContent: string) {
  return `
Analyze the following multi-page website content for a company and return ONLY valid JSON.

JSON schema:
{
  "summary": "1-2 sentences",
  "what_they_do": ["3-6 bullets"],
  "keywords": ["5-10 concise keywords"],
  "derived_signals": ["2-4 inferred signals from the scraped pages"],
  "facts": {
    "location": "city/country or null",
    "employee_count": "employee range/text or null",
    "founded_year": 2020,
    "total_funding": "formatted amount or null",
    "stage": "Seed/Series A/etc or null",
    "confidence": {
      "location": 0.0,
      "employee_count": 0.0,
      "founded_year": 0.0,
      "total_funding": 0.0,
      "stage": 0.0
    }
  }
}

Rules:
- Keep statements grounded in provided content.
- "derived_signals" should infer evidence like careers presence, recent updates, docs/changelog, hiring, etc.
- Use null for unknown fields in "facts".
- confidence values must be between 0 and 1.
- No markdown, no extra text.

CONTENT:
${textContent}
`;
}

function clampConfidence(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric < 0) return 0;
  if (numeric > 1) return 1;
  return numeric;
}

function normalizeEnrichmentData(raw: any) {
  const facts = raw?.facts || {};
  const confidence = facts?.confidence || {};

  return {
    summary: typeof raw?.summary === "string" ? raw.summary : "",
    what_they_do: Array.isArray(raw?.what_they_do) ? raw.what_they_do : [],
    keywords: Array.isArray(raw?.keywords) ? raw.keywords : [],
    derived_signals: Array.isArray(raw?.derived_signals) ? raw.derived_signals : [],
    facts: {
      location: typeof facts?.location === "string" ? facts.location : null,
      employee_count: typeof facts?.employee_count === "string" ? facts.employee_count : null,
      founded_year:
        Number.isInteger(facts?.founded_year) && facts.founded_year > 1700
          ? facts.founded_year
          : null,
      total_funding: typeof facts?.total_funding === "string" ? facts.total_funding : null,
      stage: typeof facts?.stage === "string" ? facts.stage : null,
      confidence: {
        location: clampConfidence(confidence?.location),
        employee_count: clampConfidence(confidence?.employee_count),
        founded_year: clampConfidence(confidence?.founded_year),
        total_funding: clampConfidence(confidence?.total_funding),
        stage: clampConfidence(confidence?.stage),
      },
    },
  };
}

export async function enrichCompanyUrl(url: string, apiKey: string) {
  const normalizedUrl =
    url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  const rootUrl = new URL(normalizedUrl);
  const host = rootUrl.hostname;

  const home = await fetchPageText(rootUrl.toString());
  if (!home) {
    throw new Error("Failed to fetch company homepage");
  }

  const $home = cheerio.load(home.html);
  const sourceUrls = new Set<string>([rootUrl.toString()]);
  const likelyPathRe =
    /(career|jobs|hiring|blog|news|changelog|release|product|pricing|about|team)/i;

  $home("a[href]").each((_, el) => {
    const href = $home(el).attr("href");
    if (!href) return;

    try {
      const absoluteUrl = new URL(href, rootUrl.toString());
      if (absoluteUrl.hostname !== host) return;
      if (!likelyPathRe.test(absoluteUrl.pathname)) return;
      sourceUrls.add(absoluteUrl.toString());
    } catch {
      // ignore invalid URLs
    }
  });

  const urlsToFetch = Array.from(sourceUrls).slice(0, 6);
  const fetchedPages = await Promise.all(
    urlsToFetch.map(async (sourceUrl) => {
      try {
        const result = await fetchPageText(sourceUrl);
        if (!result) return null;
        return { url: sourceUrl, text: result.text };
      } catch {
        return null;
      }
    })
  );

  const validPages = fetchedPages.filter((page): page is { url: string; text: string } => !!page);
  const textContent = validPages
    .map((page) => `SOURCE: ${page.url}\n${page.text}`)
    .join("\n\n---\n\n")
    .substring(0, 30000);

  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: buildEnrichmentPrompt(textContent) }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const jsonContent = completion.choices[0]?.message?.content;
  if (!jsonContent) {
    throw new Error("No content returned from Groq");
  }

  const enrichmentData = normalizeEnrichmentData(JSON.parse(jsonContent));
  const scrapedSources = validPages.map((page) => page.url);

  return {
    ...enrichmentData,
    source: normalizedUrl,
    sources: scrapedSources,
    timestamp: new Date().toISOString(),
  };
}
