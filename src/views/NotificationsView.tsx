import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Info,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { formatDateTime } from '../utils/formatters';
import { AppNotification } from '../types';

interface NotificationsViewProps {
  onNavigate: (section: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const {
    notifications,
    markNotificationAsRead: markNotificationRead,
    markAllNotificationsAsRead: markAllNotificationsRead,
    clearNotifications,
  } = useBusiness();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'STOCK' | 'PAYMENT' | 'SALE'>('ALL');

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'STOCK') return n.type === 'stock';
    if (filter === 'PAYMENT') return n.type === 'payment';
    if (filter === 'SALE') return n.type === 'sale';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.read) markNotificationRead(n.id);
    if (n.linkSection) onNavigate(n.linkSection);
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'stock':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'sale':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 theme-card p-5 sm:p-6 theme-card-hover">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Business Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-cyan-950/70 text-cyan-300 rounded-full border border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.15)]">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time stock alerts, payment collection reminders, and order confirmations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold theme-btn-secondary rounded-xl"
            >
              <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="theme-card p-3 theme-card-hover flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'ALL', label: `All (${notifications.length})` },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'STOCK', label: 'Stock Alerts' },
          { id: 'PAYMENT', label: 'Khata Dues' },
          { id: 'SALE', label: 'Sales Orders' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id as any)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 whitespace-nowrap ${
              filter === btn.id
                ? 'theme-btn-primary'
                : 'theme-btn-secondary'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="theme-card overflow-hidden divide-y divide-blue-900/40">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No notifications in this category.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 sm:p-5 flex items-start gap-4 cursor-pointer hover:bg-blue-900/25 transition-all duration-200 ${
                !n.read ? 'bg-blue-950/40 font-medium' : ''
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  n.type === 'stock'
                    ? 'bg-rose-950/60 border-rose-500/30 text-rose-400'
                    : n.type === 'payment'
                    ? 'bg-amber-950/60 border-amber-500/30 text-amber-400'
                    : n.type === 'sale'
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                    : 'bg-blue-950/60 border-cyan-500/30 text-cyan-400'
                }`}
              >
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white">{n.title}</h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] inline-block"></span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                    {formatDateTime(n.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
              </div>

              <div className="text-slate-500 self-center">
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
