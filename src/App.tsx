import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Upload, 
  Filter, 
  BookOpen, 
  Sparkles, 
  Flame, 
  ArrowUpDown, 
  Download, 
  Heart, 
  FileText, 
  X,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { User, Subject, Note, PlatformStats } from './types';
import { api, authStorage } from './services/api';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { UploadModal } from './components/UploadModal';
import { NoteCard } from './components/NoteCard';
import { NotePreviewModal } from './components/NotePreviewModal';
import { StatsSection } from './components/StatsSection';
import { ProfileView } from './components/ProfileView';
import { SubjectList } from './components/SubjectList';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // 'dashboard' | 'subjects' | 'stats' | 'bookmarks' | 'profile'
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [bookmarkedNotes, setBookmarkedNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest'); // 'newest' | 'downloads' | 'bookmarks'

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  // Loading states
  const [loadingNotes, setLoadingNotes] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load initial user session
  useEffect(() => {
    const savedUser = authStorage.getUser();
    if (savedUser) {
      setUser(savedUser);
      // Validate with server
      api.getMe()
        .then((res) => {
          setUser(res.user);
          authStorage.setUser(res.user);
        })
        .catch(() => {
          authStorage.clear();
          setUser(null);
        });
    }
  }, []);

  // Fetch subjects
  const loadSubjects = useCallback(async () => {
    try {
      const res = await api.getSubjects();
      setSubjects(res.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  }, []);

  // Fetch stats
  const loadStats = useCallback(async () => {
    try {
      const res = await api.getStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Fetch feed notes
  const loadNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const res = await api.getNotes({
        q: searchQuery,
        subject_id: selectedSubjectId,
        semester: selectedSemester,
        sort: sortBy
      });
      setNotes(res.notes || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  }, [searchQuery, selectedSubjectId, selectedSemester, sortBy]);

  // Fetch user uploaded notes and saved bookmarks
  const loadUserNotes = useCallback(async () => {
    if (!user) {
      setMyNotes([]);
      setBookmarkedNotes([]);
      return;
    }
    try {
      const [myRes, bookmarkRes] = await Promise.all([
        api.getNotes({ uploader_id: user.id }),
        api.getNotes({ bookmarked: true })
      ]);
      setMyNotes(myRes.notes || []);
      setBookmarkedNotes(bookmarkRes.notes || []);
    } catch (err) {
      console.error('Failed to load user notes:', err);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    loadSubjects();
    loadStats();
  }, [loadSubjects, loadStats]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    loadUserNotes();
  }, [loadUserNotes]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadNotes(), loadStats(), loadSubjects(), loadUserNotes()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    if (activeTab === 'profile' || activeTab === 'bookmarks') {
      setActiveTab('dashboard');
    }
    loadNotes();
    loadStats();
  };

  const handleBookmarkToggled = (noteId: number, isBookmarked: boolean, count: number) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, is_bookmarked: isBookmarked ? 1 : 0, bookmark_count: count } : n
      )
    );
    if (previewNote && previewNote.id === noteId) {
      setPreviewNote({
        ...previewNote,
        is_bookmarked: isBookmarked ? 1 : 0,
        bookmark_count: count
      });
    }
    loadUserNotes();
    loadStats();
  };

  const handleNoteDeleted = (noteId: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setMyNotes((prev) => prev.filter((n) => n.id !== noteId));
    setBookmarkedNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (previewNote && previewNote.id === noteId) {
      setPreviewNote(null);
    }
    loadStats();
    loadSubjects();
  };

  const handleSubjectCardClick = (subjectId: number) => {
    setSelectedSubjectId(String(subjectId));
    setActiveTab('dashboard');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubjectId('all');
    setSelectedSemester('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery !== '' || selectedSubjectId !== 'all' || selectedSemester !== 'all' || sortBy !== 'newest';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 pb-20 md:pb-12">
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenUpload={() => {
          if (!user) {
            setIsAuthOpen(true);
          } else {
            setIsUploadOpen(true);
          }
        }}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1">
        
        {/* Banner for non-logged-in users */}
        {!user && (
          <div className="mb-6 p-4 rounded-2xl bg-linear-to-r from-indigo-900 to-indigo-700 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Join StudySwap Student Community
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-display">
                Swap notes, download exam cheat-sheets & share verified materials
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="banner-btn-login"
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Sign In / Register
              </button>
            </div>
          </div>
        )}

        {/* VIEW: DASHBOARD / FEED */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Search & Filter Toolbar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                
                {/* Search Input (🔎 Notes search) */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="input-search-notes"
                    type="text"
                    placeholder="Search notes by title, topic, tags, semester, or student name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50 hover:bg-white transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Controls Row */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  {/* Subject Dropdown */}
                  <div className="w-1/2 sm:w-48">
                    <select
                      id="filter-subject"
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="all">All Subjects</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Semester Dropdown */}
                  <div className="w-1/2 sm:w-32">
                    <select
                      id="filter-semester"
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="all">All Semesters</option>
                      <option value="1">Sem 1</option>
                      <option value="2">Sem 2</option>
                      <option value="3">Sem 3</option>
                      <option value="4">Sem 4</option>
                      <option value="5">Sem 5</option>
                      <option value="6">Sem 6</option>
                      <option value="7">Sem 7</option>
                      <option value="8">Sem 8</option>
                    </select>
                  </div>

                  {/* Sort By Dropdown */}
                  <div className="w-full sm:w-40">
                    <select
                      id="filter-sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="newest">Newest First</option>
                      <option value="downloads">Most Downloaded</option>
                      <option value="bookmarks">Most Saved</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>

                  {/* Refresh Button */}
                  <button
                    id="btn-refresh-feed"
                    onClick={handleRefresh}
                    title="Refresh Feed"
                    className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Subject Quick Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
                <span className="text-slate-400 font-semibold shrink-0 mr-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Quick Filter:
                </span>
                <button
                  onClick={() => setSelectedSubjectId('all')}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap font-semibold transition-colors cursor-pointer ${
                    selectedSubjectId === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {subjects.slice(0, 6).map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(String(sub.id))}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer ${
                      selectedSubjectId === String(sub.id)
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>

              {/* Filter Reset pill if active */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                  <span>
                    Showing filtered results ({notes.length} notes found)
                  </span>
                  <button
                    id="btn-clear-filters"
                    onClick={resetFilters}
                    className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>

            {/* Notes Grid */}
            {loadingNotes ? (
              <div className="text-center py-20 bg-white border border-slate-200/90 rounded-2xl p-6">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 mt-3">Loading notes from SQLite repository...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200/90 rounded-2xl p-6">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 mt-3">No Notes Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  We couldn't find any study materials matching your filters. Try clearing your search or upload the first note for this subject!
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!user) setIsAuthOpen(true);
                      else setIsUploadOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                  >
                    Upload Notes
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    currentUser={user}
                    onOpenPreview={(n) => setPreviewNote(n)}
                    onBookmarkToggled={handleBookmarkToggled}
                    onNoteDeleted={handleNoteDeleted}
                    onRequireAuth={() => setIsAuthOpen(true)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: SUBJECTS */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">
                  Academic Subjects & Disciplines
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Browse verified notes organized by subject, course code, and engineering department
                </p>
              </div>
            </div>

            <SubjectList
              subjects={subjects}
              onSelectSubject={handleSubjectCardClick}
            />
          </div>
        )}

        {/* VIEW: STATISTICS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">
                  StudySwap Platform Statistics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live upload counts, download metrics, and student contributor leaderboard
                </p>
              </div>
            </div>

            <StatsSection
              stats={stats}
              currentUser={user}
              onSelectSubject={handleSubjectCardClick}
            />
          </div>
        )}

        {/* VIEW: BOOKMARKS */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>Your Saved / Bookmarked Notes</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quick access to important study materials and formula sheets you saved for revision
              </p>
            </div>

            {bookmarkedNotes.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200/90 rounded-2xl p-6">
                <Heart className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 mt-3">No Saved Notes</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  You haven't bookmarked any notes yet. Browse the feed and tap the heart icon on notes you want to save.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Explore Feed
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {bookmarkedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    currentUser={user}
                    onOpenPreview={(n) => setPreviewNote(n)}
                    onBookmarkToggled={handleBookmarkToggled}
                    onNoteDeleted={handleNoteDeleted}
                    onRequireAuth={() => setIsAuthOpen(true)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: PROFILE */}
        {activeTab === 'profile' && user && (
          <ProfileView
            user={user}
            myNotes={myNotes}
            bookmarkedNotes={bookmarkedNotes}
            onProfileUpdated={(updatedUser) => {
              setUser(updatedUser);
              authStorage.setUser(updatedUser);
            }}
            onOpenPreview={(n) => setPreviewNote(n)}
            onBookmarkToggled={handleBookmarkToggled}
            onNoteDeleted={handleNoteDeleted}
            onRequireAuth={() => setIsAuthOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          loadUserNotes();
          loadStats();
          loadNotes();
        }}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        subjects={subjects}
        onSuccess={() => {
          loadNotes();
          loadUserNotes();
          loadStats();
          loadSubjects();
        }}
      />

      <NotePreviewModal
        note={previewNote}
        currentUser={user}
        onClose={() => setPreviewNote(null)}
        onBookmarkToggled={handleBookmarkToggled}
        onNoteDeleted={handleNoteDeleted}
        onRequireAuth={() => setIsAuthOpen(true)}
      />
    </div>
  );
}
