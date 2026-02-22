import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Radar, Sparkles, TrendingUp, ShieldCheck, Newspaper, Layers, Gauge } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Primitives';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { SiteFooter } from '../components/SiteFooter';

const reveal = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setSystemPrefersDark(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (theme === 'system') return systemPrefersDark ? 'dark' : 'light';
    return theme;
  }, [theme, systemPrefersDark]);

  const dashboardPreviewSrc =
    resolvedTheme === 'dark' ? '/landing-dashboard-dark.png' : '/landing-dashboard-light.png';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none landing-grid opacity-25"></div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white">Log In</Button>
            </Link>
            <Link to="/register">
              <Button className="font-semibold">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xl bg-neutral-900">
            <div className="relative min-h-[540px] lg:min-h-[620px]">
              <div className="absolute inset-0 bg-[url('/landing-dashboard.png')] bg-cover bg-center scale-[1.03]"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/74 to-neutral-900/40"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent"></div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={reveal}
                transition={{ duration: 0.8 }}
                className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-3xl"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/70 border border-neutral-600 text-neutral-200 text-xs tracking-wide uppercase">
                  <Gauge size={14} /> Thesis Intelligence Platform
                </div>
                <h1 className="mt-6 text-4xl sm:text-5xl lg:text-7xl font-semibold leading-[1.03] text-white">
                  Built To Move
                  <span className="block text-neutral-300">Conviction Faster</span>
                </h1>
                <p className="mt-6 text-neutral-200 text-base sm:text-lg max-w-2xl">
                  A scouting command center inspired by high-performance product design: discover targets, enrich signals, and act with structured momentum.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/register">
                    <Button size="lg" className="h-12 px-7 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold">
                      Launch Platform <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="h-12 px-7 border-neutral-500 text-neutral-100 bg-neutral-900/40">
                      View Demo Flow
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-7 sm:p-9 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-300 font-semibold">Platform Core</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">Engineered Around Your Investment Thesis</h2>
            <p className="mt-4 text-neutral-600 dark:text-neutral-300">
              Define thesis boundaries once, then score every company, enrichment signal, and chat recommendation against it.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="lg:col-span-7 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-7 sm:p-9 shadow-sm"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <MetricCard value="10x" label="faster first-pass screening" />
              <MetricCard value="Live" label="web intelligence collection" />
              <MetricCard value="1 Loop" label="discover > enrich > act" />
              <MetricCard value="Secure" label="cookie-based private sessions" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={{ duration: 0.65 }}
            className="mb-8"
          >
            <p className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-300 font-semibold">System Modules</p>
            <h3 className="mt-2 text-3xl sm:text-4xl font-semibold">A Layout Built Like a Command Vehicle</h3>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <FlowCard icon={<Radar size={18} />} title="Discovery Grid" text="Search and filter companies with thesis-aware controls." />
            <FlowCard icon={<Sparkles size={18} />} title="Live Enrichment" text="Convert websites into structured analyst-ready outputs." />
            <FlowCard icon={<Bot size={18} />} title="Scout Assistant" text="Ask for rankings, diligence plans, and signal interpretation." />
            <FlowCard icon={<Layers size={18} />} title="Action Layer" text="Save to lists, annotate notes, follow, and export briefs." />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={{ duration: 0.7 }}
            className="lg:col-span-8 rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-950"
          >
            <div className="p-6 sm:p-8 border-b border-neutral-800 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-300 font-semibold">Live Monitoring</p>
                <h4 className="mt-1 text-2xl font-semibold text-white">Signals In Motion</h4>
              </div>
            <span className="text-xs px-3 py-1 rounded-full border border-neutral-500 bg-neutral-800 text-neutral-200">Realtime Feed</span>
            </div>
            <div className="p-6 sm:p-8 grid sm:grid-cols-3 gap-4">
              <PulseTile icon={<TrendingUp size={16} />} title="Funding Alerts" text="Track the newest financing activity." />
              <PulseTile icon={<Newspaper size={16} />} title="Product Signals" text="Detect launches and roadmap hints." />
              <PulseTile icon={<ShieldCheck size={16} />} title="Team Changes" text="Capture hiring and org momentum." />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8"
          >
            <p className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-300 font-semibold">Investor Workflow</p>
            <ol className="mt-4 space-y-3 text-sm">
              <li className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">1. Discover companies</li>
              <li className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">2. Open profile context</li>
              <li className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">3. Enrich from web</li>
              <li className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">4. Ask Scout for ranking</li>
              <li className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">5. Save and execute actions</li>
            </ol>
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={{ duration: 0.7 }}
            className="rounded-3xl bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 p-8 sm:p-12 relative overflow-hidden"
          >
            <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-white/20 blur-2xl"></div>
            <div className="relative z-10 max-w-3xl">
              <p className="text-xs uppercase tracking-wider font-semibold">Ready For Deployment</p>
              <h3 className="mt-3 text-3xl sm:text-5xl font-semibold leading-tight">Make Every Week a High-Signal Sourcing Sprint</h3>
              <p className="mt-4 text-base sm:text-lg text-neutral-700 dark:text-neutral-300">
                Start with your thesis, let the system surface momentum, and direct your team with structured intelligence.
              </p>
              <div className="mt-8">
                <Link to="/register">
                  <Button size="lg" className="h-12 px-8">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 bg-neutral-50 dark:bg-neutral-950">
      <div className="text-2xl font-semibold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{label}</div>
    </div>
  );
}

function FlowCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6"
    >
      <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center">
        {icon}
      </div>
      <h4 className="mt-4 text-lg font-semibold">{title}</h4>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{text}</p>
    </motion.div>
  );
}

function PulseTile({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-200 flex items-center justify-center">{icon}</div>
      <div className="mt-3 text-white font-medium">{title}</div>
      <p className="mt-1 text-sm text-neutral-300">{text}</p>
    </div>
  );
}
