import type { Company } from "../types";
import type { Thesis } from "../context/AppContext";

export interface LiveNewsSignal {
  id?: string;
  company?: string;
  title?: string;
  publishedAt?: string;
  source?: string;
  url?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizedText(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function countRecentNews(items: LiveNewsSignal[], nowMs: number, days: number) {
  const windowMs = days * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    const time = new Date(String(item.publishedAt || "")).getTime();
    return Number.isFinite(time) && nowMs - time <= windowMs;
  }).length;
}

export function getEvaluationScore(
  company: Company,
  thesis: Thesis | undefined,
  liveNewsItems: LiveNewsSignal[] = [],
  nowMs = Date.now()
) {
  let score = 20;

  const industry = normalizedText(company.industry);
  const stage = normalizedText(company.stage);
  const textBlob = [
    company.description || "",
    ...(Array.isArray(company.tags) ? company.tags : []),
    ...(company.enrichment?.keywords || []),
    ...(company.enrichment?.derived_signals || []),
    ...liveNewsItems.map((item) => item.title || ""),
  ]
    .join(" ")
    .toLowerCase();

  const sectorMatches = (thesis?.sectors || []).filter((sector) =>
    industry.includes(normalizedText(sector))
  ).length;
  score += Math.min(sectorMatches * 12, 24);

  const stageMatches = (thesis?.stages || []).filter((targetStage) =>
    stage.includes(normalizedText(targetStage))
  ).length;
  score += Math.min(stageMatches * 10, 20);

  const keywordMatches = (thesis?.keywords || []).filter((keyword) =>
    textBlob.includes(normalizedText(keyword))
  ).length;
  score += Math.min(keywordMatches * 3, 15);

  const sourceScore = Math.min((company.enrichment?.sources?.length || 0) * 2, 10);
  const enrichmentSignalScore = Math.min((company.enrichment?.derived_signals?.length || 0) * 2, 10);
  const enrichmentKeywordScore = Math.min((company.enrichment?.keywords?.length || 0), 5);
  score += sourceScore + enrichmentSignalScore + enrichmentKeywordScore;

  const totalNewsScore = Math.min(liveNewsItems.length * 2, 8);
  const recent7d = countRecentNews(liveNewsItems, nowMs, 7);
  const recent30d = countRecentNews(liveNewsItems, nowMs, 30);
  const recencyScore = Math.min(recent7d * 3 + Math.max(0, recent30d - recent7d), 8);
  score += totalNewsScore + recencyScore;

  return clamp(Math.round(score), 0, 100);
}

export function getEvaluationBadgeVariant(score: number): "success" | "warning" | "neutral" {
  if (score >= 75) return "success";
  if (score >= 55) return "warning";
  return "neutral";
}
