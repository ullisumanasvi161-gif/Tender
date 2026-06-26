import React, { useState } from 'react';
import { Shield, User, LogOut, Menu, X, Bell, LayoutDashboard, FileSpreadsheet, PlusCircle } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

export default function Navbar({ activePage, setActivePage, user, onLogout, notifications, clearNotification }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { id: 'hero', name: 'Home', icon: LayoutDashboard },
    { id: 'dashboard', name: 'Dashboard', icon: FileSpreadsheet },
    { id: 'generate', name: 'Generate Checklist', icon: PlusCircle },
  ];

  if (user && user.role === 'admin') {
    navItems.push({ id: 'admin', name: 'Admin Control', icon: Shield });
  }

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setIsOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[rgba(212,175,55,0.15)] bg-white/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('hero')}>
            <div className="flex h-11 w-11 items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-10 w-10 drop-shadow-[0_2px_4px_rgba(59,130,246,0.15)]">
                <defs>
                  <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFFFFF" />
                    <stop offset="100%" stop-color="#DCEeff" />
                  </linearGradient>
                  <linearGradient id="textGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#2563EB" />
                    <stop offset="100%" stop-color="#1D4ED8" />
                  </linearGradient>
                  <clipPath id="rectClip">
                    <rect x="2" y="2" width="96" height="96" rx="22" />
                  </clipPath>
                </defs>
                <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#bgGrad)" stroke="#93C5FD" strokeWidth="2" />
                <path d="M 2,75 Q 40,40 75,2 L 2,2 Z" fill="#FFFFFF" opacity="0.45" clipPath="url(#rectClip)" />
                <path d="M 25,98 Q 60,60 98,25 L 98,98 Z" fill="#FFFFFF" opacity="0.15" clipPath="url(#rectClip)" />
                <text x="50" y="65" fontStyle="normal" fontWeight="900" fontSize="36" fontFamily="'Outfit', sans-serif" fill="url(#textGrad)" textAnchor="middle" letterSpacing="-1">AK</text>
              </svg>
            </div>
            <div>
              <span className="block text-sm font-semibold tracking-wider text-slate-900">AVINASH KANAPARTHI</span>
              <span className="block text-xs font-bold tracking-[0.25em] text-blue-600">INFRA PRIVATE LIMITED</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium tracking-wide transition-all duration-300 hover:text-blue-600 ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* Profile & Notifications */}
          <div className="hidden md:flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full border border-gray-200 bg-slate-50 text-slate-600 hover:text-blue-600 transition duration-300"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80">
                  <NotificationCenter
                    notifications={notifications}
                    clearNotification={clearNotification}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-slate-800">{user?.name}</span>
                <span className="inline-self-end w-fit rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-slate-50 text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition duration-300"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Notifications (Mobile) */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full border border-gray-200 bg-slate-50 text-slate-600"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-72">
                  <NotificationCenter
                    notifications={notifications}
                    clearNotification={clearNotification}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-600 hover:text-blue-600"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition duration-300 ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-600 border-l-2 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </button>
            );
          })}
          
          <div className="border-t border-gray-200 pt-4 mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-800">{user?.name}</span>
                <span className="text-xs text-blue-600 font-bold uppercase">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded border border-red-200 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 transition duration-300"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
