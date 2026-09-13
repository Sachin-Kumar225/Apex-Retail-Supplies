import React, { useState } from 'react';
import { X, UserPlus, Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignedUp: () => void;
}

export const SignUpModal: React.FC<SignUpModalProps> = ({ isOpen, onClose, onSignedUp }) => {
  const { signUp } = useBusiness();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }

    signUp(name.trim(), email.trim());
    onSignedUp();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0b1426] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/50 p-6 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center border border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
              <UserPlus className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Create Business Account</h2>
              <p className="text-xs text-slate-400">Step 1: Account Registration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-950/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="relative z-10 mt-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-2.5 text-xs text-cyan-200">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Signing up will immediately launch the <strong>Business Setup Questionnaire</strong> to personalize your financial dashboard & AI engine.
          </span>
        </div>

        {error && (
          <div className="relative z-10 mt-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative z-10 mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Your Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
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
                placeholder="ramesh@vyaparstore.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="w-full text-xs theme-input pl-10 pr-3 py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs theme-input pl-10 pr-3 py-2.5"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 shadow-lg shadow-cyan-950/40 transition-all hover:-translate-y-0.5"
            >
              <span>Sign Up & Continue to Business Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="relative z-10 mt-4 pt-3 border-t border-blue-900/40 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Private & Encrypted
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-cyan-400 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
