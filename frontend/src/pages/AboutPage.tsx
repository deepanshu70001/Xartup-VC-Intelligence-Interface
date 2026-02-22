import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { SiteFooter } from '../components/SiteFooter';
import { Button } from '../components/ui/Primitives';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo />
          <Link to="/landing">
            <Button variant="outline" size="sm">Back</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">About FlowStack</h1>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
          FlowStack is a thesis-driven VC intelligence platform that helps investors discover,
          organize, and enrich company data in one workspace. We focus on actionable signal
          quality, clear workflows, and fast decision support for modern investment teams.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          <InfoCard title="What We Build" value="AI-assisted deal flow operating system" />
          <InfoCard title="Who We Serve" value="VC funds, scouts, and research teams" />
          <InfoCard title="HQ" value="San Francisco, California" />
        </div>
      </main>

      <SiteFooter compact />
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
      <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{title}</div>
      <div className="mt-2 font-semibold text-neutral-900 dark:text-white">{value}</div>
    </div>
  );
}
