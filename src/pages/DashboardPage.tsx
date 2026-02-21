import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  TrendingUp, 
  List as ListIcon, 
  ArrowRight,
  DollarSign,
  Plus,
  Target,
  Zap
} from 'lucide-react';
import { Button, Badge } from '../components/ui/Primitives';

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
}

export default function DashboardPage() {
  const { companies, savedSearches, thesis, activities } = useApp();

  const getDotColor = (industry?: string) => {
    const palette = ['bg-indigo-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'];
    if (!industry) return palette[0];
    const idx = Math.abs(
      industry.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    ) % palette.length;
    return palette[idx];
  };

  const getScore = (input: string) => {
    const hash = input.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 997, 0);
    return 70 + (hash % 26); // 70 - 95
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

  const liveFeedItems = useMemo<LiveFeedItem[]>(() => {
    const enrichmentItems: LiveFeedItem[] = companies.flatMap((company) => {
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
      }));
    });

    const activityItems: LiveFeedItem[] = activities
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
        };
      });

    const merged = [...enrichmentItems, ...activityItems]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);

    if (merged.length > 0) return merged;

    // Fallback: generate feed from tracked companies so dashboard is never empty.
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
      };
    });
  }, [activities, companies]);

  // Calculate some stats
  const totalCompanies = companies.length;
  const newSignals = liveFeedItems.filter(
    (item) => Date.now() - item.timestamp < 7 * 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Intelligence Command Center</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-lg">
            Tracking <span className="font-semibold text-neutral-900 dark:text-white">{totalCompanies}</span> companies across <span className="font-semibold text-neutral-900 dark:text-white">{thesis.sectors.length}</span> focus sectors.
          </p>
        </div>
        <div className="flex gap-3">
            <Link to="/companies">
                <Button>
                    <Plus size={18} className="mr-2" /> Add Company
                </Button>
            </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Thesis Matches" 
          value={newSignals} 
          icon={<Target className="text-indigo-600 dark:text-indigo-400" size={24} />} 
          trend="+12%"
          trendUp={true}
          description="High conviction signals"
        />
        <StatCard 
          label="Pipeline Volume" 
          value={totalCompanies} 
          icon={<Building2 className="text-emerald-600 dark:text-emerald-400" size={24} />} 
          trend="+5"
          trendUp={true}
          description="Active companies"
        />
        <StatCard 
          label="Est. Deal Flow" 
          value="$45M" 
          icon={<DollarSign className="text-blue-600 dark:text-blue-400" size={24} />} 
          trend="+8%"
          trendUp={true}
          description="Weighted pipeline value"
        />
        <StatCard 
          label="Active Sectors" 
          value={thesis.sectors.length} 
          icon={<TrendingUp className="text-orange-600 dark:text-orange-400" size={24} />} 
          customBadge={<div className="flex -space-x-2 overflow-hidden ml-2">
            {thesis.sectors.slice(0, 3).map((s, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[10px] font-bold" title={s}>
                    {s[0]}
                </div>
            ))}
          </div>}
          description="Focus areas"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Intelligence Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
                <Zap className="text-amber-500" size={20} />
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Live Intelligence Feed</h2>
            </div>
            <Link to="/companies" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center">
              View all <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>

          <div className="space-y-0">
            {liveFeedItems.map((item) => (
              <React.Fragment key={item.id}>
                <SignalItem
                  name={item.name}
                  action={item.action}
                  source={item.source}
                  time={item.time}
                  dotColor={item.dotColor}
                  score={item.score}
                  companyId={item.companyId}
                />
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Pipeline Summary / Saved Searches */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Pipeline Stages</h2>
                <div className="space-y-4">
                    <PipelineStage label="Watchlist" count={12} color="bg-neutral-500" />
                    <PipelineStage label="Outreach" count={5} color="bg-blue-500" />
                    <PipelineStage label="Due Diligence" count={2} color="bg-amber-500" />
                    <PipelineStage label="Term Sheet" count={1} color="bg-green-500" />
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Saved Searches</h2>
                <Link to="/saved" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
            </div>

            <div className="space-y-3">
                {savedSearches.length > 0 ? (
                savedSearches.slice(0, 3).map(search => (
                    <Link
                      key={search.id}
                      to={`/companies?savedSearchId=${search.id}`}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <ListIcon size={14} />
                            </div>
                            <span className="font-medium text-sm text-neutral-900 dark:text-white truncate max-w-[120px]">{search.name}</span>
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
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend, trendUp, customBadge, description }: { label: string, value: number | string, icon: React.ReactNode, trend?: string, trendUp?: boolean, customBadge?: React.ReactNode, description?: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="text-neutral-500 dark:text-neutral-400 font-medium text-sm uppercase tracking-wide">{label}</div>
        <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3 mb-1">
        <div className="text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full mb-1.5 ${trendUp ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
            {trend}
          </span>
        )}
        {customBadge}
      </div>
      {description && <div className="text-xs text-neutral-400">{description}</div>}
    </div>
  );
}

const SignalItem = ({ name, action, time, dotColor, source, score, companyId }: { name: string, action: string, time: string, dotColor: string, source: string, score: number, companyId?: string }) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      companyId ? <Link to={`/companies/${companyId}`}>{children}</Link> : <>{children}</>;

    return (
        <Wrapper>
          <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 px-4 -mx-4 transition-colors cursor-pointer group rounded-lg">
              <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`}></div>
                  <div>
                      <div className="flex items-center gap-2">
                          <span className="text-neutral-900 dark:text-white font-bold text-base">{name}</span>
                          <Badge variant="neutral" className="text-[10px] py-0 h-5">{source}</Badge>
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-400 text-sm mt-0.5">{action}</div>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                      <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Score</div>
                      <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{score}</div>
                  </div>
                  <div className="text-xs text-neutral-400 w-16 text-right">{time}</div>
                </div>
          </div>
        </Wrapper>
    )
}

const PipelineStage = ({ label, count, color }: { label: string, count: number, color: string }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className={`w-2 h-8 rounded-full ${color}`}></div>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
        </div>
        <span className="text-sm font-bold text-neutral-900 dark:text-white">{count}</span>
    </div>
)
