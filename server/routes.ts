import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDb, saveDb } from './db.js';
import { hashPassword, generateToken, authenticateToken, optionalAuth, AuthenticatedRequest } from './auth.js';

const router = Router();
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'note-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max limit
});

// Helper to convert SQLite exec result to array of objects
function formatSqlResults(execResult: any[]): any[] {
  if (!execResult || !execResult.length) return [];
  const { columns, values } = execResult[0];
  return values.map((row: any[]) => {
    const obj: Record<string, any> = {};
    columns.forEach((col: string, idx: number) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

// ---------------- AUTH ROUTES ----------------

// Register
router.post('/auth/register', async (req, res: Response) => {
  try {
    const { name, email, password, college, branch, semester } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const db = await getDb();
    const existing = db.exec('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length && existing[0].values.length) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const avatarColors = ['indigo', 'blue', 'emerald', 'purple', 'rose', 'amber', 'teal', 'cyan'];
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    const passwordHash = hashPassword(password);

    db.run(
      `INSERT INTO users (name, email, password_hash, college, branch, semester, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        college ? college.trim() : 'University Student',
        branch ? branch.trim() : 'General',
        semester || '1',
        randomColor
      ]
    );

    const userRes = db.exec('SELECT last_insert_rowid() as id');
    const userId = userRes[0].values[0][0];

    // Create session token
    const token = generateToken();
    db.run('INSERT INTO sessions (token, user_id) VALUES (?, ?)', [token, userId]);
    saveDb();

    const userObj = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      college: college ? college.trim() : 'University Student',
      branch: branch ? branch.trim() : 'General',
      semester: semester || '1',
      avatar_color: randomColor,
      bio: ''
    };

    res.status(201).json({ user: userObj, token });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// Login
router.post('/auth/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await getDb();
    const passwordHash = hashPassword(password);
    const result = db.exec(
      `SELECT id, name, email, college, branch, semester, avatar_color, bio, created_at
       FROM users WHERE email = ? AND password_hash = ?`,
      [email.trim().toLowerCase(), passwordHash]
    );

    if (!result.length || !result[0].values.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const row = result[0].values[0];
    const user = {
      id: row[0],
      name: row[1],
      email: row[2],
      college: row[3],
      branch: row[4],
      semester: row[5],
      avatar_color: row[6],
      bio: row[7],
      created_at: row[8]
    };

    const token = generateToken();
    db.run('INSERT INTO sessions (token, user_id) VALUES (?, ?)', [token, user.id]);
    saveDb();

    res.json({ user, token });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Quick Demo Login (for frictionless testing)
router.post('/auth/demo-login', async (req, res: Response) => {
  try {
    const { email } = req.body;
    const targetEmail = email || 'aarav@college.edu';

    const db = await getDb();
    const result = db.exec(
      `SELECT id, name, email, college, branch, semester, avatar_color, bio, created_at
       FROM users WHERE email = ?`,
      [targetEmail]
    );

    if (!result.length || !result[0].values.length) {
      return res.status(404).json({ error: 'Demo user not found' });
    }

    const row = result[0].values[0];
    const user = {
      id: row[0],
      name: row[1],
      email: row[2],
      college: row[3],
      branch: row[4],
      semester: row[5],
      avatar_color: row[6],
      bio: row[7],
      created_at: row[8]
    };

    const token = generateToken();
    db.run('INSERT INTO sessions (token, user_id) VALUES (?, ?)', [token, user.id]);
    saveDb();

    res.json({ user, token });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// Current User
router.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// Update Profile
router.put('/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, college, branch, semester, bio, avatar_color } = req.body;
    const userId = req.user!.id;
    const db = await getDb();

    db.run(
      `UPDATE users
       SET name = COALESCE(?, name),
           college = COALESCE(?, college),
           branch = COALESCE(?, branch),
           semester = COALESCE(?, semester),
           bio = COALESCE(?, bio),
           avatar_color = COALESCE(?, avatar_color)
       WHERE id = ?`,
      [name, college, branch, semester, bio, avatar_color, userId]
    );
    saveDb();

    const updated = db.exec(
      `SELECT id, name, email, college, branch, semester, avatar_color, bio, created_at FROM users WHERE id = ?`,
      [userId]
    );
    const row = updated[0].values[0];
    const user = {
      id: row[0],
      name: row[1],
      email: row[2],
      college: row[3],
      branch: row[4],
      semester: row[5],
      avatar_color: row[6],
      bio: row[7],
      created_at: row[8]
    };

    res.json({ user });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Logout
router.post('/auth/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.slice(7);
    if (token) {
      const db = await getDb();
      db.run('DELETE FROM sessions WHERE token = ?', [token]);
      saveDb();
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ---------------- SUBJECTS ROUTES ----------------

router.get('/subjects', async (_req, res: Response) => {
  try {
    const db = await getDb();
    const result = db.exec(`
      SELECT s.*, COUNT(n.id) as notes_count
      FROM subjects s
      LEFT JOIN notes n ON s.id = n.subject_id
      GROUP BY s.id
      ORDER BY notes_count DESC, s.name ASC
    `);
    const subjects = formatSqlResults(result);
    res.json({ subjects });
  } catch (err: any) {
    console.error('Get subjects error:', err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// ---------------- NOTES ROUTES ----------------

// Get & Search Notes with filters
router.get('/notes', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, subject_id, semester, uploader_id, bookmarked, sort } = req.query;
    const currentUserId = req.user?.id || 0;
    const db = await getDb();

    let query = `
      SELECT n.*,
             s.name as subject_name,
             s.category as subject_category,
             s.color as subject_color,
             s.icon as subject_icon,
             u.name as uploader_name,
             u.college as uploader_college,
             u.avatar_color as uploader_avatar,
             (SELECT COUNT(*) FROM bookmarks b WHERE b.note_id = n.id) as bookmark_count,
             (CASE WHEN EXISTS(SELECT 1 FROM bookmarks bm WHERE bm.note_id = n.id AND bm.user_id = ${currentUserId}) THEN 1 ELSE 0 END) as is_bookmarked
      FROM notes n
      JOIN subjects s ON n.subject_id = s.id
      JOIN users u ON n.uploader_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (q) {
      const searchTerm = `%${String(q).trim()}%`;
      query += ` AND (n.title LIKE ? OR n.description LIKE ? OR n.tags LIKE ? OR s.name LIKE ? OR u.name LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (subject_id && subject_id !== 'all') {
      query += ` AND n.subject_id = ?`;
      params.push(Number(subject_id));
    }

    if (semester && semester !== 'all') {
      query += ` AND n.semester = ?`;
      params.push(String(semester));
    }

    if (uploader_id) {
      query += ` AND n.uploader_id = ?`;
      params.push(Number(uploader_id));
    }

    if (bookmarked === 'true' && currentUserId) {
      query += ` AND EXISTS(SELECT 1 FROM bookmarks b WHERE b.note_id = n.id AND b.user_id = ?)`;
      params.push(currentUserId);
    }

    // Sorting
    if (sort === 'downloads') {
      query += ` ORDER BY n.downloads_count DESC, n.created_at DESC`;
    } else if (sort === 'bookmarks') {
      query += ` ORDER BY bookmark_count DESC, n.created_at DESC`;
    } else if (sort === 'oldest') {
      query += ` ORDER BY n.created_at ASC`;
    } else {
      // default: newest first
      query += ` ORDER BY n.created_at DESC`;
    }

    const result = db.exec(query, params);
    const notes = formatSqlResults(result);
    res.json({ notes });
  } catch (err: any) {
    console.error('Get notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes: ' + err.message });
  }
});

// Single Note details
router.get('/notes/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id || 0;
    const db = await getDb();

    const query = `
      SELECT n.*,
             s.name as subject_name,
             s.category as subject_category,
             s.color as subject_color,
             s.icon as subject_icon,
             u.name as uploader_name,
             u.college as uploader_college,
             u.avatar_color as uploader_avatar,
             u.branch as uploader_branch,
             (SELECT COUNT(*) FROM bookmarks b WHERE b.note_id = n.id) as bookmark_count,
             (CASE WHEN EXISTS(SELECT 1 FROM bookmarks bm WHERE bm.note_id = n.id AND bm.user_id = ${currentUserId}) THEN 1 ELSE 0 END) as is_bookmarked
      FROM notes n
      JOIN subjects s ON n.subject_id = s.id
      JOIN users u ON n.uploader_id = u.id
      WHERE n.id = ?
    `;

    const result = db.exec(query, [Number(id)]);
    if (!result.length || !result[0].values.length) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const notes = formatSqlResults(result);
    res.json({ note: notes[0] });
  } catch (err: any) {
    console.error('Get single note error:', err);
    res.status(500).json({ error: 'Failed to retrieve note' });
  }
});

// Upload a new note / PDF
router.post('/notes', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, subject_id, semester, tags } = req.body;
    const file = req.file;

    if (!title || !subject_id) {
      return res.status(400).json({ error: 'Note title and subject are required' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Please choose a document or PDF file to upload' });
    }

    const uploaderId = req.user!.id;
    const db = await getDb();

    db.run(
      `INSERT INTO notes (title, description, subject_id, uploader_id, file_name, original_name, file_path, file_size, file_type, semester, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description ? description.trim() : '',
        Number(subject_id),
        uploaderId,
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.mimetype || 'application/octet-stream',
        semester || '1',
        tags ? tags.trim() : ''
      ]
    );

    saveDb();

    const insertIdRes = db.exec('SELECT last_insert_rowid() as id');
    const newNoteId = insertIdRes[0].values[0][0];

    res.status(201).json({
      message: 'Note uploaded successfully',
      noteId: newNoteId
    });
  } catch (err: any) {
    console.error('Upload note error:', err);
    res.status(500).json({ error: 'Failed to upload note: ' + err.message });
  }
});

// Delete uploaded note (only by its owner)
router.delete('/notes/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const db = await getDb();

    // Verify ownership
    const noteRes = db.exec('SELECT id, uploader_id, file_path FROM notes WHERE id = ?', [Number(id)]);
    if (!noteRes.length || !noteRes[0].values.length) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = noteRes[0].values[0];
    const uploaderId = note[1];
    const filePath = note[2];

    if (uploaderId !== userId) {
      return res.status(403).json({ error: 'Unauthorized. You can only delete notes you uploaded.' });
    }

    // Delete from SQLite
    db.run('DELETE FROM bookmarks WHERE note_id = ?', [Number(id)]);
    db.run('DELETE FROM downloads WHERE note_id = ?', [Number(id)]);
    db.run('DELETE FROM notes WHERE id = ?', [Number(id)]);
    saveDb();

    // Remove file from disk if exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Could not unlink file:', e);
      }
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (err: any) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Toggle Bookmark
router.post('/notes/:id/bookmark', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const noteId = Number(id);
    const db = await getDb();

    // Check if already bookmarked
    const existing = db.exec('SELECT id FROM bookmarks WHERE user_id = ? AND note_id = ?', [userId, noteId]);
    let isBookmarked = false;

    if (existing.length && existing[0].values.length) {
      // Remove bookmark
      db.run('DELETE FROM bookmarks WHERE user_id = ? AND note_id = ?', [userId, noteId]);
      isBookmarked = false;
    } else {
      // Add bookmark
      db.run('INSERT INTO bookmarks (user_id, note_id) VALUES (?, ?)', [userId, noteId]);
      isBookmarked = true;
    }

    saveDb();

    // Return new bookmark count
    const countRes = db.exec('SELECT COUNT(*) FROM bookmarks WHERE note_id = ?', [noteId]);
    const bookmarkCount = countRes[0]?.values[0][0] || 0;

    res.json({
      success: true,
      isBookmarked,
      bookmarkCount
    });
  } catch (err: any) {
    console.error('Bookmark error:', err);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

// Download note (increments download count & logs download)
router.get('/notes/:id/download', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const db = await getDb();

    const noteRes = db.exec('SELECT id, original_name, file_path, file_type, downloads_count FROM notes WHERE id = ?', [Number(id)]);
    if (!noteRes.length || !noteRes[0].values.length) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = noteRes[0].values[0];
    const originalName = note[1];
    const filePath = note[2];
    const fileType = note[3];

    // Increment downloads count in SQLite
    db.run('UPDATE notes SET downloads_count = downloads_count + 1 WHERE id = ?', [Number(id)]);
    db.run('INSERT INTO downloads (user_id, note_id) VALUES (?, ?)', [userId, Number(id)]);
    saveDb();

    if (!fs.existsSync(filePath)) {
      // If disk file doesn't exist, create a fallback text content
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
      res.setHeader('Content-Type', 'text/plain');
      return res.send(`StudySwap - Note Document\nOriginal Name: ${originalName}\nDownloaded from StudySwap Platform`);
    }

    res.download(filePath, originalName);
  } catch (err: any) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Download failed: ' + err.message });
  }
});

// Preview note content inline
router.get('/notes/:id/preview', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const noteRes = db.exec('SELECT id, original_name, file_path, file_type FROM notes WHERE id = ?', [Number(id)]);
    if (!noteRes.length || !noteRes[0].values.length) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = noteRes[0].values[0];
    const filePath = note[2];
    const fileType = note[3];

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Preview file not available on server.');
    }

    // Read first few KB to return preview text or send file
    res.setHeader('Content-Type', fileType || 'text/plain');
    res.setHeader('Content-Disposition', 'inline');
    fs.createReadStream(filePath).pipe(res);
  } catch (err: any) {
    console.error('Preview error:', err);
    res.status(500).json({ error: 'Preview failed' });
  }
});

// ---------------- STATISTICS ROUTE ----------------

router.get('/stats', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.user?.id || 0;

    // Platform global stats
    const totalNotesRes = db.exec('SELECT COUNT(*) FROM notes');
    const totalDownloadsRes = db.exec('SELECT SUM(downloads_count) FROM notes');
    const totalStudentsRes = db.exec('SELECT COUNT(*) FROM users');
    const totalSubjectsRes = db.exec('SELECT COUNT(*) FROM subjects');

    const totalNotes = totalNotesRes[0]?.values[0][0] || 0;
    const totalDownloads = totalDownloadsRes[0]?.values[0][0] || 0;
    const totalStudents = totalStudentsRes[0]?.values[0][0] || 0;
    const totalSubjects = totalSubjectsRes[0]?.values[0][0] || 0;

    // Top subjects with note counts
    const topSubjectsRes = db.exec(`
      SELECT s.id, s.name, s.category, s.color, s.icon, COUNT(n.id) as notes_count, SUM(n.downloads_count) as total_downloads
      FROM subjects s
      LEFT JOIN notes n ON s.id = n.subject_id
      GROUP BY s.id
      ORDER BY total_downloads DESC, notes_count DESC
      LIMIT 5
    `);
    const topSubjects = formatSqlResults(topSubjectsRes);

    // Top contributors leaderboard
    const topUploadersRes = db.exec(`
      SELECT u.id, u.name, u.college, u.avatar_color,
             COUNT(n.id) as upload_count,
             COALESCE(SUM(n.downloads_count), 0) as downloads_received
      FROM users u
      JOIN notes n ON u.id = n.uploader_id
      GROUP BY u.id
      ORDER BY downloads_received DESC, upload_count DESC
      LIMIT 4
    `);
    const topContributors = formatSqlResults(topUploadersRes);

    // User-specific stats (if logged in)
    let userStats = null;
    if (userId > 0) {
      const myUploadsRes = db.exec('SELECT COUNT(*), COALESCE(SUM(downloads_count), 0) FROM notes WHERE uploader_id = ?', [userId]);
      const myBookmarksRes = db.exec('SELECT COUNT(*) FROM bookmarks WHERE user_id = ?', [userId]);
      const myDownloadsRes = db.exec('SELECT COUNT(*) FROM downloads WHERE user_id = ?', [userId]);

      userStats = {
        myUploads: myUploadsRes[0]?.values[0][0] || 0,
        myDownloadsReceived: myUploadsRes[0]?.values[0][1] || 0,
        mySavedNotes: myBookmarksRes[0]?.values[0][0] || 0,
        myTotalDownloaded: myDownloadsRes[0]?.values[0][0] || 0
      };
    }

    res.json({
      global: {
        totalNotes,
        totalDownloads,
        totalStudents,
        totalSubjects
      },
      topSubjects,
      topContributors,
      userStats
    });
  } catch (err: any) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
