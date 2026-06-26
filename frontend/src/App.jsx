import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Auth from './components/Auth';
import ChecklistForm from './components/ChecklistForm';
import ChecklistDisplay from './components/ChecklistDisplay';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { api } from './utils/api';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { syncTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activePage, setActivePage] = useState('hero'); // 'hero', 'dashboard', 'generate', 'checklist-view', 'admin', 'auth', 'settings'
  
  // Data lists
  const [checklists, setChecklists] = useState([]);
  const [activeChecklist, setActiveChecklist] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    type: 'All',
    readiness: 'All'
  });

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Welcome to AVINASH KANAPARTHI INFRA AI Portal. Explore the demo dashboards.', type: 'info', time: 'Just now', read: false },
    { id: 2, message: 'OpenAI integration ready. If no API Key is set, the system utilizes standard mock models.', type: 'info', time: '1 min ago', read: false },
  ]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingActions, setLoadingActions] = useState({
    pdf: false,
    excel: false,
    regenerate: false
  });

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Tender Document Upload and Preview States
  const [tenderDocuments, setTenderDocuments] = useState([]);
  const [tenderDocsLoading, setTenderDocsLoading] = useState(false);
  const [initialAction, setInitialAction] = useState(null);

  useEffect(() => {
    if (activeChecklist && activeChecklist._id) {
      fetchTenderDocuments(activeChecklist._id);
    } else {
      setTenderDocuments([]);
    }
  }, [activeChecklist?._id]);

  const fetchTenderDocuments = async (tenderId) => {
    setTenderDocsLoading(true);
    try {
      const docs = await api.getTenderDocuments(tenderId);
      setTenderDocuments(docs);
    } catch (err) {
      console.error('Failed to fetch tender documents:', err.message);
    } finally {
      setTenderDocsLoading(false);
    }
  };

  const handleUploadTenderDoc = async (tenderId, file) => {
    try {
      await api.uploadTenderDocument(tenderId, file);
      showToast(`Document "${file.name}" uploaded successfully!`, 'success');
      fetchTenderDocuments(tenderId);
    } catch (err) {
      showToast('Document upload failed: ' + err.message, 'error');
      throw err;
    }
  };

  const handleDeleteTenderDoc = async (docId) => {
    try {
      await api.deleteTenderDocument(docId);
      showToast('Document deleted successfully', 'success');
      if (activeChecklist) {
        fetchTenderDocuments(activeChecklist._id);
      }
    } catch (err) {
      showToast('Failed to delete document', 'error');
      throw err;
    }
  };

  const handleFetchPreviewUrl = async (docId) => {
    try {
      return await api.getSignedPreviewUrl(docId);
    } catch (err) {
      showToast('Failed to retrieve preview link', 'error');
      throw err;
    }
  };

  const handleFetchDownloadUrl = async (docId) => {
    try {
      return await api.getSignedDownloadUrl(docId);
    } catch (err) {
      showToast('Failed to retrieve download link', 'error');
      throw err;
    }
  };

  // Auth initial check
  useEffect(() => {
    const savedToken = api.getToken();
    const savedUser = api.getCurrentUser();
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
      syncTheme(savedToken);
    }
  }, []);

  // Fetch checklists when filter/auth changes
  useEffect(() => {
    if (token) {
      fetchChecklists();
      if (user?.role === 'admin') {
        fetchAnalytics();
      }
    }
  }, [token, filters, user?.role]);

  const fetchChecklists = async () => {
    try {
      const data = await api.getChecklists(filters);
      setChecklists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Checklists fetch error:', error.message);
      if (
        error.message.includes('authorized') || 
        error.message.includes('unauthorized') || 
        error.message.includes('token') || 
        error.message.includes('not found')
      ) {
        handleLogout();
      }
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Analytics fetch error:', error.message);
      if (
        error.message.includes('authorized') || 
        error.message.includes('unauthorized') || 
        error.message.includes('token') || 
        error.message.includes('not found')
      ) {
        handleLogout();
      }
    }
  };

  const handleAuthSuccess = (data) => {
    setToken(data.token);
    setUser({ name: data.name, email: data.email, role: data.role });
    syncTheme(data.token);
    showToast(`Welcome back, ${data.name}!`, 'success');
    setActivePage('hero');
  };

  const handleLogout = () => {
    api.logout();
    setToken(null);
    setUser(null);
    setActiveChecklist(null);
    setChecklists([]);
    setAnalytics(null);
    setActivePage('hero');
    showToast('Logged out successfully', 'info');
  };

  const handleGenerateChecklist = async (formData) => {
    setLoading(true);
    try {
      const generated = await api.generateChecklist(formData);
      setActiveChecklist(generated);
      setActivePage('checklist-view');
      showToast('Tender checklist generated successfully!', 'success');
      
      // Add notification
      setNotifications(prev => [
        {
          id: Date.now(),
          message: `Generated tender checklist for "${formData.projectName}"`,
          type: 'info',
          time: 'Just now',
          read: false
        },
        ...prev
      ]);
      
      // Re-fetch checklists
      fetchChecklists();
    } catch (error) {
      showToast(error.message || 'Generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (section, itemId, status) => {
    if (!activeChecklist) return;
    try {
      const updated = await api.updateItemStatus(activeChecklist._id, section, itemId, status);
      setActiveChecklist(updated);
      fetchChecklists(); // Update dashboard
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleUploadDoc = async (section, itemId, fileName) => {
    if (!activeChecklist) return;
    try {
      const updated = await api.uploadMockDocument(activeChecklist._id, section, itemId, fileName);
      setActiveChecklist(updated);
      showToast(`Document "${fileName}" verified & compliance updated!`, 'success');
      
      // Add notification
      setNotifications(prev => [
        {
          id: Date.now(),
          message: `Verified: ${fileName} uploaded for checklist "${activeChecklist.projectName}"`,
          type: 'success',
          time: 'Just now',
          read: false
        },
        ...prev
      ]);
      
      fetchChecklists(); // Update dashboard
    } catch (error) {
      showToast('Document upload failed', 'error');
    }
  };

  const handleRate = async (rating) => {
    if (!activeChecklist) return;
    try {
      const result = await api.rateChecklist(activeChecklist._id, rating);
      setActiveChecklist(result.checklist);
      showToast(`Thank you for rating: ${rating} Stars!`, 'success');
    } catch (error) {
      showToast('Failed to save rating', 'error');
    }
  };

  const handleRegenerate = async () => {
    if (!activeChecklist) return;
    setLoadingActions(prev => ({ ...prev, regenerate: true }));
    try {
      const regenerated = await api.regenerateChecklist(activeChecklist._id);
      setActiveChecklist(regenerated);
      showToast('AI Model re-analyzed tender criteria!', 'success');
    } catch (error) {
      showToast('Regeneration failed', 'error');
    } finally {
      setLoadingActions(prev => ({ ...prev, regenerate: false }));
    }
  };

  const handleDeleteChecklist = async (id) => {
    if (confirm('Are you sure you want to delete this checklist record from the archive?')) {
      try {
        await api.deleteChecklist(id);
        if (activeChecklist && activeChecklist._id === id) {
          setActiveChecklist(null);
        }
        fetchChecklists();
        showToast('Checklist deleted from archive', 'success');
      } catch (error) {
        showToast('Delete failed', 'error');
      }
    }
  };

  const handleSelectChecklist = async (id, action = null) => {
    setLoading(true);
    setInitialAction(action);
    try {
      const data = await api.getChecklistById(id);
      setActiveChecklist(data);
      setActivePage('checklist-view');
    } catch (error) {
      showToast('Failed to open checklist record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocumentFromList = (id) => {
    handleSelectChecklist(id, 'upload');
  };

  const handleDownload = async (format) => {
    if (!activeChecklist) return;
    setLoadingActions(prev => ({ ...prev, [format]: true }));
    try {
      await api.downloadExportFile(activeChecklist._id, format);
      showToast(`Checklist downloaded in ${format.toUpperCase()} format`, 'success');
    } catch (error) {
      showToast('Download failed', 'error');
    } finally {
      setLoadingActions(prev => ({ ...prev, [format]: false }));
    }
  };

  const handleExportAuditLogs = () => {
    // Simulated Export CSV
    if (!analytics || !analytics.auditLogs) return;
    
    const headers = 'Timestamp,User,Email,Action,Details,IPAddress\n';
    const rows = analytics.auditLogs.map(log => 
      `"${new Date(log.createdAt).toLocaleString()}","${log.userName}","${log.userEmail}","${log.action}","${log.details.replace(/"/g, '""')}","${log.ipAddress}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `System_Audit_Logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit Log exported to CSV', 'success');
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Nav actions
  const onStartGenerating = () => {
    if (!token) {
      setActivePage('auth');
    } else {
      setActivePage('generate');
    }
  };

  const onViewDemo = () => {
    if (!token) {
      setActivePage('auth');
    } else {
      setActivePage('dashboard');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black-deep text-gray-100 selection:bg-gold-primary selection:text-black">
      
      {/* Toast notifications */}
      {toast && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-3 rounded-lg glass-panel border border-gold-primary/30 p-4 shadow-[0_0_20px_rgba(212,175,55,0.2)] animate-gold-glow max-w-sm">
          {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />}
          {toast.type === 'info' && <Sparkles className="h-5 w-5 text-gold-primary shrink-0" />}
          <p className="text-xs text-white text-left font-medium">{toast.message}</p>
        </div>
      )}

      {/* Main Navbar */}
      {token && (
        <Navbar 
          activePage={activePage} 
          setActivePage={(page) => { setInitialAction(null); setActivePage(page); }} 
          user={user} 
          onLogout={handleLogout}
          notifications={notifications}
          clearNotification={clearNotification}
        />
      )}

      {/* Main Content Areas */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Guest access routing */}
        {!token ? (
          <Auth onAuthSuccess={handleAuthSuccess} apiService={api} />
        ) : (
          <>
            {activePage === 'hero' && (
              <Hero onStartGenerating={onStartGenerating} onViewDemo={onViewDemo} />
            )}

            {activePage === 'generate' && (
              <ChecklistForm onSubmit={handleGenerateChecklist} loading={loading} />
            )}

            {activePage === 'checklist-view' && activeChecklist && (
              <ChecklistDisplay 
                checklist={activeChecklist}
                onUpdateStatus={handleUpdateStatus}
                onUploadDoc={handleUploadDoc}
                onRate={handleRate}
                onRegenerate={handleRegenerate}
                onDownload={handleDownload}
                loadingActions={loadingActions}
                user={user}
                tenderDocuments={tenderDocuments}
                tenderDocsLoading={tenderDocsLoading}
                onUploadTenderDoc={handleUploadTenderDoc}
                onDeleteTenderDoc={handleDeleteTenderDoc}
                onFetchPreviewUrl={handleFetchPreviewUrl}
                onFetchDownloadUrl={handleFetchDownloadUrl}
                initialAction={initialAction}
              />
            )}

            {activePage === 'dashboard' && (
              <Dashboard 
                checklists={checklists}
                onSelectChecklist={handleSelectChecklist}
                onDeleteChecklist={handleDeleteChecklist}
                onDownloadChecklist={handleDownload}
                onUploadDocument={handleUploadDocumentFromList}
                filters={filters}
                setFilters={setFilters}
                user={user}
              />
            )}

            {activePage === 'admin' && user?.role === 'admin' && (
              <AdminPanel 
                analytics={analytics} 
                onExportAuditLogs={handleExportAuditLogs}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(212,175,55,0.1)] bg-[#050505] py-8 mt-12 shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex h-10 w-10 items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-8 w-8 drop-shadow-[0_1px_3px_rgba(59,130,246,0.15)]">
              <defs>
                <linearGradient id="bgGradFooter" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#FFFFFF" />
                  <stop offset="100%" stop-color="#DCEeff" />
                </linearGradient>
                <linearGradient id="textGradFooter" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#2563EB" />
                  <stop offset="100%" stop-color="#1D4ED8" />
                </linearGradient>
                <clipPath id="rectClipFooter">
                  <rect x="2" y="2" width="96" height="96" rx="22" />
                </clipPath>
              </defs>
              <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#bgGradFooter)" stroke="#93C5FD" strokeWidth="2" />
              <path d="M 2,75 Q 40,40 75,2 L 2,2 Z" fill="#FFFFFF" opacity="0.45" clipPath="url(#rectClipFooter)" />
              <path d="M 25,98 Q 60,60 98,25 L 98,98 Z" fill="#FFFFFF" opacity="0.15" clipPath="url(#rectClipFooter)" />
              <text x="50" y="65" fontStyle="normal" fontWeight="900" fontSize="36" fontFamily="'Outfit', sans-serif" fill="url(#textGradFooter)" textAnchor="middle" letterSpacing="-1">AK</text>
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-white uppercase">
              AVINASH KANAPARTHI INFRA PRIVATE LIMITED
            </p>
            <p className="text-[10px] tracking-[0.2em] text-gold-primary uppercase font-bold mt-1">
              "Building Smarter Infrastructure with AI-Powered Tender Management"
            </p>
          </div>
          <p className="text-[10px] text-gray-600 font-light">
            &copy; {new Date().getFullYear()} AVINASH KANAPARTHI INFRA PRIVATE LIMITED. All rights reserved. Enterprise Bid Compliance Systems.
          </p>
        </div>
      </footer>
    </div>
  );
}
