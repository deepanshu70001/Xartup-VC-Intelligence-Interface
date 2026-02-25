import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Gauge,
  List as ListIcon,
  Plus,
  Radar,
  Sparkles,
} from 'lucide-react';
import { Button, Badge } from '../components/ui/Primitives';
import { useApp } from '../context/AppContext';
import { buildApiUrl, getAuthHeaders, parseApiResponse } from '../lib/api';
import { getEvaluationScore } from '../lib/evaluation';
import type { LiveNewsItem } from '../lib/liveFeed';

interface LiveFeedItem {
  id: string;
  companyId?: string;
  name: string;
  action: string;
  source: string;
  time: string;
  score: number;
  dotColor: string;
  timestamp: number;
  articleUrl?: string;
  publishedAt?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function parseFundingToNumber(value?: string): number {
  if (!value) return 0;
  const normalized = value.replace(/,/g, '').trim().toUpperCase();
  const match = normalized.match(/\$?\s*([\d.]+)\s*([KMBT])?/);
  if (!match) return 0;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return 0;

  const suffix = match[2] || '';
  const multiplier =
    suffix === 'K' ? 1_000 :
      suffix === 'M' ? 1_000_000 :
        suffix === 'B' ? 1_000_000_000 :
          suffix === 'T' ? 1_000_000_000_000 : 1;
  return amount * multiplier;
}

function formatCompactMoney(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '$0';
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `$${Math.round(amount)}`;
}

function trendFromValues(current: number, previous: number, asPercent = true): string {
  if (asPercent) {
    if (previous <= 0) return current > 0 ? '+100%' : '0%';
    const pct = ((current - previous) / previous) * 100;
    const rounded = Math.round(pct);
    return `${rounded >= 0 ? '+' : ''}${rounded}%`;
  }
  const delta = current - previous;
  return `${delta >= 0 ? '+' : ''}${delta}`;
}

export default function DashboardPage() {
  const { companies, savedSearches, thesis, activities } = useApp();
  const [internetFeed, setInternetFeed] = useState<LiveFeedItem[]>([]);

  const getDotColor = (industry?: string) => {
    const palette = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-cyan-500'];
    if (!industry) return palette[0];
    const idx = Math.abs(industry.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % palette.length;
    return palette[idx];
  };

  const getScore = (input: string) => {
    const hash = input.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 997, 0);
    return 70 + (hash % 26);
  };

  const toSource = (urlOrLabel?: string) => {
    if (!urlOrLabel) return 'AI Enrichment';
    if (urlOrLabel.startsWith('http')) {
      try {
        return new URL(urlOrLabel).hostname.replace(/^www\./, '');
      } catch {
        return 'AI Enrichment';
      }
    }
    return urlOrLabel;
  };

  const timeAgo = (dateLike: string | number) => {
    const time = typeof dateLike === 'number' ? dateLike : new Date(dateLike).getTime();
    const diffMs = Date.now() - time;
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    let cancelled = false;

    const loadInternetFeed = async () => {
      try {
        const companyNames = companies.slice(0, 8).map((c) => c.name).join(',');
        if (!companyNames) {
          setInternetFeed([]);
          return;
        }

        const url = `${buildApiUrl('/api/live-feed')}?companies=${encodeURIComponent(companyNames)}&limit=10&perCompany=2`;
        const response = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
        if (!response.ok) {
          setInternetFeed([]);
          return;
        }

        const data = await parseApiResponse<{
          items: Array<{ id: string; company: string; title: string; source: string; url: string; publishedAt: string }>;
        }>(response);

        const mapped: LiveFeedItem[] = data.items.map((entry, idx) => {
          const company = companies.find((c) => c.name.toLowerCase() === entry.company.toLowerCase());
          const ts = new Date(entry.publishedAt).getTime() || Date.now() - idx * 60000;
          return {
            id: entry.id,
            companyId: company?.id,
            name: entry.company,
            action: entry.title,
            source: entry.source || 'Google News',
            time: timeAgo(ts),
            score: getScore(`${entry.company}-${entry.title}`),
            dotColor: getDotColor(company?.industry),
            timestamp: ts,
            articleUrl: entry.url,
            publishedAt: entry.publishedAt,
          };
        });

        if (!cancelled) setInternetFeed(mapped);
      } catch {
        if (!cancelled) setInternetFeed([]);
      }
    };

    loadInternetFeed();
    const interval = window.setInterval(loadInternetFeed, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [companies]);

  const localFeedItems = useMemo<LiveFeedItem[]>(() => {
    const enrichmentItems = companies.flatMap((company) => {
      if (!company.enrichment) return [];
      const ts = new Date(company.enrichment.timestamp).getTime() || Date.now();
      const signals = company.enrichment.derived_signals?.slice(0, 2) || [];
      const primarySignals = signals.length > 0 ? signals : [company.enrichment.summary];
      return primarySignals.map((signal, idx) => ({
        id: `${company.id}-enrichment-${idx}`,
        companyId: company.id,
        name: company.name,
        action: signal,
        source: toSource(company.enrichment?.source),
        time: timeAgo(ts - idx * 300000),
        score: getScore(`${company.name}-${signal}`),
        dotColor: getDotColor(company.industry),
        timestamp: ts - idx * 300000,
        publishedAt: new Date(ts - idx * 300000).toISOString(),
      }));
    });

    const activityItems = activities
      .filter((a) => a.action === 'Enriched Company')
      .slice(0, 8)
      .map((a, idx) => {
        const company = companies.find((c) => a.details.includes(c.name));
        const ts = new Date(a.timestamp).getTime() || Date.now();
        return {
          id: `activity-${a.id}`,
          companyId: company?.id,
          name: company?.name || 'Portfolio Company',
          action: a.details,
          source: 'FlowStack Activity',
          time: timeAgo(ts),
          score: getScore(`${a.action}-${idx}`),
          dotColor: getDotColor(company?.industry),
          timestamp: ts,
          publishedAt: new Date(ts).toISOString(),
        };
      });

    const merged = [...enrichmentItems, ...activityItems].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
    if (merged.length > 0) return merged;

    return companies.slice(0, 6).map((company, idx) => {
      const ts = Date.now() - idx * 4 * 60 * 60 * 1000;
      return {
        id: `fallback-${company.id}`,
        companyId: company.id,
        name: company.name,
        action: `Added ${company.name} to ${company.industry} watchlist`,
        source: 'FlowStack',
        time: timeAgo(ts),
        score: getScore(`${company.name}-${company.industry}`),
        dotColor: getDotColor(company.industry),
        timestamp: ts,
        publishedAt: new Date(ts).toISOString(),
      };
    });
  }, [activities, companies]);

  const liveFeedItems = useMemo(() => {
    return [...internetFeed, ...localFeedItems].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  }, [internetFeed, localFeedItems]);

  const now = Date.now();

  const evaluationScoreByCompanyId = useMemo(() => {
    const byId: Record<string, number> = {};
    companies.forEach((company) => {
      const relatedNews: LiveNewsItem[] = internetFeed
        .filter(
          (item) =>
            item.companyId === company.id ||
            item.name.toLowerCase() === company.name.toLowerCase()
        )
        .map((item) => ({
          id: item.id,
          company: item.name,
          title: item.action,
          source: item.source,
          url: item.articleUrl || '',
          publishedAt: item.publishedAt || new Date(item.timestamp).toISOString(),
        }));

      byId[company.id] = getEvaluationScore(company, thesis);
    });
    return byId;
  }, [companies, thesis]);

  const dashboardMetrics = useMemo(() => {
    const totalCompanies = companies.length;
    const thesisMatches = companies.filter((company) => (evaluationScoreByCompanyId[company.id] ?? 0) >= 60).length;

    const recentCompanies = companies.filter((company) => {
      if (!company.createdAt) return false;
      return now - new Date(company.createdAt).getTime() <= 30 * DAY_MS;
    }).length;
    const previousCompanies = companies.filter((company) => {
      if (!company.createdAt) return false;
      const age = now - new Date(company.createdAt).getTime();
      return age > 30 * DAY_MS && age <= 60 * DAY_MS;
    }).length;

    const weightedDealFlow = companies.reduce((acc, company) => {
      const funding = parseFundingToNumber(company.total_funding);
      const stage = String(company.stage || '').toLowerCase();
      const weight =
        stage.includes('seed') ? 0.2 :
          stage.includes('series a') ? 0.35 :
            stage.includes('series b') ? 0.5 :
              stage.includes('series c') || stage.includes('series d') || stage.includes('late') ? 0.65 :
                stage.includes('public') ? 0.8 : 0.3;
      return acc + funding * weight;
    }, 0);

    const recentDealFlow = companies
      .filter((company) => {
        if (!company.createdAt) return false;
        return now - new Date(company.createdAt).getTime() <= 30 * DAY_MS;
      })
      .reduce((acc, company) => acc + parseFundingToNumber(company.total_funding), 0);
    const previousDealFlow = companies
      .filter((company) => {
        if (!company.createdAt) return false;
        const age = now - new Date(company.createdAt).getTime();
        return age > 30 * DAY_MS && age <= 60 * DAY_MS;
      })
      .reduce((acc, company) => acc + parseFundingToNumber(company.total_funding), 0);

    const activeSectorsList = Array.from(new Set(companies.map((company) => company.industry).filter(Boolean)));

    return {
      totalCompanies,
      thesisMatches,
      weightedDealFlow,
      activeSectorsList,
      thesisTrend: trendFromValues(thesisMatches, Math.max(0, thesisMatches - recentCompanies), false),
      pipelineTrend: trendFromValues(recentCompanies, previousCompanies, false),
      dealFlowTrend: trendFromValues(recentDealFlow, previousDealFlow, true),
    };
  }, [companies, evaluationScoreByCompanyId, now]);

  const scoredLiveFeedItems = useMemo(() => {
    return liveFeedItems.map((item) => ({
      ...item,
      score: item.companyId ? (evaluationScoreByCompanyId[item.companyId] ?? item.score) : item.score,
    }));
  }, [liveFeedItems, evaluationScoreByCompanyId]);

  const pipelineStageCounts = useMemo(() => {
    const counts = { Watchlist: 0, Outreach: 0, 'Due Diligence': 0, 'Term Sheet': 0 };
    companies.forEach((company) => {
      const stage = String(company.stage || '').toLowerCase();
      if (stage.includes('public') || stage.includes('late')) counts['Term Sheet'] += 1;
      else if (stage.includes('series c') || stage.includes('series d') || stage.includes('series b')) counts['Due Diligence'] += 1;
      else if (stage.includes('series a')) counts['Outreach'] += 1;
      else counts['Watchlist'] += 1;
    });
    return counts;
  }, [companies]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-6 md:pb-10">
      <motion.div variants={item} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">Intelligence Command Center</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm md:text-base">
            Tracking <span className="font-semibold text-neutral-900 dark:text-white">{dashboardMetrics.totalCompanies}</span> companies across{' '}
            <span className="font-semibold text-neutral-900 dark:text-white">{dashboardMetrics.activeSectorsList.length}</span> active sectors.
          </p>
        </div>
        <Link to="/companies">
          <Button>
            <Plus size={16} className="mr-2" /> Add Company
          </Button>
        </Link>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Thesis Matches" tone="sky" value={dashboardMetrics.thesisMatches} trend={dashboardMetrics.thesisTrend} trendUp={!dashboardMetrics.thesisTrend.startsWith('-')} icon={<CheckCircle2 size={18} strokeWidth={2.2} />} description="High conviction signals" />
        <StatCard label="Pipeline Volume" tone="emerald" value={dashboardMetrics.totalCompanies} trend={dashboardMetrics.pipelineTrend} trendUp={!dashboardMetrics.pipelineTrend.startsWith('-')} icon={<Building2 size={18} strokeWidth={2.2} />} description="Active companies" />
        <StatCard label="Est. Deal Flow" tone="amber" value={formatCompactMoney(dashboardMetrics.weightedDealFlow)} trend={dashboardMetrics.dealFlowTrend} trendUp={!dashboardMetrics.dealFlowTrend.startsWith('-')} icon={<Gauge size={18} strokeWidth={2.2} />} description="Weighted pipeline value" />
        <StatCard
          label="Active Sectors"
          tone="violet"
          value={dashboardMetrics.activeSectorsList.length}
          icon={<Radar size={18} strokeWidth={2.2} />}
          description="Focus areas"
          customBadge={
            <div className="flex -space-x-2 overflow-hidden ml-2">
              {dashboardMetrics.activeSectorsList.slice(0, 3).map((sector, index) => (
                <div key={index} className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[10px] font-bold" title={sector}>
                  {sector[0]}
                </div>
              ))}
            </div>
          }
        />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <section className="xl:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 md:p-6 shadow-sm surface-pop">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-500" size={18} strokeWidth={2.2} />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Live Intelligence Feed</h2>
            </div>
            <Link to="/companies" className="text-xs md:text-sm text-sky-700 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200 font-medium flex items-center">
              View all <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>

          <div className="space-y-1">
            {scoredLiveFeedItems.map((feedItem) => (
              <React.Fragment key={feedItem.id}>
                <SignalItem
                  name={feedItem.name}
                  action={feedItem.action}
                  source={feedItem.source}
                  time={feedItem.time}
                  dotColor={feedItem.dotColor}
                  score={feedItem.score}
                  companyId={feedItem.companyId}
                  articleUrl={feedItem.articleUrl}
                />
              </React.Fragment>
            ))}
          </div>
        </section>

        <div className="space-y-4 md:space-y-6">
          <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 md:p-6 shadow-sm surface-pop">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Pipeline Stages</h2>
            <div className="space-y-3">
              <PipelineStage label="Watchlist" count={pipelineStageCounts.Watchlist} tone="neutral" />
              <PipelineStage label="Outreach" count={pipelineStageCounts.Outreach} tone="sky" />
              <PipelineStage label="Due Diligence" count={pipelineStageCounts['Due Diligence']} tone="amber" />
              <PipelineStage label="Term Sheet" count={pipelineStageCounts['Term Sheet']} tone="emerald" />
            </div>
          </section>

          <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 md:p-6 shadow-sm surface-pop">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Saved Searches</h2>
              <Link to="/saved" className="text-xs text-neutral-600 dark:text-neutral-300 hover:underline">View all</Link>
            </div>

            <div className="space-y-2">
              {savedSearches.length > 0 ? (
                savedSearches.slice(0, 4).map((search) => (
                  <Link
                    key={search.id}
                    to={`/companies?savedSearchId=${search.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/25 flex items-center justify-center text-sky-700 dark:text-sky-300">
                        <ListIcon size={14} />
                      </div>
                      <span className="font-medium text-sm text-neutral-900 dark:text-white truncate">{search.name}</span>
                    </div>
                    <ArrowRight size={14} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-neutral-400 italic">No saved searches.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  tone = 'neutral',
  icon,
  trend,
  trendUp,
  customBadge,
  description,
}: {
  label: string;
  value: number | string;
  tone?: 'neutral' | 'sky' | 'emerald' | 'amber' | 'violet';
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  customBadge?: React.ReactNode;
  description?: string;
}) {
  const toneStyles = {
    neutral: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200',
    sky: 'bg-sky-100 dark:bg-sky-900/25 text-sky-700 dark:text-sky-300',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-100 dark:bg-amber-900/25 text-amber-700 dark:text-amber-300',
    violet: 'bg-violet-100 dark:bg-violet-900/25 text-violet-700 dark:text-violet-300',
  } as const;

  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.2 }} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm surface-pop">
      <div className="flex justify-between items-start mb-2">
        <div className="text-neutral-500 dark:text-neutral-400 font-medium text-xs uppercase tracking-wide">{label}</div>
        <div className={`p-2 rounded-lg ${toneStyles[tone]}`}>{icon}</div>
      </div>
      <div className="flex items-end gap-2 mb-1">
        <div className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-white">{value}</div>
        {trend && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full mb-1 ${trendUp ? 'bg-emerald-100 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/25 text-red-700 dark:text-red-300'}`}>
            {trend}
          </span>
        )}
        {customBadge}
      </div>
      {description && <div className="text-xs text-neutral-400">{description}</div>}
    </motion.div>
  );
}

function SignalItem({
  name,
  action,
  time,
  dotColor,
  source,
  score,
  companyId,
  articleUrl,
}: {
  name: string;
  action: string;
  time: string;
  dotColor: string;
  source: string;
  score: number;
  companyId?: string;
  articleUrl?: string;
}) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    articleUrl ? (
      <a href={articleUrl} target="_blank" rel="noopener noreferrer">{children}</a>
    ) : companyId ? (
      <Link to={`/companies/${companyId}`}>{children}</Link>
    ) : (
      <>{children}</>
    );

  return (
    <Wrapper>
      <motion.div
        whileHover={{ x: 4, backgroundColor: 'rgba(0,0,0,0.02)' }}
        className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 px-2 md:px-3 -mx-2 md:-mx-3 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`}></div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-neutral-900 dark:text-white font-semibold text-sm truncate">{name}</span>
              <Badge variant="neutral" className="text-[10px] py-0 h-5">{source}</Badge>
            </div>
            <div className="text-neutral-600 dark:text-neutral-400 text-xs md:text-sm mt-0.5 truncate">{action}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Score</div>
            <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{score}</div>
          </div>
          <div className="text-xs text-neutral-400 w-12 text-right">{time}</div>
        </div>
      </motion.div>
    </Wrapper>
  );
}

function PipelineStage({
  label,
  count,
  tone = 'neutral',
}: {
  label: string;
  count: number;
  tone?: 'neutral' | 'sky' | 'amber' | 'emerald';
}) {
  const toneStyles = {
    neutral: 'bg-neutral-300 dark:bg-neutral-600',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
  } as const;

  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${toneStyles[tone]}`} />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      </div>
      <span className="text-sm font-semibold text-neutral-900 dark:text-white">{count}</span>
    </div>
  );
}
