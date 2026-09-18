import React from 'react';
import { BookOpen, Upload, User as UserIcon, LogIn, Heart, FileText, BarChart2, Sparkles, LogOut } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenUpload: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenUpload,
  onLogout
}) => {
  return (
    <>
      {/* Desktop & Tablet Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <div 
              id="brand-logo"
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xl tracking-tight text-slate-900 font-display">StudySwap</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">MVP</span>
                </div>
                <span className="text-xs text-slate-500 -mt-0.5 hidden sm:inline">Student Notes & Study Resource Hub</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                id="nav-tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Dashboard
              </button>

              <button
                id="nav-tab-subjects"
                onClick={() => setActiveTab('subjects')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === 'subjects'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                Subjects
              </button>

              <button
                id="nav-tab-stats"
                onClick={() => setActiveTab('stats')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === 'stats'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                Statistics
              </button>

              {user && (
                <>
                  <button
                    id="nav-tab-bookmarks"
                    onClick={() => setActiveTab('bookmarks')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      activeTab === 'bookmarks'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    Saved Notes
                  </button>
                </>
              )}
            </nav>

            {/* Right Action buttons */}
            <div className="flex items-center gap-3">
              <button
                id="btn-upload-notes"
                onClick={onOpenUpload}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-sm transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Notes</span>
              </button>

              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <button
                    id="btn-profile"
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all cursor-pointer ${
                      activeTab === 'profile'
                        ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold max-w-[90px] truncate hidden sm:inline">
                      {user.name}
                    </span>
                  </button>

                  <button
                    id="btn-logout"
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="btn-open-auth"
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login / Register</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          id="mobile-nav-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
            activeTab === 'dashboard' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>Feed</span>
        </button>

        <button
          id="mobile-nav-subjects"
          onClick={() => setActiveTab('subjects')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
            activeTab === 'subjects' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Subjects</span>
        </button>

        <button
          id="mobile-nav-upload"
          onClick={onOpenUpload}
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-300">
            <Upload className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 mt-1">Upload</span>
        </button>

        <button
          id="mobile-nav-stats"
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
            activeTab === 'stats' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span>Stats</span>
        </button>

        <button
          id="mobile-nav-profile"
          onClick={() => (user ? setActiveTab('profile') : onOpenAuth())}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
            activeTab === 'profile' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
          }`}
        >
          {user ? (
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
          <span>{user ? 'Profile' : 'Login'}</span>
        </button>
      </div>
    </>
  );
};
