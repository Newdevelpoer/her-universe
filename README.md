# Her Universe v2.0

A beautiful animated photo gallery with **secure photo uploads** per season.

## Structure

```
her-universe/
├── server.js              Express server (secure)
├── package.json
├── .env                   Your secrets (never commit this)
├── .env.example           Template
├── public/
│   ├── index.html
│   ├── gallery.html       Upload buttons on every season card
│   ├── about.html
│   ├── photos/            Uploaded photos stored here
│   │   ├── spring/
│   │   ├── summer/
│   │   ├── monsoon/
│   │   ├── autumn/
│   │   ├── winter/
│   │   └── golden/
│   ├── css/
│   │   ├── base.css
│   │   ├── home.css
│   │   ├── gallery.css
│   │   ├── about.css
│   │   └── upload.css     Upload UI styles
│   └── js/
│       ├── cursor.js      Season-aware trail (snow/leaves/rain/petals...)
│       ├── common.js
│       ├── seasons.js     Canvas transition animations
│       ├── gallery.js
│       ├── home.js
│       ├── countdown.js
│       ├── about.js
│       └── upload.js      PIN modal, drag-drop, progress, user photo grid
```

## Quick Start

```bash
npm install
npm start
# Open http://localhost:3000
```

## Uploading Photos

1. Click **Upload** on any season card (or "Add Photos" inside the season view)
2. Enter the PIN (default: `sunshine2026` — change it in `.env`!)
3. Drag & drop or browse — supports JPEG, PNG, WEBP, GIF up to 15MB each
4. Uploaded photos appear at the top of that season's view with a delete button

## Security Features

| Feature | Detail |
|---------|--------|
| Helmet  | Secure HTTP headers, CSP, XSS protection |
| Rate limiting | 300 req/15min general; 40 uploads/15min; 10 auth attempts/15min |
| PIN auth | Required for every upload and delete |
| File validation | MIME type + extension whitelist (images only) |
| UUID filenames | Prevents path traversal and filename conflicts |
| Path guard | Blocks directory traversal attacks |
| File size limit | Configurable in .env (default 15MB) |
| Per-season limit | Max 500 photos per season (configurable) |

## Configure

Edit `.env`:
```
UPLOAD_PIN=your_secret_pin_here
MAX_FILE_MB=15
MAX_PER_SEASON=500
PORT=3000
```

## Deploy to Render / Railway

1. Push to GitHub (make sure `.env` is in `.gitignore`!)
2. Add environment variables in dashboard:
   - `UPLOAD_PIN=your_pin`
   - `NODE_ENV=production`
3. Start command: `npm start`

## Birthday Countdown

Edit `public/js/countdown.js`:
```js
window.HER_BIRTHDAY = "2026-07-15"; // YYYY-MM-DD
```
