import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Receipt,
  CreditCard,
  FileText,
  BarChart3,
  Sparkles,
  Bell,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useBusiness } from '../../context/BusinessContext';
import { AmbientBacklight } from './AmbientBacklight';

interface AppLayoutProps {
  currentSection: string;
  onNavigate: (section: string) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  isAi?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentSection,
  onNavigate,
  children,
}) => {
  const { settings, metrics, notifications, user, logout } = useBusiness();
  const [navMenuOpen, setNavMenuOpen] = useState(false);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNavMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    {
      id: 'products',
      label: 'Products / Stock',
      icon: Package,
      badge: metrics.lowStockProducts > 0 ? metrics.lowStockProducts : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    {
      id: 'payments',
      label: 'Payments / Khata',
      icon: CreditCard,
      badge: metrics.pendingPayments > 0 ? 'Due' : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
    },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-indigo-600 text-white font-bold',
      isAi: true,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
      badgeColor: 'bg-indigo-600 text-white',
    },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setNavMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#060b17] flex flex-col text-slate-200 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Multi-Colour Lighting From Backside */}
      <AmbientBacklight intensity="high" showGrid={true} />

      {/* Top Header Bar with Three Small Lines Menu Button at Top-Left */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3 bg-[#080e1e]/90 backdrop-blur-xl border-b border-blue-900/40 shadow-lg shadow-black/50">
        {/* Top Left: Three small lines button + Business Branding */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Three Small Lines Hamburger Button */}
          <button
            id="main-nav-hamburger-btn"
            onClick={() => setNavMenuOpen(true)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#0a1529]/90 hover:bg-[#0f2244] border border-blue-900/70 hover:border-cyan-400/80 text-slate-200 hover:text-cyan-300 shadow-md shadow-black/40 transition-all cursor-pointer hover-pop group"
            aria-label="Open Navigation Menu"
            title="Navigation Menu"
          >
            {/* Visual Three Small Lines */}
            <div className="flex flex-col justify-center items-center w-5 h-4.5 gap-[3.5px]" aria-hidden="true">
              <span className="w-4.5 h-[2px] bg-cyan-400 rounded-full group-hover:w-5 group-hover:bg-cyan-300 transition-all shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="w-3.5 h-[2px] bg-cyan-400 rounded-full group-hover:w-5 group-hover:bg-cyan-300 transition-all shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="w-4.5 h-[2px] bg-cyan-400 rounded-full group-hover:w-5 group-hover:bg-cyan-300 transition-all shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </div>
            <span className="text-xs font-bold tracking-wide uppercase text-slate-300 group-hover:text-cyan-200 hidden sm:inline">
              Menu
            </span>
          </button>

          {/* Business Branding & Active Screen Indicator */}
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="Go to Dashboard"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-600 to-cyan-500 text-white font-black flex items-center justify-center shadow-md shadow-cyan-950/50 text-sm border border-cyan-400/30 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all">
              {settings.businessName.charAt(0) || 'B'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white truncate group-hover:text-cyan-300 transition-colors">
                  {settings.businessName}
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-blue-950/60 border border-blue-900/50 text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
                  {navItems.find((item) => item.id === currentSection)?.label || currentSection}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Right: AI quick assistant, Notifications, User info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => handleNavClick('assistant')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 hover:border-cyan-400/80 transition-all text-xs font-bold hover-pop cursor-pointer shadow-sm shadow-cyan-950/40"
            title="AI Business Advisor"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">AI Advisor</span>
          </button>

          <button
            onClick={() => handleNavClick('notifications')}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-[#0b172e] hover:bg-blue-900/40 border border-blue-900/60 hover:border-cyan-500/40 transition-all relative hover-pop cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-cyan-500 text-[#080e1e] text-[9px] font-black flex items-center justify-center ring-2 ring-[#080e1e] shadow-[0_0_8px_#22d3ee]">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* User Profile Avatar Quick Trigger */}
          <div
            onClick={() => setNavMenuOpen(true)}
            className="flex items-center gap-2 pl-1 cursor-pointer group"
            title="Account & Navigation"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-900 to-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center group-hover:border-cyan-400 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.4)] transition-all">
              {(user?.name || settings.ownerName).charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer containing all features */}
      <AnimatePresence>
        {navMenuOpen && (
          <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setNavMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-80 max-w-[85vw] bg-[#080e1e]/98 backdrop-blur-2xl border-r border-cyan-500/30 h-full flex flex-col z-10 shadow-2xl shadow-cyan-950/60"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-blue-950/80 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-600 to-cyan-500 text-white font-black text-base flex items-center justify-center shadow-lg shadow-cyan-950/50 border border-cyan-400/30 shrink-0">
                    {settings.businessName.charAt(0) || 'B'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-black text-white truncate leading-tight">
                      {settings.businessName}
                    </h2>
                    <p className="text-[11px] text-cyan-400 truncate mt-0.5 font-medium">
                      {settings.ownerName}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setNavMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-blue-950/60 border border-transparent hover:border-blue-800/60 transition-colors cursor-pointer hover-pop"
                  aria-label="Close menu"
                  title="Close Menu (Esc)"
                >
                  <X className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              {/* Navigation Items (All items: Dashboard, Sales, Customers, Product/Stock, Expenses, Payment Khata, Invoices, Reports, AI, Notifications, Settings) */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Navigation
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold nav-glow-item cursor-pointer ${
                        isActive
                          ? 'active-nav-glow font-bold'
                          : item.isAi
                          ? 'text-cyan-300 bg-cyan-950/25 hover:bg-cyan-950/40 border border-cyan-900/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-blue-950/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]'
                              : item.isAi
                              ? 'text-cyan-400'
                              : 'text-slate-500'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                            isActive
                              ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                              : item.badgeColor
                              ? item.badgeColor
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Operational Health Status */}
              <div className="p-3.5 mx-3 mb-3 bg-[#0c1527] border border-blue-900/40 rounded-xl text-xs shadow-xs">
                <div className="flex items-center justify-between font-semibold text-slate-300">
                  <span className="text-[11px] text-slate-400">Inventory Status</span>
                  <span className={metrics.lowStockProducts > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {metrics.lowStockProducts > 0 ? `${metrics.lowStockProducts} low stock` : 'Optimal'}
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metrics.lowStockProducts > 0
                        ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                        : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    }`}
                    style={{
                      width: `${Math.max(10, Math.min(100, 100 - metrics.lowStockProducts * 15))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Footer Account Summary & Logout */}
              <div className="p-3.5 border-t border-blue-950/80 bg-[#070d1a] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-950 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center shrink-0">
                    {(user?.name || settings.ownerName).charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {user?.name || settings.ownerName}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">{user?.email || 'Business Manager'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleNavClick('settings')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-blue-950/60 transition-colors cursor-pointer"
                    title="Settings"
                  >
                    <SettingsIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNavMenuOpen(false);
                      logout();
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area - Full Screen Width */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
