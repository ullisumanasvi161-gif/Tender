import React, { useState } from 'react';
import { 
  Users, 
  FileSpreadsheet, 
  Star, 
  TrendingUp, 
  Terminal, 
  Activity, 
  Cpu, 
  Download, 
  Search, 
  Filter,
  CheckCircle,
  HelpCircle,
  Briefcase
} from 'lucide-react';

export default function AdminPanel({ analytics, onExportAuditLogs }) {
  const [activeTab, setActiveTab] = useState('metrics');
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState('All');

  if (!analytics) {
    return (
      <div className="py-20 text-center text-gray-500">
        <svg className="animate-spin mx-auto h-8 w-8 text-gold-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Compiling system analytics...</span>
      </div>
    );
  }

  const { summary = {}, aiUsage = {}, projectTypes = [], tenderCategories = [], auditLogs = [], users = [] } = analytics;

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(logSearch.toLowerCase()) || 
      log.userEmail.toLowerCase().includes(logSearch.toLowerCase()) || 
      log.details.toLowerCase().includes(logSearch.toLowerCase());
    
    if (logFilter === 'All') return matchesSearch;
    return matchesSearch && log.action === logFilter;
  });

  // Unique actions for filters
  const uniqueActions = ['All', ...new Set(auditLogs.map(log => log.action))];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-wide uppercase">
            Executive Control Panel
          </h2>
          <p className="text-xs text-gold-primary tracking-widest uppercase font-bold mt-1">
            System Administration & Audit Logs
          </p>
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users */}
        <div className="glass-panel rounded-lg p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Total Users</span>
            <span className="text-3xl font-extrabold text-white">{summary.totalUsers}</span>
          </div>
          <Users className="h-10 w-10 text-gold-primary/20" />
        </div>

        {/* Checklists */}
        <div className="glass-panel rounded-lg p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Generations</span>
            <span className="text-3xl font-extrabold text-white">{summary.totalChecklists}</span>
          </div>
          <FileSpreadsheet className="h-10 w-10 text-gold-primary/20" />
        </div>

        {/* Completion Rate */}
        <div className="glass-panel rounded-lg p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Doc Load Rate</span>
            <span className="text-3xl font-extrabold text-white">{summary.completionRate}</span>
          </div>
          <TrendingUp className="h-10 w-10 text-emerald-500/20" />
        </div>

        {/* Quality Rating */}
        <div className="glass-panel rounded-lg p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Average Rating</span>
            <span className="text-3xl font-extrabold text-white">{summary.averageRating} / 5</span>
          </div>
          <Star className="h-10 w-10 text-amber-500/20 fill-amber-500/5" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-900 gap-6">
        {[
          { id: 'metrics', name: 'System Metrics', icon: Activity },
          { id: 'users', name: 'Staff Accounts', icon: Users },
          { id: 'logs', name: 'System Audit Logs', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold tracking-wider uppercase transition-all border-b-2 ${
                isActive 
                  ? 'text-gold-primary border-gold-primary' 
                  : 'text-gray-500 border-transparent hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        
        {/* Tab 1: Metrics */}
        {activeTab === 'metrics' && (
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* AI Engine Stats */}
            <div className="glass-panel rounded-lg p-6 space-y-6">
              <h3 className="text-sm font-bold text-gold-primary uppercase tracking-widest border-b border-gray-900 pb-3 flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5" /> AI Recommendation Engine Performance
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A0A0A] p-4 rounded border border-gray-900">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">AI Executions</span>
                  <span className="text-2xl font-extrabold text-white">{aiUsage.generations} Runs</span>
                </div>
                <div className="bg-[#0A0A0A] p-4 rounded border border-gray-900">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Estimated Tokens</span>
                  <span className="text-2xl font-extrabold text-white">{aiUsage.estimatedTokens?.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-gold-primary/5 rounded border border-gold-primary/15 p-4 flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-400 font-light">Cost Saved vs Manual Compliance Auditing</span>
                  <p className="text-lg font-bold text-gold-primary mt-0.5">INR {(parseFloat(aiUsage.costSaved || 0) * 80).toFixed(2)} Lakhs</p>
                </div>
                <TrendingUp className="h-8 w-8 text-gold-primary/30" />
              </div>
            </div>

            {/* Distribution chart using CSS progress bars */}
            <div className="glass-panel rounded-lg p-6 space-y-5">
              <h3 className="text-sm font-bold text-gold-primary uppercase tracking-widest border-b border-gray-900 pb-3 flex items-center gap-2">
                <Briefcase className="h-4.5 w-4.5" /> Tender Category Distributions
              </h3>
              
              <div className="space-y-4">
                {tenderCategories.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No category data available</p>
                ) : (
                  tenderCategories.map((cat, idx) => {
                    const maxVal = Math.max(...tenderCategories.map(c => c.value));
                    const widthPct = maxVal > 0 ? (cat.value / maxVal) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-light">
                          <span className="text-gray-300 font-medium">{cat.name}</span>
                          <span className="text-white font-bold">{cat.value} Bids</span>
                        </div>
                        <div className="h-2 w-full bg-[#0A0A0A] rounded border border-gray-900 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-gold-primary to-gold-secondary rounded" 
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Project type distribution */}
            <div className="glass-panel rounded-lg p-6 space-y-5 md:col-span-2">
              <h3 className="text-sm font-bold text-gold-primary uppercase tracking-widest border-b border-gray-900 pb-3 flex items-center gap-2">
                <Briefcase className="h-4.5 w-4.5" /> Project Type Distribution
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {projectTypes.length === 0 ? (
                  <p className="text-xs text-gray-500 italic col-span-2">No type data available</p>
                ) : (
                  projectTypes.map((type, idx) => {
                    const maxVal = Math.max(...projectTypes.map(t => t.value));
                    const widthPct = maxVal > 0 ? (type.value / maxVal) * 100 : 0;
                    return (
                      <div key={idx} className="bg-[#0A0A0A] p-4.5 rounded border border-gray-900 space-y-2">
                        <div className="flex justify-between text-xs font-light">
                          <span className="text-gray-300 font-semibold truncate max-w-[180px]">{type.name}</span>
                          <span className="text-gold-primary font-bold">{type.value} Bids</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-950 rounded overflow-hidden">
                          <div 
                            className="h-full bg-gold-primary rounded" 
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users */}
        {activeTab === 'users' && (
          <div className="glass-panel rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-[#0A0A0A]/50 border-b border-gray-900 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Registered Bid Team Members</h3>
              <span className="text-xs text-gray-400 font-semibold">{users.length} Users</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-500 uppercase bg-[#0C0C0C]">
                  <tr>
                    <th scope="col" className="px-6 py-4">Name</th>
                    <th scope="col" className="px-6 py-4">Email</th>
                    <th scope="col" className="px-6 py-4 text-center">Role</th>
                    <th scope="col" className="px-6 py-4">Date Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900 bg-[#070707]/10">
                  {users.map((u, idx) => (
                    <tr key={idx} className="hover:bg-[#0A0A0A] transition">
                      <td className="px-6 py-4 font-bold text-white">{u.name}</td>
                      <td className="px-6 py-4 font-light">{u.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          u.role === 'admin' 
                            ? 'bg-gold-primary/10 border border-gold-primary/20 text-gold-primary' 
                            : 'bg-gray-800 border border-gray-700 text-gray-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-light text-xs text-gray-500">
                        {u.createdAt && !isNaN(new Date(u.createdAt).getTime())
                          ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Logs */}
        {activeTab === 'logs' && (
          <div className="glass-panel rounded-lg overflow-hidden space-y-4 p-6">
            
            {/* Header controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter logs by User, Email, description..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full gold-input pl-10 text-xs py-2"
                />
              </div>

              <div className="flex w-full md:w-auto items-center gap-3">
                <div className="relative flex-1 md:flex-initial">
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="w-full gold-input text-xs py-2 bg-[#0A0A0A]"
                  >
                    {uniqueActions.map(action => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={onExportAuditLogs}
                  className="px-4 py-2 border border-gray-800 hover:border-gold-primary bg-[#0F0F0F] text-xs font-bold text-white uppercase transition flex items-center gap-1.5 shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV Export
                </button>
              </div>
            </div>

            {/* Logs console */}
            <div className="rounded border border-gray-900 bg-black p-4 h-[400px] overflow-y-auto font-mono text-[11px] text-gray-400 space-y-2.5">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-gray-600 py-20 italic">No audit records found matching search queries.</div>
              ) : (
                filteredLogs.map((log, idx) => (
                  <div key={idx} className="hover:bg-gray-950 p-1 rounded transition leading-relaxed">
                    <span className="text-gray-600">
                      [{ (log.createdAt || log.timestamp) && !isNaN(new Date(log.createdAt || log.timestamp).getTime())
                        ? new Date(log.createdAt || log.timestamp).toLocaleString()
                        : 'N/A' }]
                    </span>{' '}
                    <span className="text-gold-primary">@{log.userName}</span>{' '}
                    <span className="text-gray-500">({log.userEmail})</span>{' '}
                    <span className="text-white bg-gray-900 px-1 rounded uppercase text-[9px] font-bold border border-gray-800">{log.action}</span>{' '}
                    <span className="text-gray-300 font-light">{log.details}</span>{' '}
                    <span className="text-[10px] text-gray-600 shrink-0">ip:{log.ipAddress}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
