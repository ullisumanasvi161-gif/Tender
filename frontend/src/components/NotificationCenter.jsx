import React from 'react';
import { Bell, X, Check, AlertTriangle, FileText } from 'lucide-react';

export default function NotificationCenter({ notifications, clearNotification, onClose }) {
  
  const handleMarkAllRead = () => {
    notifications.forEach(n => clearNotification(n.id));
  };

  return (
    <div className="glass-panel rounded-lg border border-gold-primary/20 shadow-2xl p-4 overflow-hidden text-left max-h-96 flex flex-col animate-gold-glow">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gold-primary" />
          <h3 className="font-semibold text-sm text-white tracking-wide">Notifications</h3>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] text-gold-primary hover:underline font-semibold"
            >
              Clear All
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 space-y-2 max-h-72">
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">
            No new notifications
          </div>
        ) : (
          notifications.map((notif) => {
            const isAlert = notif.type === 'alert';
            return (
              <div
                key={notif.id}
                className={`flex gap-3 rounded p-2.5 transition duration-200 ${
                  isAlert 
                    ? 'bg-red-500/5 border border-red-500/10 hover:bg-red-500/10' 
                    : 'bg-gold-primary/5 border border-gold-primary/10 hover:bg-gold-primary/10'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isAlert ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-gold-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-200 font-medium leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[9px] text-gray-500 block mt-1">
                    {notif.time}
                  </span>
                </div>
                <button
                  onClick={() => clearNotification(notif.id)}
                  className="shrink-0 text-gray-600 hover:text-white self-start"
                >
                  <Check className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
