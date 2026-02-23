import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Gauge,
  Layers,
  Lock,
  Newspaper,
  Radar,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Primitives';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { SiteFooter } from '../components/SiteFooter';

const reveal = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const kpis = [
  { value: '10x', label: 'faster initial screening' },
  { value: '< 2 min', label: 'to generate an analyst brief' },
  { value: 'Live', label: 'signal ingestion from the web' },
  { value: 'Secure', label: 'session + account controls' },
];

const moduleDetails = [
  {
    icon: <Radar size={18} strokeWidth={2.2} />,
    title: 'Discovery Workspace',
    text: 'Filter by stage, sector, geography, and thesis-aligned keywords with saved workflows.',
    bullets: ['Fast search and segmenting', 'List-based pipeline actions', 'Portfolio-aware context'],
  },
  {
    icon: <Sparkles size={18} strokeWidth={2.2} />,
    title: 'Live Enrichment Engine',
    text: 'Turn company websites into structured facts, summaries, and derived diligence signals.',
    bullets: ['Key facts normalization', 'Source-aware confidence scoring', 'Signal timeline generation'],
  },
  {
    icon: <SendHorizontal size={18} strokeWidth={2.2} />,
    title: 'Scout Assistant',
    text: 'Ask for ranking logic, diligence plans, and thesis-fit interpretation in plain language.',
    bullets: ['Conversation over your context', 'Clear rationale-first outputs', 'Action-ready recommendations'],
  },
  {
    icon: <Layers size={18} strokeWidth={2.2} />,
    title: 'Execution Layer',
    text: 'Move from insight to action: notes, follow status, exports, and workflow history in one place.',
    bullets: ['Saved searches and watchlists', 'Team-readable audit trail', 'Portable briefing exports'],
  },
];

