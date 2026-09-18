export interface User {
  id: number;
  name: string;
  email: string;
  college: string;
  branch: string;
  semester: string;
  avatar_color: string;
  bio?: string;
  created_at?: string;
}

export interface Subject {
  id: number;
  name: string;
  category: string;
  code: string;
  icon: string;
  color: string;
  notes_count?: number;
}

export interface Note {
  id: number;
  title: string;
  description: string;
  subject_id: number;
  subject_name?: string;
  subject_category?: string;
  subject_color?: string;
  subject_icon?: string;
  uploader_id: number;
  uploader_name?: string;
  uploader_college?: string;
  uploader_avatar?: string;
  uploader_branch?: string;
  file_name: string;
  original_name: string;
  file_path?: string;
  file_size: number;
  file_type: string;
  semester: string;
  tags: string;
  downloads_count: number;
  bookmark_count?: number;
  is_bookmarked?: number | boolean;
  created_at: string;
}

export interface PlatformStats {
  global: {
    totalNotes: number;
    totalDownloads: number;
    totalStudents: number;
    totalSubjects: number;
  };
  topSubjects: Array<{
    id: number;
    name: string;
    category: string;
    color: string;
    icon: string;
    notes_count: number;
    total_downloads: number;
  }>;
  topContributors: Array<{
    id: number;
    name: string;
    college: string;
    avatar_color: string;
    upload_count: number;
    downloads_received: number;
  }>;
  userStats: {
    myUploads: number;
    myDownloadsReceived: number;
    mySavedNotes: number;
    myTotalDownloaded: number;
  } | null;
}
