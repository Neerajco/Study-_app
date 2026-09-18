import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: any = null;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'studyswap.sqlite');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  let buffer: Buffer | null = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      buffer = fs.readFileSync(DB_FILE);
    } catch (err) {
      console.error('Error reading sqlite file:', err);
    }
  }

  dbInstance = buffer ? new SQL.Database(buffer) : new SQL.Database();
  initializeSchema(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist SQLite database:', err);
  }
}

function initializeSchema(db: any) {
  // 1. Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      college TEXT DEFAULT '',
      branch TEXT DEFAULT '',
      semester TEXT DEFAULT '1',
      avatar_color TEXT DEFAULT 'indigo',
      bio TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Subjects table
  db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      code TEXT DEFAULT '',
      icon TEXT DEFAULT 'BookOpen',
      color TEXT DEFAULT 'indigo'
    );
  `);

  // 4. Notes table
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      semester TEXT DEFAULT '1',
      tags TEXT DEFAULT '',
      downloads_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Bookmarks table
  db.run(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, note_id)
    );
  `);

  // 6. Downloads log table
  db.run(`
    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedDataIfEmpty(db);
}

function seedDataIfEmpty(db: any) {
  // Check if subjects exist
  const resSubjects = db.exec('SELECT COUNT(*) as count FROM subjects');
  const subjectCount = resSubjects[0]?.values[0][0] || 0;

  if (subjectCount === 0) {
    const subjects = [
      { name: 'Data Structures & Algorithms', category: 'Computer Science', code: 'CS201', icon: 'Code', color: 'blue' },
      { name: 'Database Management Systems', category: 'Computer Science', code: 'CS302', icon: 'Database', color: 'emerald' },
      { name: 'Operating Systems', category: 'Computer Science', code: 'CS301', icon: 'Cpu', color: 'purple' },
      { name: 'Engineering Mathematics', category: 'Mathematics', code: 'MA101', icon: 'Calculator', color: 'amber' },
      { name: 'Computer Networks', category: 'Computer Science', code: 'CS401', icon: 'Network', color: 'cyan' },
      { name: 'Artificial Intelligence & ML', category: 'Computer Science', code: 'AI402', icon: 'Sparkles', color: 'violet' },
      { name: 'Digital Electronics', category: 'Electronics', code: 'EC202', icon: 'Zap', color: 'rose' },
      { name: 'Software Engineering', category: 'Computer Science', code: 'CS404', icon: 'Layers', color: 'indigo' },
      { name: 'Financial Management', category: 'Commerce & MBA', code: 'MG103', icon: 'TrendingUp', color: 'teal' },
      { name: 'Mechanics of Solids', category: 'Mechanical', code: 'ME201', icon: 'Wrench', color: 'orange' }
    ];

    for (const sub of subjects) {
      db.run(
        `INSERT INTO subjects (name, category, code, icon, color) VALUES (?, ?, ?, ?, ?)`,
        [sub.name, sub.category, sub.code, sub.icon, sub.color]
      );
    }
  }

  // Check if default student users exist
  const resUsers = db.exec('SELECT COUNT(*) as count FROM users');
  const userCount = resUsers[0]?.values[0][0] || 0;

  if (userCount === 0) {
    // Demo password hash for "password123"
    // Using SHA256 of "password123" + salt
    const defaultPasswordHash = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'; // SHA256 of password123
    
    db.run(
      `INSERT INTO users (name, email, password_hash, college, branch, semester, avatar_color, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Aarav Sharma',
        'aarav@college.edu',
        defaultPasswordHash,
        'Delhi Technological University (DTU)',
        'Computer Engineering',
        '5',
        'blue',
        'CS junior passionate about DSA, competitive coding, and system design notes.'
      ]
    );

    db.run(
      `INSERT INTO users (name, email, password_hash, college, branch, semester, avatar_color, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Priya Patel',
        'priya@college.edu',
        defaultPasswordHash,
        'IIT Bombay',
        'Electrical & Electronics',
        '4',
        'purple',
        'Sharing handwritten neat diagrams and formula sheets for exams.'
      ]
    );

    db.run(
      `INSERT INTO users (name, email, password_hash, college, branch, semester, avatar_color, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Rohan Verma',
        'rohan@college.edu',
        defaultPasswordHash,
        'NIT Surathkal',
        'Information Technology',
        '6',
        'emerald',
        'Gate topper notes, DBMS transactions, B+ trees and normalization.'
      ]
    );
  }

  // Seed sample notes with actual downloadable file content
  const resNotes = db.exec('SELECT COUNT(*) as count FROM notes');
  const noteCount = resNotes[0]?.values[0][0] || 0;

  if (noteCount === 0) {
    const sampleNotes = [
      {
        title: 'DSA Complete Sheet - Trees, Graphs & Dynamic Programming',
        description: 'Comprehensive handwritten revision notes with time complexities, ASCII trees, Dijkstra, Prim, Kruskal, and 0/1 Knapsack solutions.',
        subject_id: 1,
        uploader_id: 1,
        file_name: 'dsa_trees_dp_guide.pdf',
        original_name: 'DSA_Comprehensive_Guide_Final.pdf',
        file_size: 2450000,
        file_type: 'application/pdf',
        semester: '4',
        tags: 'dsa, trees, graphs, dynamic programming, interview, gate',
        downloads_count: 87,
        content: `# StudySwap - Data Structures & Algorithms Complete Notes
Semester: 4 | Subject: CS201

## 1. Binary Search Trees & AVL Trees
- Balance Factor = Height(Left) - Height(Right) ∈ {-1, 0, 1}
- Rotations: LL, RR, LR, RL
- Time Complexity: Search O(log n), Insert O(log n), Delete O(log n)

## 2. Graph Algorithms
- Dijkstra's Algorithm (Single Source Shortest Path): O((V + E) log V) with Min-Heap
- Bellman-Ford (handles negative weight cycles): O(V * E)
- Floyd-Warshall (All pairs shortest path): O(V^3)

## 3. Dynamic Programming Patterns
- 0/1 Knapsack: dp[i][w] = max(dp[i-1][w], val[i-1] + dp[i-1][w-wt[i-1]])
- Longest Common Subsequence (LCS)
- Matrix Chain Multiplication (MCM)

Created & Verified by Aarav Sharma (DTU). Best of luck for semester exams!`
      },
      {
        title: 'DBMS SQL & Normalization Cheatsheet (1NF to BCNF)',
        description: 'Clean tables, functional dependencies decomposition, lossless join, dependency preservation, and ACID properties with transaction diagrams.',
        subject_id: 2,
        uploader_id: 3,
        file_name: 'dbms_normalization_cheatsheet.pdf',
        original_name: 'DBMS_Normalization_Formulas.pdf',
        file_size: 1820000,
        file_type: 'application/pdf',
        semester: '5',
        tags: 'dbms, sql, bcnf, normalization, acid, indexing',
        downloads_count: 142,
        content: `# Database Management Systems - Normalization & Transactions
Subject Code: CS302

### Normal Forms
1. 1NF: Atomic values only. No repeating groups.
2. 2NF: In 1NF + No partial dependency (non-prime attributes fully dependent on candidate key).
3. 3NF: In 2NF + No transitive dependency (X -> Y where neither X is superkey nor Y is prime).
4. BCNF (Boyce-Codd): For every non-trivial FD X -> Y, X must be a super key.

### ACID Properties
- Atomicity: All or none (Rollback on failure)
- Consistency: DB remains in valid state before & after
- Isolation: Concurrent transactions do not interfere
- Durability: Committed updates persist even on crash`
      },
      {
        title: 'Operating Systems - Process Synchronization & Semaphores',
        description: 'Classical IPC problems: Producer-Consumer, Dining Philosophers, Reader-Writer solutions in C pseudocode with mutex and counting semaphores.',
        subject_id: 3,
        uploader_id: 1,
        file_name: 'os_process_sync_notes.pdf',
        original_name: 'OS_Process_Synchronization_Semaphores.pdf',
        file_size: 1540000,
        file_type: 'application/pdf',
        semester: '5',
        tags: 'operating-systems, semaphores, deadlock, banker-algorithm, paging',
        downloads_count: 64,
        content: `# Operating Systems: Process Synchronization
Subject Code: CS301

### Critical Section Problem Criteria:
1. Mutual Exclusion
2. Progress
3. Bounded Waiting

### Semaphores:
- wait(S): while(S <= 0); S--;
- signal(S): S++;

### Deadlock 4 Necessary Conditions (Coffman conditions):
1. Mutual exclusion
2. Hold and wait
3. No preemption
4. Circular wait

Banker's Algorithm: Safety test using Work and Finish vectors.`
      },
      {
        title: 'Engineering Mathematics III - Laplace & Fourier Transforms',
        description: 'Formulas, step-by-step solved university questions, Dirac delta function, convolution theorem, and Z-transforms.',
        subject_id: 4,
        uploader_id: 2,
        file_name: 'engg_math_laplace_fourier.pdf',
        original_name: 'Engg_Math_Laplace_Formula_Sheet.pdf',
        file_size: 2100000,
        file_type: 'application/pdf',
        semester: '3',
        tags: 'mathematics, laplace, fourier, calculus, differential-equations',
        downloads_count: 98,
        content: `# Engineering Mathematics III
Subject Code: MA101

### Standard Laplace Transforms:
- L{1} = 1/s
- L{t^n} = n! / s^(n+1)
- L{e^(at)} = 1 / (s - a)
- L{sin(at)} = a / (s^2 + a^2)
- L{cos(at)} = s / (s^2 + a^2)

### First Shifting Theorem:
If L{f(t)} = F(s), then L{e^(at) f(t)} = F(s - a)

### Convolution Theorem:
L{f(t) * g(t)} = F(s) . G(s)`
      },
      {
        title: 'Computer Networks - OSI Layers, TCP/IP, Subnetting & Routing',
        description: 'Complete breakdown of 7 OSI layers, CIDR subnetting calculation tricks, Go-Back-N vs Selective Repeat ARQ, and TCP handshake.',
        subject_id: 5,
        uploader_id: 3,
        file_name: 'cn_osi_tcp_subnetting.pdf',
        original_name: 'Computer_Networks_Subnetting_Cheatsheet.pdf',
        file_size: 1980000,
        file_type: 'application/pdf',
        semester: '6',
        tags: 'networking, tcp, osi, subnetting, routing, http',
        downloads_count: 115,
        content: `# Computer Networks - Fast Exam Preparation
Subject Code: CS401

### OSI 7 Layer Model:
1. Physical (Bits, Cables, Hubs)
2. Data Link (Frames, MAC address, Switches)
3. Network (Packets, IP address, Routers)
4. Transport (Segments, TCP/UDP, Port numbers)
5. Session (Dialog control)
6. Presentation (Encryption, Compression)
7. Application (HTTP, DNS, SMTP)

### TCP 3-Way Handshake:
Client -> SYN (seq=x) -> Server
Server -> SYN-ACK (seq=y, ack=x+1) -> Client
Client -> ACK (ack=y+1) -> Server`
      }
    ];

    for (const note of sampleNotes) {
      // Create actual file in UPLOADS_DIR so download works immediately!
      const diskFilePath = path.join(UPLOADS_DIR, note.file_name);
      fs.writeFileSync(diskFilePath, note.content, 'utf-8');

      db.run(
        `INSERT INTO notes (title, description, subject_id, uploader_id, file_name, original_name, file_path, file_size, file_type, semester, tags, downloads_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          note.title,
          note.description,
          note.subject_id,
          note.uploader_id,
          note.file_name,
          note.original_name,
          diskFilePath,
          note.file_size,
          note.file_type,
          note.semester,
          note.tags,
          note.downloads_count
        ]
      );
    }

    // Seed some bookmarks
    db.run(`INSERT INTO bookmarks (user_id, note_id) VALUES (1, 2)`);
    db.run(`INSERT INTO bookmarks (user_id, note_id) VALUES (1, 4)`);
    db.run(`INSERT INTO bookmarks (user_id, note_id) VALUES (2, 1)`);
  }
}
