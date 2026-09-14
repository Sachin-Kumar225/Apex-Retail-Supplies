import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Store,
  Sparkles,
  TrendingUp,
  IndianRupee,
  Users,
  CreditCard,
  Target,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  ShieldCheck,
  Zap,
  LogOut,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { BusinessProfile } from '../../types';
import { AmbientBacklight } from '../layout/AmbientBacklight';

interface BusinessSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSignUpFlow?: boolean;
  isStandaloneOnboarding?: boolean;
}

const BUSINESS_TYPES = [
  { id: 'Retail Store', label: 'Retail Store', icon: Store, desc: 'General merchandise, convenience, specialty items' },
  { id: 'Wholesale / Distribution', label: 'Wholesale & B2B', icon: Building2, desc: 'Bulk supply, distributor, trader' },
  { id: 'Grocery / Kirana', label: 'Grocery / Supermarket', icon: Store, desc: 'Food items, packaged goods, daily essentials' },
  { id: 'Electronics & Hardware', label: 'Electronics & Tech', icon: Zap, desc: 'Mobiles, accessories, hardware, gadgets' },
  { id: 'Services & Consulting', label: 'Services & Agency', icon: Briefcase, desc: 'Professional, repairs, agency, freelance' },
  { id: 'Cafe & Restaurant', label: 'Cafe / Restaurant', icon: Store, desc: 'Food & beverage, dine-in, takeaway' },
  { id: 'Pharmacy & Healthcare', label: 'Pharmacy & Health', icon: ShieldCheck, desc: 'Medicines, wellness, healthcare equipment' },
  { id: 'Apparel & Fashion', label: 'Clothing & Fashion', icon: Store, desc: 'Garments, footwear, fashion accessories' },
  { id: 'Other Business', label: 'Other Business', icon: Building2, desc: 'Custom commerce or manufacturing' },
];

const PAYMENT_OPTIONS = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit'];

const GOAL_OPTIONS = [
  { id: 'Maximize Net Profit Margins', label: 'Maximize Net Profit Margins', desc: 'Control operating overhead & increase margins' },
  { id: 'Recover Pending Customer Khata', label: 'Recover Pending Khata', desc: 'Collect overdue customer balances faster' },
  { id: 'Prevent Low Stock & Stockouts', label: 'Keep Zero Stockouts', desc: 'Maintain safe inventory buffers & timely reorders' },
  { id: 'Control Operating Expenses', label: 'Control Daily Expenses', desc: 'Audit supplier costs, rent and utilities' },
  { id: 'Grow Daily Sales Volume', label: 'Grow Daily Sales Volume', desc: 'Attract new customers & boost order sizes' },
  { id: 'Automate Invoicing & Receipts', label: 'Automate Invoicing & Khata', desc: 'Instant clean invoices & credit tracking' },
];

