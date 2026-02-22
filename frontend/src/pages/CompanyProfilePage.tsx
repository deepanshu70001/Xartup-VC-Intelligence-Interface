import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Check,
  DollarSign,
  Download,
  Globe,
  Heart,
  MapPin,
  MoreHorizontal,
  Share2,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Badge } from '../components/ui/Primitives';
import { useApp } from '../context/AppContext';
import { getFaviconUrl } from '../lib/utils';
import { fetchLiveFeedForCompanies, type LiveNewsItem } from '../lib/liveFeed';
import { getEvaluationScore } from '../lib/evaluation';

interface TimelineEvent {
  id: string;
  dateLabel: string;
  title: string;
  description: string;
  type: 'funding' | 'team' | 'product' | 'system';
  link?: string;
}

export default function CompanyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companies, thesis, enrichCompany, lists, addCompanyToList, updateCompanyNote, toggleFavorite } = useApp();

  const [isEnriching, setIsEnriching] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [notes, setNotes] = useState('');
  const [liveItems, setLiveItems] = useState<LiveNewsItem[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const listMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const company = companies.find((c) => c.id === id);
  if (!company) {
    return <div className="p-8 text-center">Company not found</div>;
  }

  const companyTags = Array.isArray(company.tags) ? company.tags : [];
  const isFollowing = !!company?.isFavorite;

  const fetchLiveSignals = useCallback(async () => {
    setIsLiveLoading(true);
    setLiveError(null);
    try {
      const items = await fetchLiveFeedForCompanies([company.name], { perCompany: 3, limit: 8 });
      setLiveItems(items.filter((item) => item.company.toLowerCase() === company.name.toLowerCase()));
    } catch (error: any) {
      setLiveError(error.message || 'Failed to load live feed');
    } finally {
      setIsLiveLoading(false);
    }
  }, [company.name]);

  useEffect(() => {
    setNotes(company.notes || '');
  }, [company.id, company.notes]);

  useEffect(() => {
    fetchLiveSignals();
  }, [fetchLiveSignals]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (listMenuRef.current && !listMenuRef.current.contains(target)) setShowListMenu(false);
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) setShowMoreMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEnrich = async () => {
    setIsEnriching(true);
    try {
      await enrichCompany(company.id);
      await fetchLiveSignals();
      toast.success('Live data refreshed');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSaveNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextNote = e.target.value;
    setNotes(nextNote);
    updateCompanyNote(company.id, nextNote);
  };

  const handleShare = async () => {
    const shareData = {
      title: `${company.name} - Company Profile`,
      text: `Check out ${company.name} on FlowStack`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied to clipboard');
    } catch {
      toast.error('Unable to share link');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied');
      setShowMoreMenu(false);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleExportBrief = () => {
    const payload = {
      name: company.name,
      domain: company.domain,
      industry: company.industry,
      stage: company.stage,
      location: company.location,
      employee_count: company.employee_count,
      total_funding: company.total_funding,
      description: company.description,
      notes: company.notes || notes || '',
      enrichment: company.enrichment || null,
      liveFeed: liveItems,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${company.name.toLowerCase().replace(/\s+/g, '_')}_brief.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Company brief exported');
  };

  const evaluationScore = useMemo(() => {
    return getEvaluationScore(company, thesis, liveItems);
  }, [company, liveItems, thesis]);

  const momentum = useMemo(() => {
    const now = Date.now();
    const recentCount = liveItems.filter(
      (item) => now - new Date(item.publishedAt).getTime() < 1000 * 60 * 60 * 24 * 7
    ).length;
    if (recentCount >= 4) return 'High';
    if (recentCount >= 2) return 'Medium';
    return 'Low';
  }, [liveItems]);

  const addedToFlowStackDate = useMemo(() => {
    if (!company.createdAt) return 'Unknown date';
    const parsed = new Date(company.createdAt);
    return Number.isNaN(parsed.getTime()) ? 'Unknown date' : parsed.toLocaleDateString();
  }, [company.createdAt]);

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    if (company.enrichment?.derived_signals?.length) {
      company.enrichment.derived_signals.slice(0, 4).forEach((signal, index) => {
        events.push({
          id: `derived-${index}`,
          dateLabel: company.enrichment?.timestamp
            ? new Date(company.enrichment.timestamp).toLocaleDateString()
            : 'Recently',
          title: signal,
          description: company.enrichment?.summary || 'Derived from latest enrichment analysis.',
          type: 'product',
        });
      });
    }

    liveItems.slice(0, 6).forEach((item) => {
      events.push({
        id: item.id,
        dateLabel: new Date(item.publishedAt).toLocaleDateString(),
        title: item.title,
        description: `${item.source} reported this update.`,
        type: 'team',
        link: item.url,
      });
    });

    events.push({
      id: 'created',
      dateLabel: addedToFlowStackDate,
      title: 'Added to FlowStack',
      description: 'Company tracked in dashboard.',
      type: 'system',
    });

    return events;
  }, [company.enrichment, liveItems, addedToFlowStackDate]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/companies')}
          className="pl-0 hover:pl-0 hover:bg-transparent text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Search
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative" ref={listMenuRef}>
            <Button variant="outline" className="bg-white" onClick={() => setShowListMenu(!showListMenu)}>
              {lists.find((l) => l.companyIds.includes(company.id)) ? 'Saved' : 'Save to List'}
            </Button>
            {showListMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-20 py-1">
                <div className="px-3 py-2 text-xs font-medium text-neutral-500 uppercase">Select List</div>
                {lists.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-neutral-400 italic">No lists created</div>
                ) : (
                  lists.map((list) => (
                    <button
                      key={list.id}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-900 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex justify-between items-center"
                      onClick={() => {
                        addCompanyToList(list.id, company.id);
                        setShowListMenu(false);
                      }}
                    >
                      {list.name}
                      {list.companyIds.includes(company.id) && <Check size={14} className="text-green-600" />}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare} title="Share">
            <Share2 size={20} className="text-neutral-500" />
          </Button>
          <div className="relative" ref={moreMenuRef}>
            <Button variant="ghost" size="icon" onClick={() => setShowMoreMenu(!showMoreMenu)} title="More actions">
              <MoreHorizontal size={20} className="text-neutral-500" />
            </Button>
            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-20 py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-neutral-900 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  onClick={handleCopyLink}
                >
                  Copy profile link
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-neutral-900 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  onClick={() => window.open(`https://${company.domain}`, '_blank', 'noopener,noreferrer')}
                >
                  Open company website
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={handleEnrich} isLoading={isEnriching} disabled={isEnriching}>
            <Sparkles size={16} className="mr-2" /> {company.enrichment ? 'Re-Enrich' : 'Enrich'}
          </Button>
          <Button
            variant={isFollowing ? 'danger' : 'secondary'}
            onClick={() => {
              toggleFavorite(company.id);
              toast.success(isFollowing ? 'Unfollowed company' : 'Following company');
            }}
          >
            <Heart size={16} className="mr-2" fill={isFollowing ? 'currentColor' : 'none'} />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <Button variant="secondary" onClick={handleExportBrief}>
            <Download size={16} className="mr-2" /> Export Brief
          </Button>
          <div className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">Workflow: discover | profile | enrich | action</div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between gap-8">
          <div className="flex gap-6 flex-1">
            <img
              src={company.logo_url || getFaviconUrl(company.domain)}
              alt={company.name}
              className="w-20 h-20 rounded-xl border border-neutral-100 object-contain bg-white p-2 shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getFaviconUrl(company.domain);
              }}
            />
            <div className="space-y-4 flex-1">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{company.name}</h1>
                <p className="text-neutral-600 dark:text-neutral-400">{company.enrichment?.summary || company.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://${company.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-100"
                >
                  <Globe size={14} className="mr-1.5" /> {company.domain}
                </a>
                <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-medium">
                  <MapPin size={14} className="mr-1.5" /> {company.location || 'Unknown'}
                </div>
                <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-medium">
                  <Users size={14} className="mr-1.5" /> {company.employee_count || 'Unknown'}
                </div>
                <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-medium">
                  <Calendar size={14} className="mr-1.5" /> {company.founded_year || 'Unknown'}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-semibold">
                  <DollarSign size={14} className="mr-1 text-neutral-500" /> {company.total_funding || 'Undisclosed'} ({company.stage})
                </div>
                {companyTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 min-w-[260px]">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Evaluation Score</h3>
            <div className="text-4xl font-bold text-neutral-900 dark:text-white">{evaluationScore}/100</div>
            <div className="mt-3 text-sm text-neutral-500">Momentum: <span className="font-semibold text-emerald-600">{momentum}</span></div>
            <div className="mt-4 space-y-2 text-xs text-neutral-500">
              <div>Sources: {company.enrichment?.sources?.length || 0}</div>
              <div>Derived signals: {company.enrichment?.derived_signals?.length || 0}</div>
              <div>News events: {liveItems.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Zap className="text-indigo-600 dark:text-indigo-400" size={20} />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Live Intelligence</h2>
            </div>
            <Button variant="primary" onClick={handleEnrich} isLoading={isEnriching} disabled={isEnriching}>
              <Sparkles size={16} className="mr-2" /> {company.enrichment ? 'Re-Enrich' : 'Enrich'}
            </Button>
          </div>

          {company.enrichment ? (
            <div className="space-y-4 bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
              <div>
                <span className="text-xs font-semibold text-neutral-500 uppercase block mb-1">Summary</span>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{company.enrichment.summary}</p>
              </div>
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <span className="text-xs font-semibold text-neutral-500 uppercase block mb-2">Keywords</span>
                <div className="flex flex-wrap gap-2">
                  {(company.enrichment.keywords || []).slice(0, 12).map((keyword, i) => (
                    <Badge key={i} variant="neutral">{keyword}</Badge>
                  ))}
                </div>
              </div>
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <span className="text-xs font-semibold text-neutral-500 uppercase block mb-2">Derived Signals</span>
                <div className="flex flex-wrap gap-2">
                  {(company.enrichment.derived_signals || []).map((signal, i) => (
                    <Badge key={i} variant="indigo">{signal}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 rounded-xl bg-white/50 dark:bg-neutral-900/50">
              <span className="text-sm text-neutral-400">No enrichment yet. Click Enrich to pull live web intelligence.</span>
            </div>
          )}

          <div className="mt-4 bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Internet News Signals</h4>
              <Button variant="ghost" size="sm" onClick={fetchLiveSignals} disabled={isLiveLoading}>
                {isLiveLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
            {liveError && <p className="text-xs text-red-500 mt-2">{liveError}</p>}
            {!liveError && liveItems.length === 0 && !isLiveLoading && (
              <p className="text-xs text-neutral-500 mt-2">No recent news found for this company.</p>
            )}
            <div className="mt-3 space-y-2">
              {liveItems.slice(0, 4).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">{item.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {item.source} • {new Date(item.publishedAt).toLocaleDateString()}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Investment Thesis Notes</h2>
          <textarea
            className="w-full h-full min-h-[220px] p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl text-neutral-700 dark:text-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none"
            placeholder="Add your notes or thesis here..."
            value={notes}
            onChange={handleSaveNotes}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Signal Timeline (Dynamic)</h2>
        <div className="relative pl-4 border-l-2 border-neutral-100 dark:border-neutral-800 space-y-7">
          {timelineEvents.map((event) => (
            <React.Fragment key={event.id}>
              <TimelineItem
                date={event.dateLabel}
                title={event.title}
                description={event.description}
                type={event.type}
                link={event.link}
              />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  date,
  title,
  description,
  type,
  link,
}: {
  date: string;
  title: string;
  description: string;
  type: 'funding' | 'team' | 'product' | 'system';
  link?: string;
}) {
  const icon = (() => {
    switch (type) {
      case 'funding':
        return <DollarSign size={14} className="text-green-600" />;
      case 'team':
        return <Users size={14} className="text-blue-600" />;
      case 'product':
        return <Zap size={14} className="text-amber-600" />;
      default:
        return <Check size={14} className="text-neutral-600" />;
    }
  })();

  const bg = (() => {
    switch (type) {
      case 'funding':
        return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
      case 'team':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
      case 'product':
        return 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    }
  })();

  return (
    <div className="relative">
      <div className={`absolute -left-[25px] top-0 w-8 h-8 rounded-full border-4 border-white dark:border-neutral-900 flex items-center justify-center ${bg}`}>
        {icon}
      </div>
      <div className="pl-2">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {link ? (
              <a href={link} target="_blank" rel="noreferrer" className="hover:underline">
                {title}
              </a>
            ) : (
              title
            )}
          </h3>
          <span className="text-xs text-neutral-400">• {date}</span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      </div>
    </div>
  );
}
