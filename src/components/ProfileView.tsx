import React, { useState } from 'react';
import { User as UserIcon, School, BookOpen, Calendar, Edit3, Heart, Trash2, FileText, CheckCircle2, Download } from 'lucide-react';
import { User, Note } from '../types';
import { NoteCard } from './NoteCard';
import { api } from '../services/api';

interface ProfileViewProps {
  user: User;
  myNotes: Note[];
  bookmarkedNotes: Note[];
  onProfileUpdated: (user: User) => void;
  onOpenPreview: (note: Note) => void;
  onBookmarkToggled: (noteId: number, isBookmarked: boolean, count: number) => void;
  onNoteDeleted: (noteId: number) => void;
  onRequireAuth: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  myNotes,
  bookmarkedNotes,
  onProfileUpdated,
  onOpenPreview,
  onBookmarkToggled,
  onNoteDeleted,
  onRequireAuth
}) => {
  const [activeTab, setActiveTab] = useState<'uploads' | 'bookmarks'>('uploads');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [college, setCollege] = useState(user.college || '');
  const [branch, setBranch] = useState(user.branch || '');
  const [semester, setSemester] = useState(user.semester || '4');
  const [bio, setBio] = useState(user.bio || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totalDownloadsReceived = myNotes.reduce((sum, n) => sum + (n.downloads_count || 0), 0);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateProfile({
        name,
        college,
        branch,
        semester,
        bio
      });
      onProfileUpdated(res.user);
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Student Profile Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-500 text-white font-display text-2xl sm:text-3xl font-bold flex items-center justify-center shadow-md shadow-indigo-100">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                  {user.name}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Student
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{user.email}</span>
                {user.college && <span>• {user.college}</span>}
                {user.branch && <span>• {user.branch}</span>}
                <span>• Semester {user.semester}</span>
              </div>
              {user.bio && (
                <p className="text-xs text-slate-600 mt-2 max-w-xl leading-relaxed">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          <button
            id="btn-edit-profile-toggle"
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Edit Profile Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Update Student Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">College / University</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch / Department</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bio / Study Goals</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other students what you study and what notes you specialize in..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                id="btn-save-profile"
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {/* 3 Activity Metrics */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100 text-center">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-display block">
              {myNotes.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Uploaded Notes</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xl sm:text-2xl font-bold text-indigo-600 font-display block">
              {totalDownloadsReceived}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Downloads Received</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xl sm:text-2xl font-bold text-rose-600 font-display block">
              {bookmarkedNotes.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Saved Bookmarks</span>
          </div>
        </div>
      </div>

      {/* Tabs: My Uploaded Notes vs Saved Notes */}
      <div>
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
          <button
            id="tab-my-uploads"
            onClick={() => setActiveTab('uploads')}
            className={`pb-3 px-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'uploads'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>My Uploaded Notes ({myNotes.length})</span>
          </button>

          <button
            id="tab-my-bookmarks"
            onClick={() => setActiveTab('bookmarks')}
            className={`pb-3 px-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Saved Notes ({bookmarkedNotes.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'uploads' ? (
          myNotes.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/90 rounded-2xl p-6">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800 mt-3">No Uploaded Notes Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                You haven't uploaded any notes yet. Share your handwritten notes, diagrams, or formula cheatsheets to help other students!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  currentUser={user}
                  onOpenPreview={onOpenPreview}
                  onBookmarkToggled={onBookmarkToggled}
                  onNoteDeleted={onNoteDeleted}
                  onRequireAuth={onRequireAuth}
                />
              ))}
            </div>
          )
        ) : (
          bookmarkedNotes.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/90 rounded-2xl p-6">
              <Heart className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800 mt-3">No Saved Notes Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Click the heart icon on any note in the feed to save it to your bookmarks for quick revision before exams.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {bookmarkedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  currentUser={user}
                  onOpenPreview={onOpenPreview}
                  onBookmarkToggled={onBookmarkToggled}
                  onNoteDeleted={onNoteDeleted}
                  onRequireAuth={onRequireAuth}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
