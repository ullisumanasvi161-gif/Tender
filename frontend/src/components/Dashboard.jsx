import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, DollarSign, FileSpreadsheet, Eye, FileDown, Trash2, ShieldAlert, CheckCircle2, Upload, FileText, ChevronDown } from 'lucide-react';

export default function Dashboard({ 
  checklists, 
  onSelectChecklist, 
  onDeleteChecklist, 
  onDownloadChecklist, 
  onUploadDocument,
  filters, 
  setFilters,
  user
}) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (id) => {
    setActiveDropdown(prev => prev === id ? null : id);
  };

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: localSearch }));
    }, 4000); // 400ms debounce
    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleSearchChange = (e) => {
    setLocalSearch(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setLocalSearch('');
    setFilters({
      search: '',
      category: 'All',
      type: 'All',
      readiness: 'All'
    });
  };

  const list = Array.isArray(checklists) ? checklists : [];

  // Calculate user-specific metrics
  const totalChecklists = list.length;
  
  const avgCompliance = totalChecklists > 0 
    ? Math.round(list.reduce((acc, c) => acc + (c.complianceScore || 0), 0) / totalChecklists) 
    : 0;

  const highReadiness = list.filter(c => c.readinessLevel === 'High').length;

  // Readiness styling
  const getReadinessBadge = (level) => {
    switch (level) {
      case 'High':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'Medium':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      default:
        return 'bg-red-500/10 border-red-500/20 text-red-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-wide uppercase">
            Tender Checklist Archive
          </h2>
          <p className="text-xs text-gold-primary tracking-widest uppercase font-bold mt-1">
            Avinash Kanaparthi Infra Private Limited
          </p>
        </div>
        
        {/* Quick User summary */}
        <div className="flex items-center gap-2 rounded bg-gold-primary/5 border border-gold-primary/15 px-3 py-1.5 text-xs">
          <ShieldAlert className="h-4 w-4 text-gold-primary" />
          <span className="text-gray-400">Authenticated as:</span>
          <span className="text-white font-bold">{user?.name}</span>
        </div>
      </div>

      {/* Quick Metrics Widget */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="glass-panel rounded-lg p-5 flex items-center justify-between border-l-4 border-l-gold-primary">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Archive Size</span>
            <span className="text-3xl font-extrabold text-white">{totalChecklists}</span>
          </div>
          <FileSpreadsheet className="h-10 w-10 text-gold-primary/20" />
        </div>

        <div className="glass-panel rounded-lg p-5 flex items-center justify-between border-l-4 border-l-gold-secondary">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Average Compliance</span>
            <span className="text-3xl font-extrabold text-white">{avgCompliance}%</span>
          </div>
          <div className="h-10 w-10 rounded-full border-2 border-gold-primary/20 flex items-center justify-center text-gold-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel rounded-lg p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">High Readiness Bids</span>
            <span className="text-3xl font-extrabold text-white">{highReadiness}</span>
          </div>
          <CheckCircle2 className="h-10 w-10 text-emerald-500/20" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-lg p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by Project, Client or Location..."
              value={localSearch}
              onChange={handleSearchChange}
              className="w-full gold-input pl-11"
            />
          </div>

          {/* Buttons */}
          {(localSearch || filters.category !== 'All' || filters.type !== 'All' || filters.readiness !== 'All') && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-800 hover:border-gray-700 rounded text-xs font-bold text-white uppercase transition"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Filter className="h-3 w-3" /> Category</span>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="gold-input text-sm py-2"
            >
              <option value="All" className="bg-[#0A0A0A]">All Categories</option>
              <option value="Civil Works" className="bg-[#0A0A0A]">Civil Works</option>
              <option value="Electrical/MEP" className="bg-[#0A0A0A]">Electrical/MEP</option>
              <option value="IT & Smart City Systems" className="bg-[#0A0A0A]">IT & Smart City Systems</option>
              <option value="Consultancy & PMC" className="bg-[#0A0A0A]">Consultancy & PMC</option>
              <option value="Supply of Materials & Logistics" className="bg-[#0A0A0A]">Supply of Materials & Logistics</option>
            </select>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Filter className="h-3 w-3" /> Project Type</span>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="gold-input text-sm py-2"
            >
              <option value="All" className="bg-[#0A0A0A]">All Project Types</option>
              <option value="Roads & Highways" className="bg-[#0A0A0A]">Roads & Highways</option>
              <option value="Bridges & Flyovers" className="bg-[#0A0A0A]">Bridges & Flyovers</option>
              <option value="Buildings & Infrastructure" className="bg-[#0A0A0A]">Buildings & Infrastructure</option>
              <option value="Water Supply & Sewage" className="bg-[#0A0A0A]">Water Supply & Sewage</option>
              <option value="Power Grid & Electrical" className="bg-[#0A0A0A]">Power Grid & Electrical</option>
              <option value="Commercial Complexes" className="bg-[#0A0A0A]">Commercial Complexes</option>
              <option value="Metro & Rail Projects" className="bg-[#0A0A0A]">Metro & Rail Projects</option>
              <option value="Other Construction" className="bg-[#0A0A0A]">Other Construction</option>
            </select>
          </div>

          {/* Readiness */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Filter className="h-3 w-3" /> Readiness Status</span>
            <select
              name="readiness"
              value={filters.readiness}
              onChange={handleFilterChange}
              className="gold-input text-sm py-2"
            >
              <option value="All" className="bg-[#0A0A0A]">All Readiness States</option>
              <option value="High" className="bg-[#0A0A0A]">High Readiness</option>
              <option value="Medium" className="bg-[#0A0A0A]">Medium Readiness</option>
              <option value="Low" className="bg-[#0A0A0A]">Low Readiness</option>
            </select>
          </div>
        </div>
      </div>

      {/* Checklist Grid */}
      {list.length === 0 ? (
        <div className="glass-panel rounded-lg py-16 text-center text-gray-500 space-y-4">
          <p className="text-base italic">No checklists found in your archive matching the active filters.</p>
          <button
            onClick={clearFilters}
            className="btn-gold-gradient px-5 py-2.5 rounded text-xs font-bold uppercase cursor-pointer"
          >
            Reset Search
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {list.map((checklist) => (
            <div 
              key={checklist._id} 
              className="glass-panel glass-panel-hover rounded-lg p-6 flex flex-col justify-between relative group overflow-hidden"
            >
              {/* Gold Top line highlight */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold-primary/20 via-gold-primary/50 to-gold-primary/20" />
              
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-start gap-4">
                  <span className="inline-block text-[9px] tracking-widest font-extrabold text-gold-primary uppercase border border-gold-primary/10 rounded px-1.5 py-0.5 bg-[#0C0C0C]">
                    {checklist.tenderCategory}
                  </span>
                  
                  <div className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 ${getReadinessBadge(checklist.readinessLevel)}`}>
                    {checklist.readinessLevel} Readiness
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white tracking-wide truncate group-hover:text-gold-primary transition duration-300">
                    {checklist.projectName}
                  </h3>
                  <p className="text-xs text-gray-400 font-light flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-gold-primary shrink-0" />
                    {checklist.clientName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 border-t border-gray-900 pt-3">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-gold-primary" />
                    <span>INR {checklist.tenderValue} Cr</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gold-primary" />
                    <span className="truncate">{checklist.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Calendar className="h-3.5 w-3.5 text-gold-primary" />
                    <span>Bid Deadline: {checklist.submissionDeadline && !isNaN(new Date(checklist.submissionDeadline).getTime()) ? new Date(checklist.submissionDeadline).toLocaleDateString('en-IN') : 'N/A'}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                    <span>Compliance Progress</span>
                    <span>{checklist.complianceScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-900 rounded overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-gold-primary to-gold-secondary rounded transition-all duration-500"
                      style={{ width: `${checklist.complianceScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between border-t border-gray-900 pt-4 mt-6 relative">
                <button
                  onClick={() => onSelectChecklist(checklist._id)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider transition duration-300 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  Review Checklist
                </button>

                <div className="flex items-center gap-2">
                  {/* Tender Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(checklist._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-200 hover:border-blue-500 bg-white text-[10px] font-bold text-slate-700 uppercase tracking-wider transition duration-200 cursor-pointer"
                    >
                      Actions <ChevronDown className="h-3 w-3" />
                    </button>
                    
                    {activeDropdown === checklist._id && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 rounded shadow-xl bg-white border border-gray-200 z-30 divide-y divide-gray-100 overflow-hidden">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              onSelectChecklist(checklist._id);
                              setActiveDropdown(null);
                            }}
                            className="flex items-center w-full px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 text-left font-bold cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 mr-2 text-blue-600" /> View Details
                          </button>
                        </div>

                        {user?.role === 'admin' && (
                          <div className="py-1">
                            <button
                              onClick={() => {
                                onUploadDocument(checklist._id, checklist.projectName);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center w-full px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 text-left font-bold cursor-pointer"
                            >
                              <Upload className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Upload Document
                            </button>
                          </div>
                        )}

                        <div className="py-1">
                          <button
                            onClick={() => {
                              onSelectChecklist(checklist._id, 'preview');
                              setActiveDropdown(null);
                            }}
                            className="flex items-center w-full px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 text-left font-bold cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5 mr-2 text-blue-600" /> Preview Documents
                          </button>
                          
                          <button
                            onClick={() => {
                              onSelectChecklist(checklist._id, 'download');
                              setActiveDropdown(null);
                            }}
                            className="flex items-center w-full px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 text-left font-bold cursor-pointer"
                          >
                            <FileDown className="h-3.5 w-3.5 mr-2 text-blue-600" /> Download Documents
                          </button>
                        </div>

                        {user?.role === 'admin' && (
                          <div className="py-1">
                            <button
                              onClick={() => {
                                onSelectChecklist(checklist._id, 'delete');
                                setActiveDropdown(null);
                              }}
                              className="flex items-center w-full px-3 py-2 text-[11px] text-red-600 hover:bg-red-50 text-left font-bold cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2 text-red-500" /> Delete Document
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Standard PDF and Delete actions */}
                  <button
                    onClick={() => onDownloadChecklist(checklist._id, 'pdf')}
                    className="p-1.5 rounded border border-slate-200 hover:border-blue-500 bg-slate-50 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                    title="Export PDF"
                  >
                    <FileDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteChecklist(checklist._id)}
                    className="p-1.5 rounded border border-slate-200 hover:border-red-500 bg-slate-50 text-slate-500 hover:text-red-500 transition cursor-pointer"
                    title="Delete Archive Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Subcomponent helper
const Building2 = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);
