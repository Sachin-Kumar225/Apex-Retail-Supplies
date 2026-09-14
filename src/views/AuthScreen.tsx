import React, { useState } from 'react';
import {
  Store,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { AmbientBacklight } from '../components/layout/AmbientBacklight';
import {
  authSignIn,
  authSignUp,
  authResetPassword,
  isSupabaseConfigured,
} from '../lib/supabase';
import { initialUser } from '../data/mockData';

type AuthMode = 'signin' | 'signup' | 'forgot';

export const AuthScreen: React.FC = () => {
  const { login, signUp, settings } = useBusiness();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('owner@store.com');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetFormState = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (newMode === 'signin') {
      setEmail('owner@store.com');
      setPassword('password123');
    } else {
      setPassword('');
      setConfirmPassword('');
    }
  };

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your business email address.');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address (e.g., owner@store.com).');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authSignIn(email, password);

      if (response.error) {
        setErrorMessage(response.error);
        setIsLoading(false);
        return;
      }

      // Successful auth
      const authUser = response.data?.user;
      const displayName =
        authUser?.user_metadata?.name ||
        (email.toLowerCase().includes('rajesh') ? 'Rajesh Sharma' : email.split('@')[0]);

      login(email.trim(), displayName);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your business email address.');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please create a password for your account.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const bName = businessName.trim() || `${fullName.trim()}'s Store`;
      const response = await authSignUp(email, password, {
        name: fullName.trim(),
        businessName: bName,
        role: 'Owner',
      });

      if (response.error) {
        setErrorMessage(response.error);
        setIsLoading(false);
        return;
      }

      if (response.data?.confirmationRequired) {
        setSuccessMessage(
          'Account created successfully! A verification email has been dispatched. Please confirm your email, or sign in.'
        );
        setIsLoading(false);
      } else {
        setSuccessMessage('Account created successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          signUp(fullName.trim(), email.trim(), bName);
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authResetPassword(email);
      if (response.error) {
        setErrorMessage(response.error);
      } else {
        setSuccessMessage(
          `Password reset link has been dispatched to ${email.trim()}. Please check your inbox and follow the instructions.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to dispatch reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Login
  const handleQuickDemoLogin = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      login(initialUser.email, initialUser.name);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#060b17] flex flex-col justify-center items-center px-4 py-8 relative selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* Multi-Colour Lighting From Backside */}
      <AmbientBacklight intensity="high" showGrid={true} />

      {/* Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold mb-3 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AI-Powered Commerce & Finance Cloud</span>
          </div>

          <div className="flex items-center justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 text-white shadow-xl shadow-cyan-950/60 border border-cyan-400/40 flex items-center justify-center">
              <Store className="w-7 h-7 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {settings.businessName || 'Vyapar Business Manager'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            All-in-one AI platform for sales, khata, stock & business intelligence
          </p>
        </div>

        {/* Main Card with Radiant Multi-Colour Backside Lighting Aura */}
        <div className="relative group">
          {/* Backside Intense Multi-Colour Lighting Halo */}
          <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-cyan-400 via-purple-500 via-pink-500 to-sky-400 opacity-70 blur-xl group-hover:opacity-100 transition duration-700 animate-aura-spin pointer-events-none -z-10" />
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 opacity-35 blur-2xl pointer-events-none -z-10" />

          <div className="bg-[#0b1426]/90 border border-cyan-400/30 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.25)] backdrop-blur-2xl p-6 sm:p-7 relative overflow-hidden">
            {/* Subtle Top Accent Border with Electric Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-300 via-purple-400 to-pink-500 shadow-[0_0_12px_#38bdf8]" />

            {/* Mode Switcher Tabs (Only when not in forgot password) */}
            {mode !== 'forgot' && (
            <div className="flex rounded-xl bg-[#060d1d] p-1 border border-blue-950 mb-5">
              <button
                type="button"
                onClick={() => resetFormState('signin')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => resetFormState('signup')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Header Title depending on Mode */}
          <div className="mb-4">
            {mode === 'signin' && (
              <div>
                <h2 className="text-lg font-bold text-white">Welcome Back</h2>
                <p className="text-xs text-slate-400">Sign in to access your store's dashboard and ledger</p>
              </div>
            )}
            {mode === 'signup' && (
              <div>
                <h2 className="text-lg font-bold text-white">Create Business Account</h2>
                <p className="text-xs text-slate-400">Join Vyapar to automate billing, Khata recovery & inventory</p>
              </div>
            )}
            {mode === 'forgot' && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => resetFormState('signin')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-950/70 transition-colors"
                  title="Back to Sign In"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-white">Reset Password</h2>
                  <p className="text-xs text-slate-400">Enter your email to receive recovery instructions</p>
                </div>
              </div>
            )}
          </div>

          {/* Alerts: Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Alerts: Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Prominent Login Credentials Info Card */}
              <div className="p-3.5 rounded-xl bg-blue-950/70 border border-cyan-500/40 text-xs text-slate-300 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block leading-tight">Demo Login Info</span>
                      <span className="text-[10px] text-cyan-300/80">Ready-to-use account credentials</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('owner@store.com');
                      setPassword('password123');
                    }}
                    className="text-[10px] font-bold px-2 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/60 transition-colors cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#060e1d]/85 p-2 rounded-lg border border-blue-900/50">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Email</span>
                    <span className="font-mono text-cyan-200 select-all font-semibold break-all">owner@store.com</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Password</span>
                    <span className="font-mono text-cyan-200 select-all font-semibold">password123</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="e.g. storeowner@vyapar.in"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full text-xs theme-input pl-10 pr-3 py-2.5 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => resetFormState('forgot')}
                    className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full text-xs theme-input pl-10 pr-10 py-2.5 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-blue-900/80 bg-[#071120] text-cyan-500 focus:ring-cyan-500"
                  />
                  Remember my session
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold theme-btn-primary mt-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Patel"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full text-xs theme-input pl-10 pr-3 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business / Store Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Patel Supermarket & Electronics"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full text-xs theme-input pl-10 pr-3 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="e.g. contact@patelstore.in"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full text-xs theme-input pl-10 pr-3 py-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="w-full text-xs theme-input pl-9 pr-3 py-2.5 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="w-full text-xs theme-input pl-9 pr-3 py-2.5 font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold theme-btn-primary mt-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account & Start Business Setup
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered account email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full text-xs theme-input pl-10 pr-3 py-2.5 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold theme-btn-primary cursor-pointer transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                    Dispatching Link...
                  </>
                ) : (
                  <>
                    Send Password Reset Link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => resetFormState('signin')}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Remembered your password? <span className="text-cyan-400 font-semibold underline">Sign in</span>
                </button>
              </div>
            </form>
          )}

          {/* Quick Access Options */}
          <div className="mt-5 pt-4 border-t border-blue-900/50 space-y-2">
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500 mb-2">
              <span className="bg-[#0b1426] px-2.5 tracking-wider">Fast Testing & Preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-blue-950/70 hover:bg-blue-900/70 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 transition-all cursor-pointer hover-light-btn"
                title="Log in directly as active demo owner with existing sales and khata records"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Demo Owner (Dashboard)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  signUp('Rohit Verma', 'rohit@apexstore.in', 'Apex Supermarket');
                }}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/60 transition-all cursor-pointer hover-light-btn"
                title="Create account and go straight to the business setup questions"
              >
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                <span>New Store (Test Questions)</span>
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Footer Security Badge & Supabase Auth Status */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 px-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit Encrypted Session Security</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Supabase Auth Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Supabase Mode Ready
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
