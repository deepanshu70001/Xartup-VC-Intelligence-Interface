import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button, Badge } from '../components/ui/Primitives';
import { 
  ArrowLeft, 
  Globe, 
  MapPin, 
  Users, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  MoreHorizontal,
  Check,
  FileText,
  Zap,
  Share2,
  Download,
  Heart
} from 'lucide-react';
import { getFaviconUrl } from '../lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function CompanyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companies, enrichCompany, lists, addCompanyToList, updateCompanyNote, toggleFavorite } = useApp();
  const [isEnriching, setIsEnriching] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [notes, setNotes] = useState('');
  const listMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const company = companies.find(c => c.id === id);
  const isFollowing = !!company?.isFavorite;

  if (!company) {
    return <div className="p-8 text-center">Company not found</div>;
  }

  useEffect(() => {
    setNotes(company.notes || '');
  }, [company.id, company.notes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (listMenuRef.current && !listMenuRef.current.contains(target)) {
        setShowListMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleEnrich = async () => {
    setIsEnriching(true);
    try {
      await enrichCompany(company.id);
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
      url: window.location.href
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
      exportedAt: new Date().toISOString()
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

  // Mock data for the design
  const proprietaryScore = 88;
  const momentum = 'High';
  const addedToFlowStackDate = (() => {
    if (!company.createdAt) return 'Unknown date';
    const parsed = new Date(company.createdAt);
    return Number.isNaN(parsed.getTime()) ? 'Unknown date' : parsed.toLocaleDateString();
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={() => navigate('/companies')} className="pl-0 hover:pl-0 hover:bg-transparent text-neutral-500 hover:text-neutral-900">
          <ArrowLeft size={16} className="mr-2" /> Back to Search
        </Button>
        <div className="flex items-center gap-2">
            <div className="relative" ref={listMenuRef}>
              <Button variant="outline" className="bg-white" onClick={() => setShowListMenu(!showListMenu)}>
                {lists.find(l => l.companyIds.includes(company.id)) ? 'Saved' : 'Save to List'}
              </Button>
              
              {showListMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-20 py-1">
                  <div className="px-3 py-2 text-xs font-medium text-neutral-500 uppercase">Select List</div>
                  {lists.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-neutral-400 italic">No lists created</div>
                  ) : (
                    lists.map(list => (
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
                  <div className="border-t border-neutral-100 mt-1 pt-1">
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium"
                      onClick={() => navigate('/lists')}
                    >
                      + Create New List
                    </button>
                  </div>
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
                    onClick={() => {
                      window.open(`https://${company.domain}`, '_blank', 'noopener,noreferrer');
                      setShowMoreMenu(false);
                    }}
                  >
                    Open company website
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-neutral-900 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                    onClick={() => {
                      navigate('/companies');
                      setShowMoreMenu(false);
                    }}
                  >
                    Back to companies
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
          <Button variant="outline" onClick={() => setShowListMenu((v) => !v)}>
            Save
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
          <div className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
            Workflow: discover | profile | enrich | action
          </div>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-8">
          <div className="flex flex-col sm:flex-row gap-6 flex-1">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <img 
                src={company.logo_url || getFaviconUrl(company.domain)} 
                alt={company.name} 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-neutral-100 dark:border-neutral-800 object-contain bg-white p-2 shadow-sm"
                onError={(e) => { (e.target as HTMLImageElement).src = getFaviconUrl(company.domain) }}
              />
            </div>
            <div className="space-y-4 flex-1 text-center sm:text-left">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white mb-2">{company.name}</h1>
                <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto sm:mx-0">
                    {company.description}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
                <a href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                  <Globe size={14} className="mr-1.5" /> {company.domain}
                </a>
                <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm font-medium">
                  <MapPin size={14} className="mr-1.5" /> {company.location}
                </div>
                <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm font-medium">
                  <Users size={14} className="mr-1.5" /> {company.employee_count}
                </div>
                <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm font-medium">
                  <Calendar size={14} className="mr-1.5" /> {company.founded_year}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 justify-center sm:justify-start">
                 <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs sm:text-sm font-semibold">
                  <DollarSign size={14} className="mr-1 text-neutral-500" /> {company.total_funding || 'Undisclosed'} ({company.stage})
                </div>
                {company.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                        {tag}
                    </span>
                ))}
              </div>
            </div>
          </div>

          {/* Proprietary Score Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 min-w-[280px] flex flex-col items-center justify-center shadow-sm mx-auto sm:mx-0 w-full sm:w-auto">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Proprietary Score</h3>
            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-neutral-100 dark:text-neutral-800"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={351.86}
                        strokeDashoffset={351.86 * (1 - proprietaryScore / 100)}
                        className="text-emerald-500"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-neutral-900 dark:text-white">{proprietaryScore}</span>
                    <span className="text-xs text-neutral-400">/ 100</span>
                </div>
            </div>
            <div className="w-full mt-6">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-500">Momentum</span>
                    <span className="text-emerald-600 font-medium">{momentum}</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-3/4 rounded-full"></div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Intelligence */}
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <Zap className="text-indigo-600 dark:text-indigo-400" size={20} />
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Live Intelligence</h2>
                </div>
                <Button 
                    variant="primary" 
                    onClick={handleEnrich} 
                    isLoading={isEnriching} 
                    disabled={isEnriching}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                >
                    <Sparkles size={16} className="mr-2" /> 
                    {company.enrichment ? 'Re-Enrich' : 'Enrich Data'}
                </Button>
            </div>
            
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6">
                Use our AI agent to scan the company's public footprint for recent signals, news, and team changes.
            </p>

            {company.enrichment ? (
                <div className="space-y-4 bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                        <div>
                            <span className="text-xs font-semibold text-neutral-500 uppercase block mb-1">Summary</span>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                {company.enrichment.summary}
                            </p>
                        </div>
                    </div>
                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                         <span className="text-xs font-semibold text-neutral-500 uppercase block mb-2">What they do</span>
                         <ul className="space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300 list-disc pl-5">
                            {(company.enrichment.what_they_do || []).slice(0, 6).map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                         </ul>
                    </div>
                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                         <span className="text-xs font-semibold text-neutral-500 uppercase block mb-2">Keywords</span>
                         <div className="flex flex-wrap gap-2">
                            {(company.enrichment.keywords || []).slice(0, 10).map((keyword, i) => (
                                <Badge key={i} variant="neutral">{keyword}</Badge>
                            ))}
                         </div>
                    </div>
                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                         <span className="text-xs font-semibold text-neutral-500 uppercase block mb-2">Signals</span>
                         <div className="flex flex-wrap gap-2">
                            {company.enrichment.derived_signals.map((signal, i) => (
                                <Badge key={i} variant="indigo" className="bg-indigo-50 text-indigo-700 border-indigo-100">{signal}</Badge>
                            ))}
                         </div>
                    </div>
                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                         <span className="text-xs font-semibold text-neutral-500 uppercase block mb-2">Sources</span>
                         <div className="space-y-1.5">
                            {(company.enrichment.sources || (company.enrichment.source ? [company.enrichment.source] : [])).map((src, i) => (
                              <a
                                key={i}
                                href={src}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-xs text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                              >
                                {src}
                              </a>
                            ))}
                            <div className="text-[11px] text-neutral-400">
                              Updated {new Date(company.enrichment.timestamp).toLocaleString()}
                            </div>
                         </div>
                    </div>
                </div>
            ) : (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 rounded-xl bg-white/50 dark:bg-neutral-900/50">
                    <span className="text-sm text-neutral-400">No live data available. Click Enrich to start.</span>
                </div>
            )}
        </div>

        {/* Investment Thesis */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <FileText className="text-neutral-900 dark:text-white" size={20} />
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Investment Thesis</h2>
            </div>
            
            <div className="flex-1 relative">
                <textarea 
                    className="w-full h-full min-h-[160px] p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl text-neutral-700 dark:text-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none placeholder:text-neutral-400"
                    placeholder="Add your notes or thesis here..."
                    value={notes}
                    onChange={handleSaveNotes}
                />
            </div>
        </div>
      </div>

      {/* Signal Timeline */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Signal Timeline</h2>
        <div className="relative pl-4 border-l-2 border-neutral-100 dark:border-neutral-800 space-y-8">
            {/* Mock Timeline Items */}
            <TimelineItem 
                date="2 days ago"
                title="New Product Launch"
                description="Released version 2.0 of their core reasoning engine with improved latency."
                type="product"
            />
            <TimelineItem 
                date="1 week ago"
                title="Key Hire: VP of Engineering"
                description="Sarah Chen (ex-Google) joined as VP of Engineering."
                type="team"
            />
            <TimelineItem 
                date="1 month ago"
                title="Series A Funding"
                description={`Raised ${company.total_funding || '$12M'} Series A led by Sequoia.`}
                type="funding"
            />
             <TimelineItem 
                date={addedToFlowStackDate}
                title="Added to FlowStack"
                description="Company tracked in dashboard."
                type="system"
            />
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ date, title, description, type }: { date: string, title: string, description: string, type: 'funding' | 'team' | 'product' | 'system' }) {
    const getIcon = () => {
        switch(type) {
            case 'funding': return <DollarSign size={14} className="text-green-600" />;
            case 'team': return <Users size={14} className="text-blue-600" />;
            case 'product': return <Zap size={14} className="text-amber-600" />;
            default: return <Check size={14} className="text-neutral-600" />;
        }
    };

    const getBg = () => {
         switch(type) {
            case 'funding': return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
            case 'team': return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
            case 'product': return 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
            default: return 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
        }
    }

    return (
        <div className="relative">
            <div className={`absolute -left-[25px] top-0 w-8 h-8 rounded-full border-4 border-white dark:border-neutral-900 flex items-center justify-center ${getBg()}`}>
                {getIcon()}
            </div>
            <div className="pl-2">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
                    <span className="text-xs text-neutral-400">• {date}</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
            </div>
        </div>
    )
}