export const BusinessSetupModal: React.FC<BusinessSetupModalProps> = ({
  isOpen,
  onClose,
  isSignUpFlow = false,
  isStandaloneOnboarding = false,
}) => {
  const { businessProfile, saveBusinessProfile, signUp, settings, user, logout } = useBusiness();

  // Step state: 0 = Sign Up (if flow), 1 = Identity & Type, 2 = Products & Daily Volume, 3 = Payments & Goals
  const [currentStep, setCurrentStep] = useState(isSignUpFlow ? 0 : 1);

  // Sign up fields
  const [signUpName, setSignUpName] = useState(businessProfile.ownerName || user?.name || 'Store Owner');
  const [signUpEmail, setSignUpEmail] = useState(user?.email || 'owner@vyapar.in');
  const [signUpPassword, setSignUpPassword] = useState('••••••••');
  const [roleTitle, setRoleTitle] = useState('Owner & Administrator');

  // Questionnaire form state
  const [formData, setFormData] = useState<BusinessProfile>({
    ...businessProfile,
    businessName: businessProfile.businessName || settings.businessName || '',
    ownerName: businessProfile.ownerName || user?.name || settings.ownerName || '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...businessProfile,
        businessName: businessProfile.businessName || settings.businessName || '',
        ownerName: businessProfile.ownerName || user?.name || settings.ownerName || '',
      });
      setCurrentStep(isSignUpFlow ? 0 : 1);
    }
  }, [isOpen, businessProfile, isSignUpFlow, settings, user]);

  if (!isOpen) return null;

  const handleTogglePayment = (method: string) => {
    setFormData((prev) => {
      const exists = prev.paymentMethods.includes(method);
      return {
        ...prev,
        paymentMethods: exists
          ? prev.paymentMethods.filter((m) => m !== method)
          : [...prev.paymentMethods, method],
      };
    });
  };

  const handleToggleGoal = (goalId: string) => {
    setFormData((prev) => {
      const exists = prev.businessGoals.includes(goalId);
      return {
        ...prev,
        businessGoals: exists
          ? prev.businessGoals.filter((g) => g !== goalId)
          : [...prev.businessGoals, goalId],
      };
    });
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpEmail.trim()) return;
    signUp(signUpName.trim(), signUpEmail.trim());
    setFormData((prev) => ({
      ...prev,
      ownerName: signUpName.trim(),
      businessName: prev.businessName || `${signUpName.trim()}'s Business`,
    }));
    setCurrentStep(1);
  };

  const handleSaveQuestionnaire = () => {
    const updated: BusinessProfile = {
      ...formData,
      businessName: formData.businessName.trim() || 'My Business',
      ownerName: formData.ownerName.trim() || signUpName || 'Business Owner',
      approxDailySales: Number(formData.approxDailySales) || 0,
      approxDailyExpenses: Number(formData.approxDailyExpenses) || 0,
      approxDailyCustomers: Number(formData.approxDailyCustomers) || 0,
      hasCompletedSetup: true,
      setupDate: new Date().toISOString().split('T')[0],
    };

    saveBusinessProfile(updated);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto ${
        isStandaloneOnboarding
          ? 'bg-[#060b17] min-h-screen'
          : 'bg-black/80 backdrop-blur-sm'
      }`}
    >
      {isStandaloneOnboarding && <AmbientBacklight intensity="high" showGrid={true} />}

      <div className="relative w-full max-w-2xl my-6">
        {/* Backside Intense Lighting Halo */}
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-cyan-400 via-purple-500 via-pink-500 to-sky-400 opacity-60 blur-2xl animate-aura-spin pointer-events-none -z-10" />
        <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 opacity-30 blur-3xl pointer-events-none -z-10" />

        <div className="relative w-full bg-[#0a1324]/95 border border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.25)] text-slate-200 overflow-hidden backdrop-blur-xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Header */}
        <div className="relative z-10 px-6 py-5 border-b border-blue-900/50 flex items-center justify-between bg-[#080e1c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-cyan-950/50 border border-cyan-400/40">
              <Sparkles className="w-5 h-5 text-cyan-100" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                {currentStep === 0 ? 'Sign Up & Register Store' : 'Tell Us About Your Business'}
                <span className="text-[10px] font-bold bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {currentStep === 0 ? 'Step 1 of 4' : `Step ${currentStep} of 3`}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {currentStep === 0
                  ? 'Create your account to unlock AI-powered business management'
                  : 'Answer a few quick questions to personalize your dashboard benchmarks and AI commands'}
              </p>
            </div>
          </div>

          {isStandaloneOnboarding ? (
            <button
              type="button"
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-rose-400 bg-blue-950/40 hover:bg-rose-950/40 text-xs font-semibold border border-blue-900/50 hover:border-rose-500/30 transition-all cursor-pointer"
              title="Sign Out to Login Screen"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-950/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Progress Bar */}
        <div className="relative z-10 w-full bg-[#060c18] px-6 py-3 border-b border-blue-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center gap-1.5 font-semibold text-[11px] ${
                  currentStep === s
                    ? 'text-cyan-300 font-bold'
                    : currentStep > s
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                    currentStep === s
                      ? 'bg-cyan-500 text-black font-black border-cyan-300'
                      : currentStep > s
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : 'bg-blue-950 text-slate-400 border-blue-900'
                  }`}
                >
                  {currentStep > s ? '✓' : s}
                </span>
                <span className="hidden sm:inline">
                  {s === 1 ? 'Business Identity' : s === 2 ? 'Daily Targets' : 'Goals & Payments'}
                </span>
              </div>
            ))}
          </div>

          {currentStep > 0 && (
            <span className="text-[11px] text-slate-400 font-mono">
              Progress: {Math.round((currentStep / 3) * 100)}%
            </span>
          )}
        </div>

        {/* Body Content */}
        <div className="relative z-10 p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* STEP 0: Sign Up */}
          {currentStep === 0 && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div className="bg-[#0c172e] p-4 rounded-xl border border-blue-900/60 space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Account Credentials
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Your Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-blue-900/70 text-white focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="e.g. store@business.com"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-blue-900/70 text-white focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Password / Security PIN
                    </label>
                    <input
                      type="password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Enter a secure password"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-blue-900/70 text-white focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Store Role
                    </label>
                    <select
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-blue-900/70 text-white focus:outline-none focus:border-cyan-500/60"
                    >
                      <option value="Owner & Administrator">Owner & Administrator</option>
                      <option value="Store Partner">Store Partner</option>
                      <option value="General Manager">General Manager</option>
                      <option value="Cashier & Billing">Cashier & Billing</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-2.5 text-xs text-cyan-200">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  After signing up, you will answer a brief 1-minute questionnaire about your business
                  model, daily targets, and goals to fully personalize your AI Command Center.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  Skip to questionnaire with demo profile →
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 theme-btn-primary rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <span>Sign Up & Start Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 1: Business Identity & Type */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Business / Shop Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Apex Retail & Supplies"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-blue-900/70 text-white focus:outline-none focus:border-cyan-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Owner / Manager Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-blue-900/70 text-white focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  Select Business Type / Industry <span className="text-cyan-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {BUSINESS_TYPES.map((b) => {
                    const Icon = b.icon;
                    const isSelected = formData.businessType === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setFormData({ ...formData, businessType: b.id })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#0e2142] border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400'
                            : 'bg-[#081224] hover:bg-[#0c1830] border-blue-900/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {b.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{b.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Primary Currency Symbol
                </label>
                <div className="flex items-center gap-2">
                  {['₹', '$', '€', '£', 'AED', 'CAD'].map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setFormData({ ...formData, currency: curr })}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        formData.currency === curr
                          ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                          : 'bg-[#081224] text-slate-300 border-blue-900/60 hover:bg-blue-950'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Products, Services & Daily Volume */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Main Products or Services Offered
                </label>
                <textarea
                  rows={2}
                  value={formData.productsServices}
                  onChange={(e) => setFormData({ ...formData, productsServices: e.target.value })}
                  placeholder="e.g. Mobile accessories, chargers, headphones, electronics, phone repairs"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-[#060c18] border border-blue-900/70 text-white focus:outline-none focus:border-cyan-500/60"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  AI uses this to customize product bundling, stock warning thresholds, and margin recommendations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl bg-[#081224] border border-blue-900/60">
                  <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold mb-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Approx. Daily Sales
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                      {formData.currency}
                    </span>
                    <input
                      type="number"
                      value={formData.approxDailySales}
                      onChange={(e) =>
                        setFormData({ ...formData, approxDailySales: Number(e.target.value) })
                      }
                      placeholder="1200"
                      className="w-full text-xs sm:text-sm pl-7 pr-3 py-2 rounded-lg bg-[#060c18] border border-blue-900/70 text-white font-mono font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Expected daily revenue target</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#081224] border border-blue-900/60">
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    Approx. Daily Expenses
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                      {formData.currency}
                    </span>
                    <input
                      type="number"
                      value={formData.approxDailyExpenses}
                      onChange={(e) =>
                        setFormData({ ...formData, approxDailyExpenses: Number(e.target.value) })
                      }
                      placeholder="250"
                      className="w-full text-xs sm:text-sm pl-7 pr-3 py-2 rounded-lg bg-[#060c18] border border-blue-900/70 text-white font-mono font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Rent, tea, staff, utilities</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#081224] border border-blue-900/60">
                  <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold mb-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Daily Customer Count
                  </div>
                  <input
                    type="number"
                    value={formData.approxDailyCustomers}
                    onChange={(e) =>
                      setFormData({ ...formData, approxDailyCustomers: Number(e.target.value) })
                    }
                    placeholder="25"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg bg-[#060c18] border border-blue-900/70 text-white font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Footfall or orders / day</p>
                </div>
              </div>

              {/* Target Margins Preview */}
              {formData.approxDailySales > 0 && (
                <div className="p-3 rounded-xl bg-[#07101f] border border-cyan-500/20 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Estimated Benchmark Daily Profit:</span>
                  <span className="text-cyan-300 font-mono font-bold">
                    {formData.currency}
                    {(formData.approxDailySales - (formData.approxDailyExpenses || 0)).toLocaleString()}{' '}
                    (
                    {formData.approxDailySales > 0
                      ? Math.round(
                          ((formData.approxDailySales - (formData.approxDailyExpenses || 0)) /
                            formData.approxDailySales) *
                            100
                        )
                      : 0}
                    % margin)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Payment Methods & Business Goals */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  Accepted Payment Methods (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_OPTIONS.map((method) => {
                    const isSelected = formData.paymentMethods.includes(method);
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => handleTogglePayment(method)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                            : 'bg-[#081224] text-slate-400 border-blue-900/60 hover:text-slate-200'
                        }`}
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>{method}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  Select Your Top Business Goals (AI focuses recommendations on these)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = formData.businessGoals.includes(goal.id);
                    return (
                      <div
                        key={goal.id}
                        onClick={() => handleToggleGoal(goal.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#0d1e3c] border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                            : 'bg-[#081224] hover:bg-[#0c1830] border-blue-900/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Target className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                            <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {goal.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{goal.desc}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-cyan-500 border-cyan-300 text-black'
                              : 'border-blue-800 bg-[#060c18]'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-black stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="relative z-10 px-6 py-4 border-t border-blue-900/50 bg-[#080e1c] flex items-center justify-between">
          <div>
            {currentStep > (isSignUpFlow ? 0 : 1) ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-blue-950/40 rounded-xl border border-blue-900/50 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center gap-2">
            {isStandaloneOnboarding ? (
              <button
                type="button"
                onClick={handleSaveQuestionnaire}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
                title="Use recommended default benchmarks"
              >
                Use Defaults & Launch Dashboard →
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 0) {
                    setCurrentStep(1);
                  } else {
                    setCurrentStep((prev) => prev + 1);
                  }
                }}
                className="px-5 py-2 theme-btn-primary rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveQuestionnaire}
                className="px-5 py-2 theme-btn-primary rounded-xl text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.45)]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-200" />
                <span>Save Profile & Launch Dashboard 🚀</span>
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
