import React, { useState } from 'react';
import { Sparkles, Calendar, MapPin, DollarSign, Briefcase, FileText, ChevronRight } from 'lucide-react';

const PROJECT_TYPES = [
  'Roads & Highways',
  'Bridges & Flyovers',
  'Buildings & Infrastructure',
  'Water Supply & Sewage',
  'Power Grid & Electrical',
  'Commercial Complexes',
  'Metro & Rail Projects',
  'Other Construction'
];

const TENDER_CATEGORIES = [
  'Civil Works',
  'Electrical/MEP',
  'IT & Smart City Systems',
  'Consultancy & PMC',
  'Supply of Materials & Logistics'
];

export default function ChecklistForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    projectName: '',
    projectType: PROJECT_TYPES[0],
    clientName: '',
    tenderValue: '',
    tenderCategory: TENDER_CATEGORIES[0],
    submissionDeadline: '',
    location: '',
    specialRequirements: '',
    scopeOfWork: '',
    eligibilityCriteria: '',
    additionalNotes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate value is numeric
    const valueNum = parseFloat(formData.tenderValue);
    onSubmit({
      ...formData,
      tenderValue: isNaN(valueNum) ? 0 : valueNum
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-white tracking-wide uppercase">
          Tender Parameters Configuration
        </h2>
        <p className="text-xs text-gold-primary tracking-widest uppercase font-bold mt-1">
          AVINASH KANAPARTHI INFRA PRIVATE LIMITED
        </p>
        <div className="mx-auto mt-4 h-0.5 w-16 bg-gold-primary" />
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-lg p-8 shadow-2xl space-y-8 border border-gold-primary/20 relative">
        {/* Visual corner elements */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold-primary/40 rounded-tl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold-primary/40 rounded-br" />

        {/* Group 1: Core Details */}
        <div>
          <h3 className="text-sm font-bold text-gold-primary uppercase tracking-widest mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> 1. General Project Information
          </h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Project Name *</label>
              <input
                type="text"
                name="projectName"
                required
                placeholder="e.g. NHAI 4-Lane Greenfield Expressway"
                value={formData.projectName}
                onChange={handleChange}
                className="gold-input"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Client Authority *</label>
              <input
                type="text"
                name="clientName"
                required
                placeholder="e.g. NHAI, PWD, NTPC, Municipal Corp"
                value={formData.clientName}
                onChange={handleChange}
                className="gold-input"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Project Type *</label>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="gold-input"
              >
                {PROJECT_TYPES.map(type => (
                  <option key={type} value={type} className="bg-[#0A0A0A]">{type}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Tender Category *</label>
              <select
                name="tenderCategory"
                value={formData.tenderCategory}
                onChange={handleChange}
                className="gold-input"
              >
                {TENDER_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-[#0A0A0A]">{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Group 2: Key Parameters */}
        <div>
          <h3 className="text-sm font-bold text-gold-primary uppercase tracking-widest mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> 2. Critical Bid Parameters
          </h3>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Tender Value (INR Crores) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
                <input
                  type="number"
                  step="0.01"
                  name="tenderValue"
                  required
                  placeholder="e.g. 15.75"
                  value={formData.tenderValue}
                  onChange={handleChange}
                  className="gold-input pl-10 w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Submission Deadline *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
                <input
                  type="date"
                  name="submissionDeadline"
                  required
                  value={formData.submissionDeadline}
                  onChange={handleChange}
                  className="gold-input pl-10 w-full text-slate-800"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Project Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
                <input
                  type="text"
                  name="location"
                  required
                  placeholder="e.g. Hyderabad, Telangana"
                  value={formData.location}
                  onChange={handleChange}
                  className="gold-input pl-10 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Group 3: Text Areas */}
        <div>
          <h3 className="text-sm font-bold text-gold-primary uppercase tracking-widest mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" /> 3. Detailed Scope & Eligibility
          </h3>

          <div className="space-y-5">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Scope of Work</label>
              <textarea
                name="scopeOfWork"
                rows="3"
                placeholder="Describe the main construction, supply, and engineering works required under this tender..."
                value={formData.scopeOfWork}
                onChange={handleChange}
                className="gold-input resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Eligibility Criteria</label>
              <textarea
                name="eligibilityCriteria"
                rows="3"
                placeholder="Mention mandatory average annual turnover, technical completion experience certificate conditions, and credit solvency limits..."
                value={formData.eligibilityCriteria}
                onChange={handleChange}
                className="gold-input resize-none"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Special Requirements</label>
                <textarea
                  name="specialRequirements"
                  rows="3"
                  placeholder="Joint Venture allowances, specific machinery requirements, safety certifications..."
                  value={formData.specialRequirements}
                  onChange={handleChange}
                  className="gold-input resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Additional Notes</label>
                <textarea
                  name="additionalNotes"
                  rows="3"
                  placeholder="Internal notes, pricing strategies, key subcontractors, dates of pre-bid meetings..."
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  className="gold-input resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-gray-900 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-gold-gradient px-8 py-4 rounded text-sm uppercase font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                AI Model Running...
              </>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5" />
                Generate Tender Checklist
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
