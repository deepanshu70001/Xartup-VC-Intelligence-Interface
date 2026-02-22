import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Primitives';
import { ArrowRight, Bot, Zap, Shield, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { SiteFooter } from '../components/SiteFooter';

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setSystemPrefersDark(media.matches);
    apply();

    const listener = () => apply();
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (theme === 'system') return systemPrefersDark ? 'dark' : 'light';
    return theme;
  }, [theme, systemPrefersDark]);

  const dashboardPreviewSrc =
    resolvedTheme === 'dark' ? '/landing-dashboard-dark.png' : '/landing-dashboard-light.png';

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-indigo-500/30 ambient-shell">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <BrandLogo />
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">Log In</Button>
            </Link>
            <Link to="/register">
              <Button className="px-3 sm:px-4">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6 border border-indigo-100 dark:border-indigo-800">
              <SparklesIcon className="w-4 h-4 mr-2" />
              The Intelligence Engine for Modern VCs
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 dark:text-white mb-8">
              Precision AI Scout <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                for Your Thesis
              </span>
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Discover, enrich, and track high-growth companies with an AI-powered platform and built-in Scout chatbot for thesis-driven investors.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="h-12 px-8 text-lg">
                  Start Scouting <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="h-12 px-8 text-lg bg-white dark:bg-neutral-900">
                  Try Scout Chat
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Image / UI Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-50 dark:from-neutral-950 to-transparent z-10 h-40 bottom-0 w-full" />
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden bg-white dark:bg-neutral-900 surface-pop gradient-aura">
              <div className="h-12 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="ml-4 flex-1 max-w-lg mx-auto bg-white dark:bg-neutral-900 h-8 rounded-md border border-neutral-200 dark:border-neutral-700 flex items-center px-3 text-xs text-neutral-400">
                  flowstack.ai/dashboard
                </div>
              </div>
              <div className="p-2">
                 <img 
                    src={dashboardPreviewSrc}
                    alt="Dashboard Preview" 
                    className="w-full h-auto rounded-lg"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/landing-dashboard.png';
                    }}
                  />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">Built for the Modern Deal Flow</h2>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Stop relying on static databases. Get live, AI-enriched intelligence that adapts to your investment thesis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Target className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
              title="Thesis-Driven Search"
              description="Define your focus sectors, stages, and geography. Our AI scores every company against your specific investment criteria."
            />
            <FeatureCard
              icon={<Bot className="w-8 h-8 text-violet-600 dark:text-violet-400" />}
              title="Scout Assistant Chatbot"
              description="Ask Scout to rank companies, explain thesis fit, and produce diligence plans from your selected context list."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-amber-500" />}
              title="Live Enrichment"
              description="Instantly pull fresh data from company websites, news sources, and social signals. No more stale CSV exports."
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-emerald-500" />}
              title="Private & Secure"
              description="Your thesis and deal flow are your alpha. We ensure enterprise-grade security and data isolation for your fund."
            />
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">Built Around Real Investor Workflow</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-3 max-w-3xl">
              Move from discovery to conviction in a single loop: discover companies, open profile, enrich live from the web, ask Scout chatbot, then take action.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StepCard index="01" title="Discover" description="Search + filter companies with fast, thesis-aligned controls." />
            <StepCard index="02" title="Open Profile" description="Review overview, timeline, and live context in one page." />
            <StepCard index="03" title="Enrich" description="Run AI scrape to extract structured intelligence from public pages." />
            <StepCard index="04" title="Ask Scout" description="Chat for ranking, prioritization, and diligence guidance." />
            <StepCard index="05" title="Take Action" description="Save to list, add notes, follow, and export in seconds." />
          </div>
        </div>
      </section>

      {/* Enrichment Details */}
      <section className="py-20 px-6 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">What Live Enrichment Returns</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mt-3">
                Every enrichment run turns messy public web content into an analyst-ready output you can act on.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-6 space-y-3">
              <EnrichmentItem label="Summary" value="1-2 sentence concise overview" />
              <EnrichmentItem label="What They Do" value="3-6 bullet points" />
              <EnrichmentItem label="Keywords" value="5-10 high-signal terms" />
              <EnrichmentItem label="Derived Signals" value="2-4 inferred business signals" />
              <EnrichmentItem label="Sources" value="Exact scraped URLs + timestamp" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center bg-indigo-600 dark:bg-indigo-900/30 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to upgrade your intelligence?</h2>
            <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
              Join forward-thinking VCs using FlowStack to spot the next unicorn before the rest of the market.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 border-none h-12 px-8">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors">
      <div className="mb-6 bg-white dark:bg-neutral-900 w-16 h-16 rounded-xl flex items-center justify-center shadow-sm border border-neutral-100 dark:border-neutral-800">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{title}</h3>
      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z" clipRule="evenodd" />
    </svg>
  );
}

function StepCard({ index, title, description }: { index: string; title: string; description: string }) {
  return (
    <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide font-semibold text-indigo-600 dark:text-indigo-400">{index}</div>
      <h4 className="mt-1 text-base font-semibold text-neutral-900 dark:text-white">{title}</h4>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
  );
}

function EnrichmentItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-neutral-200 dark:border-neutral-800 last:border-0">
      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</span>
      <span className="text-xs text-neutral-500 dark:text-neutral-400">{value}</span>
    </div>
  );
}
