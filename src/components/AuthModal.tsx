import React, { useState } from 'react';
import { X, LogIn, UserPlus, Lock, Mail, User as UserIcon, School, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register({
          name,
          email,
          password,
          college,
          branch,
          semester
        });
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.login({ email, password });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.demoLogin(demoEmail);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="auth-modal-card"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">
              {isRegister ? 'Create Student Account' : 'Welcome back to StudySwap'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRegister 
                ? 'Join your peers to share, bookmark, and download study notes' 
                : 'Access your saved notes, upload materials, and view stats'}
            </p>
          </div>
          <button
            id="auth-modal-close"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="px-6 pt-4 pb-3 bg-indigo-50/60 border-b border-indigo-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Instant Demo Login (One-click)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="demo-login-aarav"
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('aarav@college.edu')}
              className="px-2 py-1.5 bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg text-left text-xs transition-colors cursor-pointer"
            >
              <div className="font-semibold text-slate-800 truncate">Aarav S.</div>
              <div className="text-[10px] text-slate-500">CS 5th Sem</div>
            </button>
            <button
              id="demo-login-priya"
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('priya@college.edu')}
              className="px-2 py-1.5 bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg text-left text-xs transition-colors cursor-pointer"
            >
              <div className="font-semibold text-slate-800 truncate">Priya P.</div>
              <div className="text-[10px] text-slate-500">EE 4th Sem</div>
            </button>
            <button
              id="demo-login-rohan"
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('rohan@college.edu')}
              className="px-2 py-1.5 bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg text-left text-xs transition-colors cursor-pointer"
            >
              <div className="font-semibold text-slate-800 truncate">Rohan V.</div>
              <div className="text-[10px] text-slate-500">IT 6th Sem</div>
            </button>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-register-name"
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">College / Univ</label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-register-college"
                      type="text"
                      placeholder="e.g. DTU / IIT"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch / Course</label>
                  <input
                    id="input-register-branch"
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Semester</label>
                <select
                  id="select-register-semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="1">1st Semester</option>
                  <option value="2">2nd Semester</option>
                  <option value="3">3rd Semester</option>
                  <option value="4">4th Semester</option>
                  <option value="5">5th Semester</option>
                  <option value="6">6th Semester</option>
                  <option value="7">7th Semester</option>
                  <option value="8">8th Semester</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Student Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="input-auth-email"
                type="email"
                required
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="input-auth-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span>Please wait...</span>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Modal Footer Toggle */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-600">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                id="btn-switch-to-login"
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                className="text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New student to StudySwap?{' '}
              <button
                id="btn-switch-to-register"
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                className="text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                Register Now
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
