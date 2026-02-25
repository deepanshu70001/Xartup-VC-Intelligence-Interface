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
  thesis: Thesis | undefined
) {
  let score = 0;

  // 1. Data Completeness Baseline (Max 15 points)
  if (company.description && company.description.length > 20) score += 5;
  if (company.domain) score += 5;
  if (company.enrichment) score += 5;

  const industry = normalizedText(company.industry);
  const stage = normalizedText(company.stage);
  const textBlob = [
    company.description || "",
    ...(Array.isArray(company.tags) ? company.tags : []),
    company.description || "",
    ...(Array.isArray(company.tags) ? company.tags : []),
    ...(company.enrichment?.keywords || []),
    ...(company.enrichment?.derived_signals || [])
  ]
    .join(" ")
    .toLowerCase();

  // 2. Anti-Portfolio Penalty (Massive impact if true)
  const antiPortfolioMatches = (thesis?.antiPortfolio || []).filter((keyword) =>
    industry.includes(normalizedText(keyword)) || textBlob.includes(normalizedText(keyword))
  ).length;
  if (antiPortfolioMatches > 0) {
    score -= Math.min(antiPortfolioMatches * 30, 60);
  }

  // 3. Thesis Matches (Max 60 points)
  const sectorMatches = (thesis?.sectors || []).filter((sector) =>
    industry.includes(normalizedText(sector))
  ).length;
  score += Math.min(sectorMatches * 15, 25);

  const stageMatches = (thesis?.stages || []).filter((targetStage) =>
    stage.includes(normalizedText(targetStage))
  ).length;
  score += Math.min(stageMatches * 15, 20); // increased target weight

  const keywordMatches = (thesis?.keywords || []).filter((keyword) =>
    textBlob.includes(normalizedText(keyword))
  ).length;
  score += Math.min(keywordMatches * 5, 25); // increased target weight

  // 4. Enrichment Depth (Max 15 points)
  const sourceScore = Math.min((company.enrichment?.sources?.length || 0) * 2, 5);
  const enrichmentSignalScore = Math.min((company.enrichment?.derived_signals?.length || 0) * 2, 5);
  const enrichmentKeywordScore = Math.min((company.enrichment?.keywords?.length || 0), 5);
  score += sourceScore + enrichmentSignalScore + enrichmentKeywordScore;

  return clamp(Math.round(score), 0, 100);
}

export function getEvaluationBadgeVariant(score: number): "success" | "warning" | "neutral" {
  if (score >= 75) return "success";
  if (score >= 55) return "warning";
  return "neutral";
}
