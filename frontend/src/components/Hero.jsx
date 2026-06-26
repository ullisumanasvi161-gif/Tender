import React from 'react';
import { Play, ClipboardCheck, Sparkles, AlertCircle, FileDown, History, BarChart3, HardHat } from 'lucide-react';

export default function Hero({ onStartGenerating, onViewDemo }) {
  const features = [
    {
      title: 'Smart Tender Analysis',
      desc: 'AI deeply analyzes project details, client requirements, bid scopes, and eligibility criteria to identify critical gaps.',
      icon: Sparkles,
    },
    {
      title: 'Automated Generation',
      desc: 'Instantly builds complete checklists including Technical schedules, Commercial BOQs, Financial guarantees, and Legal credentials.',
      icon: ClipboardCheck,
    },
    {
      title: 'Compliance Validation',
      desc: 'Validates that all statutory and mandatory documents are active, signed, and uploaded before submitting bids to authorities.',
      icon: AlertCircle,
    },
    {
      title: 'Premium Export Utility',
      desc: 'Export generated checklists to professionally structured PDF tables or comprehensive Excel logs with a single click.',
      icon: FileDown,
    },
    {
      title: 'Checklist Archive',
      desc: 'Securely records all historic tender runs, enabling easy retrieval, comparisons, and revisions for recurring clients.',
      icon: History,
    },
    {
      title: 'Analytics Dashboard',
      desc: 'Track global metrics such as submission readiness, generation volume, tender distribution, and staff completion rates.',
      icon: BarChart3,
    },
  ];

  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Background Graphic Accents */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-gold-primary/5 blur-[120px]" />
      
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
        {/* Constructive Hat Icon badge */}
        <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-gold-primary/30 bg-gold-primary/5 px-4 py-1.5 text-xs font-semibold tracking-wider text-gold-primary uppercase shadow-[0_0_15px_rgba(212,175,55,0.08)] animate-pulse">
          <HardHat className="h-4.5 w-4.5 text-gold-secondary" />
          Enterprise Bid Management System
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl max-w-4xl mx-auto leading-tight">
          AI-Powered <span className="text-gold-gradient">Tender Preparation</span> Checklist Generator
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-gray-400 leading-relaxed font-light">
          Generate comprehensive, regulation-compliant tender checklists covering Technical, Commercial, Financial, Legal, and Compliance requirements within seconds using advanced AI, tailored specifically for industrial infrastructure bids.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={onStartGenerating}
            className="w-full sm:w-auto btn-gold-gradient px-8 py-4 rounded text-base flex items-center justify-center gap-2 font-bold uppercase transition duration-300"
          >
            <Sparkles className="h-5 w-5" />
            Generate Checklist
          </button>
          
          <button
            onClick={onViewDemo}
            className="w-full sm:w-auto px-8 py-4 rounded text-base bg-slate-100 border border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-600 font-semibold transition duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="h-4.5 w-4.5 text-blue-600 fill-blue-600" />
            View Demo Dashboard
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-32">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold tracking-widest text-gold-primary uppercase">Engineered Features</h2>
          <p className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            Smarter Infrastructure Bid Management
          </p>
          <div className="mx-auto mt-4 h-0.5 w-24 bg-gradient-to-r from-transparent via-gold-primary to-transparent" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="glass-panel glass-panel-hover rounded-lg p-8 relative flex flex-col text-left group"
              >
                {/* Glowing Corner Accent */}
                <div className="absolute top-0 right-0 h-8 w-8 rounded-tr-lg border-t border-r border-gold-primary/0 group-hover:border-gold-primary/40 transition duration-300" />
                
                <div className="flex h-12 w-12 items-center justify-center rounded border border-gold-primary/20 bg-[#0A0A0A] text-gold-primary mb-6 shadow-inner group-hover:bg-gold-primary/10 transition duration-300">
                  <Icon className="h-6 w-6" />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-3 tracking-wide">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-light">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