const faqs = [
  {
    q: 'How is this different from a generic CRM?',
    a: 'The system is thesis-first. Every score, signal, and recommendation is weighted around your investment criteria.',
  },
  {
    q: 'Can we use it across multiple devices?',
    a: 'Yes. App state sync is account-based, so your companies, lists, and notes stay consistent across laptop and phone.',
  },
  {
    q: 'Is this only for late-stage teams?',
    a: 'No. It is designed for seed through growth investors who want faster sourcing and clearer conviction tracking.',
  },
];

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

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none landing-grid opacity-20"></div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white">
                Log In
              </Button>
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
            <div className="relative min-h-[620px] lg:min-h-[700px]">
              <div className="absolute inset-0 bg-[url('/landing-dashboard.png')] bg-cover bg-center scale-[1.03]"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/78 to-neutral-900/50"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent"></div>
              <motion.div
                className="absolute top-20 right-8 lg:right-12 w-52 h-52 rounded-full bg-cyan-400/10 blur-3xl"
                animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute bottom-14 right-20 lg:right-28 w-40 h-40 rounded-full bg-emerald-400/10 blur-2xl"
                animate={{ y: [0, 10, 0], x: [0, -8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              />

              <motion.div
                initial="hidden"
                animate="show"
                variants={stagger}
                className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-3xl"
              >
                <motion.div variants={reveal} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/75 border border-neutral-600 text-neutral-200 text-xs tracking-wide uppercase">
                  <Gauge size={14} /> Thesis Intelligence Platform
                </motion.div>
                <motion.h1 variants={reveal} className="mt-6 text-4xl sm:text-5xl lg:text-7xl font-semibold leading-[1.03] text-white">
                  See More Signals.
                  <span className="block text-neutral-300">Move With More Conviction.</span>
                </motion.h1>
                <motion.p variants={reveal} className="mt-6 text-neutral-200 text-base sm:text-lg max-w-2xl">
                  Harmonic VC Discovery is a sourcing command center for modern investment teams: discover targets,
                  enrich intelligence, score opportunities, and execute decisions with a traceable workflow.
                </motion.p>
                <motion.div variants={reveal} className="mt-8 flex flex-wrap gap-3">
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
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {kpis.map((kpi) => (
              <motion.div key={kpi.label} variants={reveal} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
                <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white">{kpi.value}</div>
                <div className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">{kpi.label}</div>
              </motion.div>
            ))}
          </motion.div>
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
            className="lg:col-span-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-7 sm:p-9 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-300 font-semibold">Operating Model</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">Designed For Weekly Sourcing Cadence</h2>
            <p className="mt-4 text-neutral-600 dark:text-neutral-300">
              Keep your team aligned with a continuous loop: filter targets, pull external context, score fit, then convert decisions into pipeline actions.
            </p>
            <div className="mt-6 space-y-3">
              <StepChip icon={<Compass size={15} />} title="Discover" text="Create focused cohorts by thesis and stage." />
              <StepChip icon={<Sparkles size={15} />} title="Enrich" text="Generate analyst-ready company context instantly." />
              <StepChip icon={<Target size={15} />} title="Decide" text="Rank conviction and route into execution lists." />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="lg:col-span-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-sm"
          >
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50 dark:bg-neutral-950">
              <img src={dashboardPreviewSrc} alt="Platform preview" className="w-full h-auto object-cover" />
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <CheckCircle2 size={16} className="text-emerald-600" /> Responsive, thesis-aware interface across desktop and mobile.
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
            <h3 className="mt-2 text-3xl sm:text-4xl font-semibold">Built For End-To-End Investment Workflows</h3>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {moduleDetails.map((item) => (
              <motion.div key={item.title} variants={reveal}>
                <DetailCard {...item} />
              </motion.div>
            ))}
          </motion.div>
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
              <PulseTile icon={<TrendingUp size={16} strokeWidth={2.2} />} title="Funding Alerts" text="Track the newest financing activity." />
              <PulseTile icon={<Newspaper size={16} strokeWidth={2.2} />} title="Product Signals" text="Detect launches and roadmap hints." />
              <PulseTile icon={<ShieldCheck size={16} strokeWidth={2.2} />} title="Team Changes" text="Capture hiring and org momentum." />
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
            <p className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-300 font-semibold">Trust & Governance</p>
            <div className="mt-4 space-y-3 text-sm">
              <TrustRow icon={<Lock size={15} />} text="Session-based auth with secured routes" />
              <TrustRow icon={<CheckCircle2 size={15} />} text="Password checks for destructive actions" />
              <TrustRow icon={<Gauge size={15} />} text="Unified scoring logic across dashboard and profiles" />
              <TrustRow icon={<Layers size={15} />} text="Cross-device app-state synchronization" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            className="lg:col-span-7 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-7 sm:p-9"
          >
            <p className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-300 font-semibold">FAQ</p>
            <h3 className="mt-2 text-3xl sm:text-4xl font-semibold">Questions From Investment Teams</h3>
            <div className="mt-6 space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
                  <div className="font-semibold text-neutral-900 dark:text-white">{faq.q}</div>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={{ delay: 0.08 }}
            className="lg:col-span-5 rounded-3xl bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 p-8 sm:p-10 relative overflow-hidden"
          >
            <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-white/20 blur-2xl"></div>
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-wider font-semibold">Ready For Deployment</p>
              <h3 className="mt-3 text-3xl sm:text-4xl font-semibold leading-tight">Turn Weekly Deal Reviews Into High-Signal Decisions</h3>
              <p className="mt-4 text-base text-neutral-700 dark:text-neutral-300">
                Start with your thesis, centralize scouting operations, and ship conviction faster with a single operating system.
              </p>
              <div className="mt-7 flex gap-3 flex-wrap">
                <Link to="/register">
                  <Button size="lg" className="h-12 px-8">
                    Create Account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="h-12 px-8">
                    Explore Demo
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

function DetailCard({
  icon,
  title,
  text,
  bullets,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  bullets: string[];
}) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 h-full">
      <div className="w-10 h-10 rounded-xl border border-sky-200/80 dark:border-sky-800/50 text-sky-700 dark:text-sky-300 bg-gradient-to-br from-sky-50 to-cyan-100 dark:from-sky-900/30 dark:to-cyan-900/20 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <h4 className="mt-4 text-lg font-semibold">{title}</h4>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{text}</p>
      <div className="mt-4 space-y-2">
        {bullets.map((bullet) => (
          <div key={bullet} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>{bullet}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function StepChip({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-white">
        {icon}
        <span>{title}</span>
      </div>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{text}</p>
    </div>
  );
}

function PulseTile({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="w-8 h-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center justify-center">{icon}</div>
      <div className="mt-3 text-white font-medium">{title}</div>
      <p className="mt-1 text-sm text-neutral-300">{text}</p>
    </div>
  );
}

function TrustRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
      <span className="text-sky-600 dark:text-sky-300">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
