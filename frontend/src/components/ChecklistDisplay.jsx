import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  RotateCw, 
  Star, 
  Upload, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  MapPin, 
  Building2, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Loader2,
  Image,
  FileText,
  FileSpreadsheet,
  File
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ChecklistDisplay({ 
  checklist, 
  onUpdateStatus, 
  onUploadDoc, 
  onRate, 
  onRegenerate, 
  onDownload, 
  loadingActions,
  user,
  tenderDocuments = [],
  tenderDocsLoading = false,
  onUploadTenderDoc,
  onDeleteTenderDoc,
  onFetchPreviewUrl,
  onFetchDownloadUrl,
  initialAction
}) {
  const [expandedSections, setExpandedSections] = useState({
    technical: true,
    commercial: true,
    financial: true,
    compliance: true,
  });
  
  // Rating states
  const [hoverRating, setHoverRating] = useState(0);
  
  // Document upload modal states
  const [uploadModal, setUploadModal] = useState({
    open: false,
    section: '',
    itemId: '',
    title: '',
    fileName: ''
  });

  // Tender Document Upload and Preview states
  const [tenderUploadModal, setTenderUploadModal] = useState({
    open: false,
    file: null,
    dragging: false,
    progress: 0
  });

  const [tenderPreviewModal, setTenderPreviewModal] = useState({
    open: false,
    url: '',
    fileName: '',
    fileType: ''
  });

  const [tenderPreviewLoading, setTenderPreviewLoading] = useState(false);

  // Auto-scroll to document section if initialAction exists
  useEffect(() => {
    if (initialAction) {
      setTimeout(() => {
        const docSection = document.getElementById('tender-documents-section');
        if (docSection) {
          docSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
      if (initialAction === 'upload') {
        setTenderUploadModal(prev => ({ ...prev, open: true }));
      }
    }
  }, [initialAction, checklist?._id]);

  const openTenderUploadModal = () => {
    setTenderUploadModal({
      open: true,
      file: null,
      dragging: false,
      progress: 0
    });
  };

  const handleSelectUploadFile = (file) => {
    if (!file) return;

    // Size limit 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB maximum limit.');
      return;
    }

    // MIME type check
    const ALLOWED_MIME_TYPES = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      alert('Unsupported file format. Please upload PDF, DOC/DOCX, Excel or PNG/JPG/WEBP images.');
      return;
    }

    setTenderUploadModal(prev => ({ ...prev, file }));
  };

  const handleSubmitTenderUpload = async () => {
    if (!tenderUploadModal.file) return;

    try {
      // Simulate progress bar upload
      let prog = 0;
      const interval = setInterval(() => {
        prog += 10;
        setTenderUploadModal(prev => ({ ...prev, progress: Math.min(prog, 95) }));
      }, 100);

      // Perform upload
      await onUploadTenderDoc(checklist._id, tenderUploadModal.file);
      
      // Clear interval and close modal
      clearInterval(interval);
      setTenderUploadModal({ open: false, file: null, dragging: false, progress: 0 });
    } catch (err) {
      alert('Upload failed: ' + err.message);
      setTenderUploadModal(prev => ({ ...prev, progress: 0 }));
    }
  };

  const handlePreviewTenderDoc = async (docId) => {
    setTenderPreviewLoading(true);
    try {
      const data = await onFetchPreviewUrl(docId);
      setTenderPreviewModal({
        open: true,
        url: data.url,
        fileName: data.file_name,
        fileType: data.file_type
      });
    } catch (err) {
      alert('Failed to preview document: ' + err.message);
    } finally {
      setTenderPreviewLoading(false);
    }
  };

  const handleDownloadTenderDoc = async (docId) => {
    try {
      const data = await onFetchDownloadUrl(docId);
      // Create download trigger
      const a = document.createElement('a');
      a.href = data.url;
      a.download = data.file_name;
      if (!data.isLocal) {
        a.target = '_blank';
      }
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
  };

  const handleDownloadPreviewFile = () => {
    if (tenderPreviewModal.url) {
      const a = document.createElement('a');
      a.href = tenderPreviewModal.url;
      a.download = tenderPreviewModal.fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handleDeleteTenderDoc = async (docId, fileName) => {
    if (confirm(`Are you sure you want to permanently delete the document "${fileName}"?`)) {
      try {
        await onDeleteTenderDoc(docId);
      } catch (err) {
        alert('Delete failed: ' + err.message);
      }
    }
  };

  const getFileIcon = (mimeType) => {
    const mime = mimeType || '';
    if (mime.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500 shrink-0" />;
    }
    if (mime.includes('word') || mime.includes('msword') || mime.includes('document')) {
      return <FileText className="h-5 w-5 text-blue-500 shrink-0" />;
    }
    if (mime.includes('excel') || mime.includes('sheet')) {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500 shrink-0" />;
    }
    if (mime.includes('image')) {
      return <Image className="h-5 w-5 text-purple-500 shrink-0" />;
    }
    return <File className="h-5 w-5 text-slate-500 shrink-0" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleStatusChange = (section, itemId, currentStatus) => {
    const nextStatus = currentStatus === 'pending' ? 'completed' : (currentStatus === 'completed' ? 'na' : 'pending');
    onUpdateStatus(section, itemId, nextStatus);
    
    // Trigger confetti if status changes to completed and score hits 100
    if (nextStatus === 'completed' && checklist.complianceScore >= 95) {
      triggerConfetti();
    }
  };

  const openUploadModal = (section, itemId, itemTitle) => {
    setUploadModal({
      open: true,
      section,
      itemId,
      title: itemTitle,
      fileName: ''
    });
  };

  const submitMockUpload = (e) => {
    e.preventDefault();
    if (!uploadModal.fileName) return;
    
    onUploadDoc(uploadModal.section, uploadModal.itemId, uploadModal.fileName);
    
    setUploadModal({
      open: false,
      section: '',
      itemId: '',
      title: '',
      fileName: ''
    });
    
    triggerConfetti();
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#D4AF37', '#FFFFFF']
    });
  };

  // Sections config helper
  const sections = [
    { id: 'technical', title: 'Technical Requirements', items: checklist.technicalSection, state: expandedSections.technical },
    { id: 'commercial', title: 'Commercial Requirements', items: checklist.commercialSection, state: expandedSections.commercial },
    { id: 'financial', title: 'Financial Requirements', items: checklist.financialSection, state: expandedSections.financial },
    { id: 'compliance', title: 'Compliance Requirements', items: checklist.complianceSection, state: expandedSections.compliance },
  ];

  // Helper for status classes
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
      case 'na':
        return 'bg-gray-800/50 border-gray-700 text-gray-500';
      default:
        return 'bg-red-500/10 border-red-500/25 text-red-400';
    }
  };

  // Readiness color
  const getReadinessColor = (level) => {
    switch (level) {
      case 'High': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
      case 'Medium': return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
      default: return 'text-red-400 border-red-500/30 bg-red-500/5';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 relative">
      
      {/* 1. Project Info Summary Card */}
      <div className="glass-panel rounded-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-primary/5 rounded-full blur-2xl" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-left space-y-2">
            <span className="inline-block text-[10px] tracking-widest font-extrabold text-gold-primary uppercase border border-gold-primary/20 rounded px-2 py-0.5 bg-gold-primary/5">
              {checklist.tenderCategory} / {checklist.projectType}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">{checklist.projectName}</h2>
            
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-1 text-sm text-gray-400 font-light">
              <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-gold-primary" /> {checklist.clientName}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gold-primary" /> {checklist.location}</span>
              <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-gold-primary" /> INR {checklist.tenderValue} Crores</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-gold-primary" /> Deadline: {checklist.submissionDeadline && !isNaN(new Date(checklist.submissionDeadline).getTime()) ? new Date(checklist.submissionDeadline).toLocaleDateString('en-IN') : 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-end border-t border-gray-900 pt-4 md:border-t-0 md:pt-0">
            <button
              onClick={() => onDownload('pdf')}
              disabled={loadingActions.pdf}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded border border-slate-200 hover:border-blue-500 bg-slate-50 text-xs font-bold text-slate-700 uppercase transition duration-300 cursor-pointer"
            >
              <FileDown className="h-4 w-4 text-blue-600" />
              {loadingActions.pdf ? 'PDF...' : 'PDF'}
            </button>
            <button
              onClick={() => onDownload('excel')}
              disabled={loadingActions.excel}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded border border-slate-200 hover:border-blue-500 bg-slate-50 text-xs font-bold text-slate-700 uppercase transition duration-300 cursor-pointer"
            >
              <FileDown className="h-4 w-4 text-blue-600" />
              {loadingActions.excel ? 'Excel...' : 'Excel'}
            </button>
            <button
              onClick={onRegenerate}
              disabled={loadingActions.regenerate}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded border border-gold-primary/20 hover:border-gold-primary bg-gold-primary/5 hover:bg-gold-primary text-xs font-bold text-gold-primary hover:text-black uppercase transition duration-300"
            >
              <RotateCw className="h-4 w-4" />
              {loadingActions.regenerate ? 'Re-analyzing...' : 'Regenerate'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Metrics & Risk Assessment Dashboard */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Compliance Circular Meter */}
        <div className="glass-panel rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tender Compliance Score</h3>
          <div className="relative flex items-center justify-center h-28 w-28">
            {/* Background Circle */}
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="#D4AF37" 
                strokeWidth="6" 
                fill="transparent" 
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - checklist.complianceScore / 100)}`}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-3xl font-extrabold text-white">{checklist.complianceScore}%</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-4 italic font-light">Calculated based on document upload completions</p>
        </div>

        {/* Readiness Level Panel */}
        <div className="glass-panel rounded-lg p-6 flex flex-col justify-between text-left relative">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Submission Readiness</h3>
            <div className={`w-fit rounded border px-3 py-1.5 text-lg font-bold ${getReadinessColor(checklist.readinessLevel)}`}>
              {checklist.readinessLevel} Readiness
            </div>
          </div>
          
          <div className="border-t border-gray-900 pt-3 mt-4">
            <span className="text-xs font-bold text-white block">Status Indicator:</span>
            <p className="text-xs text-gray-400 leading-relaxed font-light mt-1">
              {checklist.readinessLevel === 'High' 
                ? 'Bid security and statutory compliance checks are complete. Ready for executive approval and portal upload.' 
                : (checklist.readinessLevel === 'Medium' 
                   ? 'Critical documents loaded. Pending final BOQ checks and EMD verification.' 
                   : 'Missing key mandatory documents. Do not submit tender in current state.')}
            </p>
          </div>
        </div>

        {/* Alert Notifications */}
        <div className="glass-panel rounded-lg p-6 flex flex-col text-left">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 text-red-400">
            <AlertTriangle className="h-4 w-4" /> Missing Document Alerts
          </h3>
          <div className="overflow-y-auto max-h-36 space-y-2 pr-1">
            {checklist.missingDocumentsAlerts.length === 0 ? (
              <div className="text-xs text-gray-500 italic py-4">No critical documents missing. Ready!</div>
            ) : (
              checklist.missingDocumentsAlerts.map((alert, idx) => (
                <div key={idx} className="text-xs text-red-300 font-light leading-relaxed border-l-2 border-red-500/50 pl-2">
                  {alert}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. AI Strategic Recommendations Accordion */}
      {checklist.aiRecommendations && checklist.aiRecommendations.length > 0 && (
        <div className="glass-panel rounded-lg border border-gold-primary/30 p-6 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-gold-primary/10 to-transparent blur-md" />
          <h3 className="text-sm font-bold text-gold-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5" /> AI Recommendations Engine
          </h3>
          <ul className="space-y-3">
            {checklist.aiRecommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-gray-300 leading-relaxed font-light flex gap-2">
                <span className="text-gold-primary font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Categorized Checklist Accordions */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="glass-panel rounded-lg overflow-hidden border border-gold-primary/10">
            {/* Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100/80 transition duration-200 border-b border-slate-200 cursor-pointer"
            >
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{section.title}</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {section.items.filter(i => i.status === 'completed').length} / {section.items.length} Completed
                </span>
                {section.state ? <ChevronUp className="h-4 w-4 text-gold-primary" /> : <ChevronDown className="h-4 w-4 text-gold-primary" />}
              </div>
            </button>

            {/* List */}
            {section.state && (
              <div className="divide-y divide-slate-100 bg-white">
                {section.items.length === 0 ? (
                  <p className="text-xs text-gray-500 italic p-6">No requirements specified for this section.</p>
                ) : (
                  section.items.map((item) => (
                    <div 
                      key={item._id} 
                      className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition duration-200"
                    >
                      {/* Left: Text detail */}
                      <div className="text-left space-y-1.5 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.mandatory ? (
                            <span className="rounded bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                              Mandatory
                            </span>
                          ) : (
                            <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                              Optional
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-white tracking-wide">{item.title}</h4>
                        </div>
                        <p className="text-xs text-gray-400 font-light leading-relaxed">{item.description}</p>
                        
                        {item.uploadedDocName && (
                          <div className="inline-flex items-center gap-1.5 rounded bg-blue-500/5 border border-blue-500/15 px-2 py-1 text-[10px] font-semibold text-blue-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Document: {item.uploadedDocName}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleStatusChange(section.id, item._id, item.status)}
                          className={`rounded border px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer ${getStatusStyle(item.status)}`}
                        >
                          {item.status === 'completed' ? 'Completed' : (item.status === 'na' ? 'N/A' : 'Pending')}
                        </button>

                        {/* Document Upload Button */}
                        <button
                          onClick={() => openUploadModal(section.id, item._id, item.title)}
                          className="p-2 rounded border border-slate-200 bg-slate-50 hover:border-blue-500 text-slate-500 hover:text-blue-600 transition duration-300 cursor-pointer"
                          title="Simulate Document Verification"
                        >
                          <Upload className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 4.5 Uploaded Tender Documents Section */}
      <div className="glass-panel rounded-lg p-6 space-y-6 text-left" id="tender-documents-section">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-wide uppercase">Uploaded Tender Documents</h3>
            <p className="text-xs text-gray-500 font-light mt-0.5">Tender notice, technical specifications, compliance reports, BOQ and other documents.</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={openTenderUploadModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white uppercase rounded shadow hover:shadow-md transition duration-200 cursor-pointer"
            >
              <Upload className="h-4 w-4" /> Upload Document
            </button>
          )}
        </div>

        {tenderDocsLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-xs font-medium">Loading uploaded documents...</p>
          </div>
        ) : !tenderDocuments || tenderDocuments.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-gray-200 rounded-lg text-gray-500">
            <p className="text-sm italic">No documents uploaded for this tender yet.</p>
            {user?.role === 'admin' && (
              <button
                onClick={openTenderUploadModal}
                className="mt-3 text-xs font-bold text-blue-600 hover:underline uppercase cursor-pointer"
              >
                Upload first document
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenderDocuments.map((doc) => (
              <div 
                key={doc._id || doc.id} 
                className="border border-gray-200 rounded p-4 bg-white flex flex-col justify-between hover:shadow transition duration-200 relative group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-slate-50 shrink-0">
                    {getFileIcon(doc.file_type)}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 truncate" title={doc.file_name}>
                      {doc.file_name}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-light flex items-center gap-1">
                      <span>Size: {formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span className="truncate">By: {doc.uploaded_by?.name || 'Admin'}</span>
                    </p>
                    <p className="text-[9px] text-gray-400 font-light">
                      Uploaded: {new Date(doc.createdAt || doc.created_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 mt-4">
                  <button
                    onClick={() => handlePreviewTenderDoc(doc._id || doc.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-[10px] font-bold text-blue-600 uppercase transition cursor-pointer"
                  >
                    <Eye className="h-3 w-3" /> Preview
                  </button>
                  <button
                    onClick={() => handleDownloadTenderDoc(doc._id || doc.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 text-[10px] font-bold text-slate-600 uppercase transition cursor-pointer"
                  >
                    <FileDown className="h-3 w-3" /> Download
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteTenderDoc(doc._id || doc.id, doc.file_name)}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition cursor-pointer"
                      title="Delete Document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Rating widget */}
      <div className="glass-panel rounded-lg p-6 max-w-md mx-auto text-center border border-gold-primary/20 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Rate AI Generator Output Quality</h4>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => onRate(star)}
              className="p-1 cursor-pointer transition transform hover:scale-110"
            >
              <Star 
                className={`h-7 w-7 ${
                  (hoverRating || checklist.rating) >= star 
                    ? 'text-gold-secondary fill-gold-secondary shadow-lg' 
                    : 'text-gray-700'
                }`} 
              />
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 leading-normal font-light">
          {checklist.rating > 0 
            ? `Thank you for rating! You rated this checklist ${checklist.rating} / 5 stars.` 
            : 'Help us improve the compliance recommendations engine by rating the generated checklists.'}
        </p>
      </div>

      {/* --- Simulated File Upload Modal --- */}
      {uploadModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md glass-panel rounded-lg p-6 border border-gold-primary/30 relative animate-gold-glow">
            <h4 className="text-sm font-bold text-gold-primary uppercase tracking-widest mb-4">
              Simulated Document Verification
            </h4>
            <div className="mb-5 text-left text-xs">
              <span className="text-gray-500 uppercase block tracking-wider font-semibold">Tender Requirement</span>
              <p className="text-white mt-1 text-sm font-bold">{uploadModal.title}</p>
            </div>
            
            <form onSubmit={submitMockUpload} className="space-y-5 text-left">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Choose Document File</label>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setUploadModal(prev => ({ ...prev, fileName: file.name }));
                    }
                  }}
                  className="w-full gold-input cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-gold-primary/10 file:text-gold-primary hover:file:bg-gold-primary/20 file:cursor-pointer"
                />
                {uploadModal.fileName && (
                  <p className="text-[11px] text-gold-secondary font-medium pl-1 mt-1">
                    Selected: {uploadModal.fileName}
                  </p>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModal({ open: false, section: '', itemId: '', title: '', fileName: '' })}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded text-xs font-bold text-slate-600 uppercase transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold-gradient px-5 py-2 rounded text-xs font-bold uppercase transition"
                >
                  Verify & Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Real Tender Document Upload Modal --- */}
      {tenderUploadModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg glass-panel rounded-lg p-6 border border-blue-500/20 text-left relative animate-gold-glow">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                Upload Tender Document
              </h4>
              <button 
                onClick={() => setTenderUploadModal({ open: false, file: null, dragging: false, progress: 0 })}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div 
              onDragOver={(e) => {
                e.preventDefault();
                setTenderUploadModal(prev => ({ ...prev, dragging: true }));
              }}
              onDragLeave={() => {
                setTenderUploadModal(prev => ({ ...prev, dragging: false }));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                handleSelectUploadFile(file);
              }}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition duration-200 flex flex-col items-center justify-center cursor-pointer ${
                tenderUploadModal.dragging 
                  ? 'border-blue-500 bg-blue-50/30' 
                  : 'border-gray-200 bg-slate-50/50 hover:bg-slate-50'
              }`}
              onClick={() => document.getElementById('tender-doc-file-input').click()}
            >
              <Upload className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-xs font-bold text-slate-800">Drag & drop your file here, or <span className="text-blue-600 hover:underline">browse</span></p>
              <p className="text-[10px] text-gray-400 mt-2 font-light">Supported formats: PDF, Word (Doc/Docx), Excel (Xls/Xlsx), Images (PNG/JPG/WEBP)</p>
              <p className="text-[10px] text-gray-400 font-light">Max allowed file size: 10MB</p>
              <input
                id="tender-doc-file-input"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  handleSelectUploadFile(file);
                }}
              />
            </div>

            {tenderUploadModal.file && (
              <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {getFileIcon(tenderUploadModal.file.type)}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{tenderUploadModal.file.name}</p>
                    <p className="text-[10px] text-gray-400 font-light">Size: {formatFileSize(tenderUploadModal.file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTenderUploadModal(prev => ({ ...prev, file: null, progress: 0 }))}
                  className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer uppercase shrink-0"
                >
                  Remove
                </button>
              </div>
            )}

            {tenderUploadModal.progress > 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                  <span>Uploading progress</span>
                  <span>{tenderUploadModal.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded transition-all duration-300"
                    style={{ width: `${tenderUploadModal.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setTenderUploadModal({ open: false, file: null, dragging: false, progress: 0 })}
                className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded text-xs font-bold text-slate-600 uppercase transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!tenderUploadModal.file || tenderUploadModal.progress > 0}
                onClick={handleSubmitTenderUpload}
                className="btn-gold-gradient px-5 py-2 rounded text-xs font-bold uppercase transition"
              >
                {tenderUploadModal.progress > 0 ? 'Uploading...' : 'Start Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Tender Document Preview Modal --- */}
      {tenderPreviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-4xl h-[85vh] bg-[#0A0A0A]/95 backdrop-blur-md rounded-lg border border-gray-800 flex flex-col justify-between overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-slate-900/60 px-5 py-3 border-b border-gray-800 shrink-0">
              <div className="min-w-0 text-left">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest truncate">{tenderPreviewModal.fileName}</h4>
                <p className="text-[10px] text-gray-500 font-light mt-0.5">Secure preview console</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPreviewFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-700 hover:border-blue-500 text-xs font-bold text-white hover:text-blue-500 uppercase transition duration-200 cursor-pointer"
                >
                  <FileDown className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  onClick={() => setTenderPreviewModal({ open: false, url: '', fileName: '', fileType: '' })}
                  className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 bg-black/60 relative overflow-hidden flex items-center justify-center p-6">
              {tenderPreviewLoading ? (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <p className="text-xs font-medium">Opening secure file view...</p>
                </div>
              ) : tenderPreviewModal.fileType?.includes('pdf') ? (
                <iframe 
                  src={tenderPreviewModal.url} 
                  className="w-full h-full border-0 rounded bg-white" 
                  title="PDF Document Viewer"
                />
              ) : tenderPreviewModal.fileType?.includes('image') ? (
                <img 
                  src={tenderPreviewModal.url} 
                  alt="Tender Illustration Document" 
                  className="max-w-full max-h-full object-contain rounded shadow-lg select-none"
                />
              ) : (
                // DOCX/Excel spreadsheets preview warning fallback
                <div className="max-w-sm text-center bg-slate-900/80 p-8 border border-gray-800 rounded-lg space-y-4 shadow-lg">
                  <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Preview Not Supported</h4>
                  <p className="text-xs text-slate-400 leading-normal font-light">
                    Preview not available for this file type ({tenderPreviewModal.fileType || 'Doc/Excel'}). Please download the file to view its full content.
                  </p>
                  <button
                    onClick={handleDownloadPreviewFile}
                    className="btn-gold-gradient px-5 py-2.5 rounded text-xs font-bold uppercase transition"
                  >
                    Download Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
