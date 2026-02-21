import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  TrendingUp, 
  List as ListIcon, 
  Clock, 
  ArrowRight,
  Sparkles,
  DollarSign,
  Activity,
  Plus,
  Target,
  Zap
} from 'lucide-react';
import { Button, Badge } from '../components/ui/Primitives';
import { getFaviconUrl } from '../lib/utils';

export default function DashboardPage() {
  const { companies, lists, savedSearches, thesis } = useApp();
  const { user } = useAuth();

  // Calculate some stats
  const totalCompanies = companies.length;
  const enrichedCompanies = companies.filter(c => c.enrichment).length;
  const newSignals = 24; // Mock data for "New Signals"
  
  // Get recent companies
  const recentCompanies = companies.slice(0, 5);

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
            {/* Mock Signals for the demo look */}
            <SignalItem 
                name="NeuralPath" 
                action="Raised $12M Series A" 
                source="TechCrunch"
                time="2h ago" 
                dotColor="bg-indigo-500"
                score={92}
            />
            <SignalItem 
                name="EcoSynth" 
                action="Hired VP of Engineering from Google" 
                source="LinkedIn"
                time="5h ago" 
                dotColor="bg-emerald-500"
                score={88}
            />
            <SignalItem 
                name="MediFlow" 
                action="Released v2.0 with Agentic Workflow" 
                source="Product Hunt"
                time="1d ago" 
                dotColor="bg-blue-500"
                score={85}
            />
            <SignalItem 
                name="QuantumLeap" 
                action="Mentioned in 'Top AI Startups 2026'" 
                source="Substack"
                time="2d ago" 
                dotColor="bg-purple-500"
                score={79}
            />
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
                    <div key={search.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <ListIcon size={14} />
                            </div>
                            <span className="font-medium text-sm text-neutral-900 dark:text-white truncate max-w-[120px]">{search.name}</span>
                        </div>
                        <ArrowRight size={14} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
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

const SignalItem = ({ name, action, time, dotColor, source, score }: { name: string, action: string, time: string, dotColor: string, source: string, score: number }) => {
    return (
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
