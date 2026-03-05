require('dotenv').config();
const express   = require('express');
const path      = require('path');
const fs        = require('fs');
const multer    = require('multer');
const { v4: uuidv4 } = require('uuid');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_PIN     = process.env.UPLOAD_PIN    || 'sunshine2026';
const MAX_FILE_MB    = parseInt(process.env.MAX_FILE_MB    || '15');
const MAX_PER_SEASON = parseInt(process.env.MAX_PER_SEASON || '500');
const VALID_SEASONS  = new Set(['spring','summer','monsoon','autumn','winter','golden']);
const PHOTOS_DIR     = path.join(__dirname, 'public', 'photos');

/* ── SECURITY HEADERS ── */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:     ["'self'", 'data:', 'https://images.unsplash.com', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
    }
  },
  crossOriginEmbedderPolicy: false,
}));

/* ── RATE LIMITERS ── */
app.use(rateLimit({ windowMs: 15*60*1000, max: 300, standardHeaders: true, legacyHeaders: false }));

const uploadLimiter = rateLimit({
  windowMs: 15*60*1000, max: 40,
  message: { error: 'Upload limit reached. Try again in 15 minutes.' }
});
const authLimiter = rateLimit({
  windowMs: 15*60*1000, max: 10,
  message: { error: 'Too many failed attempts. Locked for 15 minutes.' }
});

app.use(express.json({ limit: '1mb' }));

/* ── MULTER CONFIG ── */
const ALLOWED_MIME = new Set(['image/jpeg','image/jpg','image/png','image/webp','image/gif']);
const ALLOWED_EXT  = new Set(['.jpg','.jpeg','.png','.webp','.gif']);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const season = req.params.season;
    if (!VALID_SEASONS.has(season)) return cb(new Error('Invalid season'));
    const dir = path.join(PHOTOS_DIR, season);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) return cb(new Error('Invalid file type'));
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    ALLOWED_MIME.has(file.mimetype) ? cb(null, true) : cb(new Error('Only images allowed'));
  },
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024, files: 20 }
});

/* ── PIN GUARD ── */
function requirePin(req, res, next) {
  const pin = req.headers['x-upload-pin'] || req.body?.pin;
  if (!pin || pin !== UPLOAD_PIN) return res.status(401).json({ error: 'Wrong PIN.' });
  next();
}

/* ── STATIC ── */
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders(res, fp) {
    if (/\.(js|css)$/.test(fp)) res.setHeader('Cache-Control', 'no-cache');
    else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(fp)) res.setHeader('Cache-Control', 'public,max-age=86400');
  }
}));

/* ── API: LIST PHOTOS ── */
app.get('/api/photos/:season', (req, res) => {
  const season = req.params.season;
  if (!VALID_SEASONS.has(season)) return res.status(400).json({ error: 'Invalid season' });
  const dir = path.join(PHOTOS_DIR, season);
  if (!fs.existsSync(dir)) return res.json({ photos: [], count: 0 });
  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    .map(f => ({
      filename: f,
      url: `/photos/${season}/${f}`,
      uploadedAt: fs.statSync(path.join(dir,f)).mtime.toISOString()
    }))
    .sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  res.json({ season, photos: files, count: files.length });
});

/* ── API: UPLOAD ── */
app.post('/api/upload/:season', authLimiter, uploadLimiter, requirePin, (req, res, next) => {
  const season = req.params.season;
  if (!VALID_SEASONS.has(season)) return res.status(400).json({ error: 'Invalid season' });
  const dir = path.join(PHOTOS_DIR, season);
  if (fs.existsSync(dir)) {
    const cnt = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f)).length;
    if (cnt >= MAX_PER_SEASON) return res.status(400).json({ error: 'Season storage full.' });
  }
  next();
}, upload.array('photos', 20), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files received.' });
  res.json({
    success: true,
    uploaded: req.files.map(f => ({
      filename: f.filename,
      url: `/photos/${req.params.season}/${f.filename}`,
      size: f.size
    }))
  });
});

/* ── API: DELETE ── */
app.delete('/api/photos/:season/:filename', authLimiter, requirePin, (req, res) => {
  const { season, filename } = req.params;
  if (!VALID_SEASONS.has(season)) return res.status(400).json({ error: 'Invalid season' });
  if (!/^[a-f0-9-]{36}\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) return res.status(400).json({ error: 'Invalid filename' });
  const fp = path.join(PHOTOS_DIR, season, filename);
  if (!fp.startsWith(PHOTOS_DIR)) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(fp);
  res.json({ success: true });
});

/* ── API: VERIFY PIN ── */
app.post('/api/verify-pin', authLimiter, (req, res) => {
  const pin = req.body?.pin;
  if (!pin || pin !== UPLOAD_PIN) return res.status(401).json({ valid: false });
  res.json({ valid: true });
});

/* ── ERROR HANDLER ── */
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: `File too large. Max ${MAX_FILE_MB}MB.` });
  if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files. Max 20 at once.' });
  res.status(400).json({ error: err.message || 'Unknown error' });
});

/* ── PAGES ── */
app.get('/',        (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/gallery', (req,res) => res.sendFile(path.join(__dirname,'public','gallery.html')));
app.get('/about',   (req,res) => res.sendFile(path.join(__dirname,'public','about.html')));
app.use((req,res) => res.redirect('/'));

app.listen(PORT, () => {
  console.log('\n✨ Her Universe → http://localhost:'+PORT);
  console.log('   Upload PIN : '+UPLOAD_PIN);
  console.log('   Max size   : '+MAX_FILE_MB+'MB per file\n');
});
