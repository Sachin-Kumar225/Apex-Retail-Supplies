import React, { useState } from 'react';
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
  ChevronRight,
  Store,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#060b17] flex flex-col md:flex-row text-slate-200 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#080e1e]/95 backdrop-blur-md border-b border-blue-950/70 sticky top-0 z-40 shadow-lg shadow-black/40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-950/60 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black flex items-center justify-center shadow-md shadow-cyan-950/50 text-sm border border-cyan-400/30">
              {settings.businessName.charAt(0) || 'B'}
            </div>
            <div className="truncate max-w-[150px]">
              <span className="font-extrabold text-sm text-white block truncate">
                {settings.businessName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleNavClick('assistant')}
            className="p-2 rounded-xl text-cyan-400 hover:bg-cyan-950/40 transition-colors relative"
            title="AI Assistant"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleNavClick('notifications')}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-blue-950/60 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#080e1e] shadow-[0_0_8px_#22d3ee]"></span>
            )}
          </button>
        </div>
      </header>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#080e1e] border-r border-blue-950/70 h-screen sticky top-0 z-30 shrink-0 select-none">
        {/* Brand Banner */}
        <div className="p-5 border-b border-blue-950/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-600 to-cyan-500 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-cyan-950/40 border border-cyan-400/30">
            {settings.businessName.charAt(0) || 'B'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-white truncate leading-tight tracking-tight">
              {settings.businessName}
            </h2>
            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
              {settings.ownerName}
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold nav-glow-item ${
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
                        : 'text-slate-500 group-hover:text-slate-300'
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

        {/* Operational Health Badge */}
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

        {/* Footer Account Summary */}
        <div className="p-3.5 border-t border-blue-950/60 bg-[#070d1a] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-950 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center">
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
              onClick={() => {
                if (confirm('Sign out of your business workspace?')) {
                  logout();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Slide-out for all 11 sections) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          {/* Drawer Menu */}
          <div className="relative w-4/5 max-w-xs bg-[#080e1e] border-r border-blue-950/80 h-full flex flex-col z-10 shadow-2xl">
            <div className="p-4 border-b border-blue-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black flex items-center justify-center shadow-xs border border-cyan-400/30">
                  {settings.businessName.charAt(0) || 'B'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate">
                    {settings.businessName}
                  </h3>
                  <p className="text-[11px] text-slate-400">{settings.ownerName}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-950/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold nav-glow-item ${
                      isActive
                        ? 'active-nav-glow font-bold'
                        : item.isAi
                        ? 'text-cyan-300 bg-cyan-950/25'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-blue-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : ''}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isActive
                            ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/40'
                            : item.badgeColor || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-blue-950/60 bg-[#060b16] text-xs text-slate-400 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-semibold text-slate-200 truncate">{user?.name || settings.businessName}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email || settings.ownerName}</div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (confirm('Sign out of your business workspace?')) {
                    logout();
                  }
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full mb-16 md:mb-0">
        {children}
      </main>

      {/* Mobile Bottom Quick-Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#080e1e]/95 backdrop-blur-md border-t border-blue-950/80 py-1.5 px-3 flex items-center justify-around z-40 shadow-xl shadow-black">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'sales', label: 'Sales', icon: ShoppingCart },
          { id: 'payments', label: 'Khata', icon: CreditCard },
          { id: 'products', label: 'Stock', icon: Package },
          { id: 'assistant', label: 'AI Assistant', icon: Sparkles, isAi: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleNavClick(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-cyan-400 font-bold'
                  : tab.isAi
                  ? 'text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`relative ${tab.isAi ? 'p-1 rounded-lg bg-cyan-950/50' : ''}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5] drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]' : ''}`} />
                {tab.id === 'payments' && metrics.pendingPayments > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-[#080e1e] shadow-[0_0_6px_#f59e0b]" />
                )}
              </div>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
