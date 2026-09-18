import React from 'react';
import { FileText, Download, Users, BookOpen, Award, TrendingUp, Sparkles } from 'lucide-react';
import { PlatformStats, User } from '../types';

interface StatsSectionProps {
  stats: PlatformStats | null;
  currentUser: User | null;
  onSelectSubject?: (subjectId: number) => void;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats, currentUser, onSelectSubject }) => {
  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Notes Uploaded</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
              {stats.global.totalNotes}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
              Across all engineering & science branches
            </span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Downloads</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
              {stats.global.totalDownloads}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
              Study material downloads by students
            </span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Students</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
              {stats.global.totalStudents}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Registered student contributors
            </span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Subjects Covered</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
              {stats.global.totalSubjects}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Core academic courses
            </span>
          </div>
        </div>
      </div>

      {/* User's Personal Statistics (If Logged In) */}
      {currentUser && stats.userStats && (
        <div className="p-6 bg-linear-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Your Student Activity
              </span>
              <h3 className="text-lg font-bold text-white font-display mt-0.5">
                {currentUser.name} • Statistics
              </h3>
            </div>
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Semester {currentUser.semester} • {currentUser.branch || 'Student'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="bg-white/10 p-4 rounded-xl border border-white/10">
              <span className="text-xs text-indigo-200 block">Notes Uploaded</span>
              <span className="text-2xl font-bold font-display mt-1 block">
                {stats.userStats.myUploads}
              </span>
            </div>

            <div className="bg-white/10 p-4 rounded-xl border border-white/10">
              <span className="text-xs text-indigo-200 block">Downloads Received</span>
              <span className="text-2xl font-bold font-display mt-1 block">
                {stats.userStats.myDownloadsReceived}
              </span>
            </div>

            <div className="bg-white/10 p-4 rounded-xl border border-white/10">
              <span className="text-xs text-indigo-200 block">Notes Saved</span>
              <span className="text-2xl font-bold font-display mt-1 block">
                {stats.userStats.mySavedNotes}
              </span>
            </div>

            <div className="bg-white/10 p-4 rounded-xl border border-white/10">
              <span className="text-xs text-indigo-200 block">Notes Downloaded</span>
              <span className="text-2xl font-bold font-display mt-1 block">
                {stats.userStats.myTotalDownloaded}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Two column layout for Top Subjects & Top Contributors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Downloaded Subjects */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 font-display">Most Popular Subjects</h3>
            </div>
            <span className="text-xs text-slate-400">By student downloads</span>
          </div>

          <div className="space-y-3">
            {stats.topSubjects.map((sub, idx) => (
              <div
                key={sub.id}
                onClick={() => onSelectSubject && onSelectSubject(sub.id)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {sub.name}
                    </h4>
                    <span className="text-xs text-slate-400">{sub.category}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">
                    {sub.total_downloads || 0} downloads
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {sub.notes_count} notes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Student Contributors Leaderboard */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 font-display">Top Contributors Leaderboard</h3>
            </div>
            <span className="text-xs text-slate-400">Top note providers</span>
          </div>

          <div className="space-y-3">
            {stats.topContributors.map((contrib, idx) => (
              <div
                key={contrib.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {contrib.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {contrib.name}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full">
                          Top #1
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 truncate block">
                      {contrib.college}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-indigo-600 block">
                    {contrib.downloads_received} downloads
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {contrib.upload_count} notes shared
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
