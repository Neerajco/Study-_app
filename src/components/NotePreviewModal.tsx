import React, { useState, useEffect } from 'react';
import { X, Download, Heart, Trash2, BookOpen, Calendar, FileText, User as UserIcon, Check, ExternalLink } from 'lucide-react';
import { Note, User } from '../types';
import { api } from '../services/api';

interface NotePreviewModalProps {
  note: Note | null;
  currentUser: User | null;
  onClose: () => void;
  onBookmarkToggled?: (noteId: number, isBookmarked: boolean, count: number) => void;
  onNoteDeleted?: (noteId: number) => void;
  onRequireAuth: () => void;
}

export const NotePreviewModal: React.FC<NotePreviewModalProps> = ({
  note,
  currentUser,
  onClose,
  onBookmarkToggled,
  onNoteDeleted,
  onRequireAuth
}) => {
  if (!note) return null;

  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(true);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(Boolean(note.is_bookmarked));
  const [bookmarkCount, setBookmarkCount] = useState<number>(note.bookmark_count || 0);
  const [downloadsCount, setDownloadsCount] = useState<number>(note.downloads_count || 0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isOwner = currentUser && currentUser.id === note.uploader_id;

  useEffect(() => {
    let isMounted = true;
    setLoadingPreview(true);

    fetch(api.getPreviewUrl(note.id))
      .then((res) => {
        if (!res.ok) throw new Error('Preview not available');
        return res.text();
      })
      .then((text) => {
        if (isMounted) {
          setPreviewContent(text);
          setLoadingPreview(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPreviewContent(null);
          setLoadingPreview(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [note.id]);

  const handleToggleBookmark = async () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    try {
      const res = await api.toggleBookmark(note.id);
      setIsBookmarked(res.isBookmarked);
      setBookmarkCount(res.bookmarkCount);
      if (onBookmarkToggled) {
        onBookmarkToggled(note.id, res.isBookmarked, res.bookmarkCount);
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  const handleDownload = () => {
    setIsDownloading(true);
    const downloadUrl = api.getDownloadUrl(note.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', note.original_name || `${note.title}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadsCount((prev) => prev + 1);
    setTimeout(() => setIsDownloading(false), 800);
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    try {
      await api.deleteNote(note.id);
      if (onNoteDeleted) {
        onNoteDeleted(note.id);
      }
      onClose();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="note-preview-modal-card"
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[90vh] flex flex-col"
      >
        {/* Modal Top Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {note.subject_name || 'Subject'}
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
              Semester {note.semester}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bookmark button */}
            <button
              id="preview-btn-bookmark"
              type="button"
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isBookmarked
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{bookmarkCount}</span>
            </button>

            {/* Download button */}
            <button
              id="preview-btn-download"
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download ({downloadsCount})</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              id="preview-modal-close"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Note Title & Description */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              {note.title}
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {note.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Metadata banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Uploaded By</span>
              <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                {note.uploader_name || 'Student'}
              </span>
              <span className="text-[10px] text-slate-500 truncate block">
                {note.uploader_college || 'University'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">File Name & Format</span>
              <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                {note.original_name}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {formatFileSize(note.file_size)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Downloads</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {downloadsCount} student downloads
              </span>
              <span className="text-[10px] text-slate-500 block">
                {bookmarkCount} bookmarks
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Added On</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'Recent'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium block">
                Verified Material
              </span>
            </div>
          </div>

          {/* Tags */}
          {note.tags && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 mr-1">Tags:</span>
              {note.tags.split(',').map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* In-browser Document / Notes Preview */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Document Reading & Text Preview</span>
              </div>
              <a
                href={api.getDownloadUrl(note.id)}
                download
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <span>Save Offline</span>
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-5 bg-white max-h-[340px] overflow-y-auto">
              {loadingPreview ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Loading notes preview from SQLite repository...
                </div>
              ) : previewContent ? (
                <pre className="text-xs sm:text-sm font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {previewContent}
                </pre>
              ) : (
                <div className="py-10 text-center space-y-3">
                  <FileText className="w-10 h-10 text-indigo-400 mx-auto" />
                  <div className="text-sm font-semibold text-slate-800">
                    Binary PDF / Document file ready for download
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click the download button above or below to save {note.original_name} to your device.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    Download Full PDF Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Delete action if Owner */}
          {isOwner && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-900">Manage Your Upload</h4>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  You are the uploader of this material. You can permanently delete this note.
                </p>
              </div>

              {showConfirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    id="preview-confirm-delete"
                    onClick={handleDelete}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  id="preview-delete-trigger"
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-3 py-1.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Note</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
