import { buildApiUrl, getAuthHeaders, parseApiResponse } from "./api";

export interface LiveNewsItem {
  id: string;
  company: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function fetchLiveFeedForCompanies(
  companyNames: string[],
  options: { perCompany?: number; limit?: number } = {}
): Promise<LiveNewsItem[]> {
  const cleaned = Array.from(
    new Set(companyNames.map((name) => String(name || "").trim()).filter(Boolean))
  );
  if (cleaned.length === 0) return [];

  const perCompany = Math.max(1, Math.min(3, options.perCompany ?? 3));
  const totalLimit = Math.max(1, Math.min(20, options.limit ?? 20));
  const maxCompaniesPerRequest = Math.max(1, Math.min(10, Math.floor(totalLimit / perCompany) || 1));
  const requests = chunk(cleaned, maxCompaniesPerRequest).map(async (group) => {
    const params = new URLSearchParams({
      companies: group.join(","),
      perCompany: String(perCompany),
      limit: String(totalLimit),
    });

    const response = await fetch(buildApiUrl(`/api/live-feed?${params.toString()}`), {
      headers: getAuthHeaders(),
      credentials: "include",
    });
    const data = await parseApiResponse<{ error?: string; items?: LiveNewsItem[] }>(response);
    if (!response.ok) {
      throw new Error(data.error || "Failed to load live feed");
    }
    return Array.isArray(data.items) ? data.items : [];
  });

  const result = await Promise.all(requests);
  return result.flat();
}
