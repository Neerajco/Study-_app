import React, { useState } from 'react';
import { Download, Heart, Trash2, Eye, FileText, Calendar, BookOpen, User as UserIcon, Check } from 'lucide-react';
import { Note, User } from '../types';
import { api } from '../services/api';

interface NoteCardProps {
  note: Note;
  currentUser: User | null;
  onOpenPreview: (note: Note) => void;
  onBookmarkToggled?: (noteId: number, isBookmarked: boolean, count: number) => void;
  onNoteDeleted?: (noteId: number) => void;
  onRequireAuth: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  currentUser,
  onOpenPreview,
  onBookmarkToggled,
  onNoteDeleted,
  onRequireAuth
}) => {
  const [isBookmarked, setIsBookmarked] = useState<boolean>(Boolean(note.is_bookmarked));
  const [bookmarkCount, setBookmarkCount] = useState<number>(note.bookmark_count || 0);
  const [downloadsCount, setDownloadsCount] = useState<number>(note.downloads_count || 0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isOwner = currentUser && currentUser.id === note.uploader_id;

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      // Trigger download
      const downloadUrl = api.getDownloadUrl(note.id);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', note.original_name || `${note.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadsCount((prev) => prev + 1);
    } catch (err) {
      console.error('Download trigger error:', err);
    } finally {
      setTimeout(() => setIsDownloading(false), 800);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) return;

    setIsDeleting(true);
    try {
      await api.deleteNote(note.id);
      if (onNoteDeleted) {
        onNoteDeleted(note.id);
      }
    } catch (err: any) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div
      id={`note-card-${note.id}`}
      className="group relative bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <BookOpen className="w-3 h-3" />
              <span className="max-w-[140px] truncate">{note.subject_name || 'General Subject'}</span>
            </span>

            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
              Sem {note.semester}
            </span>
          </div>

          {/* Bookmark Heart button */}
          <button
            id={`btn-bookmark-note-${note.id}`}
            type="button"
            onClick={handleToggleBookmark}
            title={isBookmarked ? 'Remove Bookmark' : 'Save / Bookmark Note'}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isBookmarked
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
            }`}
          >
            <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Note Title */}
        <h3 
          onClick={() => onOpenPreview(note)}
          className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2"
        >
          {note.title}
        </h3>

        {/* Note Description */}
        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
          {note.description || 'Verified student study notes and exam preparation reference sheet.'}
        </p>

        {/* Tags */}
        {note.tags && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.split(',').slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Area */}
      <div className="mt-5 pt-3.5 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          {/* Uploader info */}
          <div className="flex items-center gap-2 truncate max-w-[170px]">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
              {(note.uploader_name || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <span className="font-semibold text-slate-800 truncate block">
                {note.uploader_name}
              </span>
              <span className="text-[10px] text-slate-400 truncate block">
                {note.uploader_college || 'Student'}
              </span>
            </div>
          </div>

          {/* File size & format */}
          <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-medium text-slate-500">
            <span className="uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
              {note.file_name.endsWith('.pdf') ? 'PDF' : 'DOC'}
            </span>
            <span>{formatFileSize(note.file_size)}</span>
          </div>
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center gap-2">
          {/* Preview Button */}
          <button
            id={`btn-preview-note-${note.id}`}
            type="button"
            onClick={() => onOpenPreview(note)}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Preview</span>
          </button>

          {/* Download Button */}
          <button
            id={`btn-download-note-${note.id}`}
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isDownloading ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download ({downloadsCount})</span>
              </>
            )}
          </button>

          {/* Delete Button (Owner only) */}
          {isOwner && (
            <div className="relative">
              {showConfirmDelete ? (
                <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                  <button
                    id={`btn-confirm-delete-${note.id}`}
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                  >
                    Delete?
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-1.5 py-1 text-slate-500 hover:text-slate-800 text-[10px] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  id={`btn-delete-note-${note.id}`}
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  title="Delete your uploaded note"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
