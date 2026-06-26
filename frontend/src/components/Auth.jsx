import React, { useState } from 'react';
import { Mail, Lock, Sparkles, LogIn, AlertCircle } from 'lucide-react';

export default function Auth({ onAuthSuccess, apiService }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiService.login(email, password);
      onAuthSuccess(data);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-8 relative">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-[450px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[120px]" />

      <div className="w-full max-w-4xl glass-panel rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col md:flex-row relative animate-gold-glow">
        
        {/* Left Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <div className="mb-3 flex h-11 w-11 items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-10 w-10 drop-shadow-[0_2px_4px_rgba(59,130,246,0.15)]">
                <defs>
                  <linearGradient id="bgGradLogin" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFFFFF" />
                    <stop offset="100%" stop-color="#DCEeff" />
                  </linearGradient>
                  <linearGradient id="textGradLogin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#2563EB" />
                    <stop offset="100%" stop-color="#1D4ED8" />
                  </linearGradient>
                  <clipPath id="rectClipLogin">
                    <rect x="2" y="2" width="96" height="96" rx="22" />
                  </clipPath>
                </defs>
                <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#bgGradLogin)" stroke="#93C5FD" strokeWidth="2" />
                <path d="M 2,75 Q 40,40 75,2 L 2,2 Z" fill="#FFFFFF" opacity="0.45" clipPath="url(#rectClipLogin)" />
                <path d="M 25,98 Q 60,60 98,25 L 98,98 Z" fill="#FFFFFF" opacity="0.15" clipPath="url(#rectClipLogin)" />
                <text x="50" y="65" fontStyle="normal" fontWeight="900" fontSize="36" fontFamily="'Outfit', sans-serif" fill="url(#textGradLogin)" textAnchor="middle" letterSpacing="-1">AK</text>
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
              AI Tender Checklist Generator
            </h2>
            <p className="text-xs text-blue-600 font-bold tracking-widest uppercase mt-1">
              AVINASH KANAPARTHI INFRA
            </p>
            <p className="text-xs text-gray-500 mt-2 font-normal leading-relaxed">
              Login to manage tender preparation, compliance tracking, and bid documentation.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="name@avinashinfra.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full gold-input pl-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full gold-input pl-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold-gradient py-3 rounded text-sm uppercase font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Processing...' : 'Login'}
            </button>
          </form>


        </div>

        {/* Right Side: Vector Illustration Showcase */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#F1F5F9] border-t md:border-t-0 md:border-l border-gray-200 p-8 sm:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Subtle grid pattern background overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" />
          
          <div className="relative z-10 w-full max-w-sm flex flex-col items-center justify-center">
            <img 
              src="/tender-login-illustration.svg" 
              alt="AI Tender Checklist Illustration" 
              className="w-full max-w-[280px] sm:max-w-[320px] h-auto mb-6 drop-shadow-md select-none pointer-events-none animate-pulse-slow"
            />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Smart tender preparation powered by AI
            </h3>
            <p className="text-[11px] text-slate-500 mt-2 max-w-[250px] leading-relaxed">
              Verify compliance dynamically, track critical submission parameters, and streamline corporate bid preparations.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
