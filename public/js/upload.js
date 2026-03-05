/* ═══════════════════════════════════════════════════
   UPLOAD.JS  —  PIN-gated photo upload system
   Features: drag-drop, multi-file, progress per file,
             user photo grid inside expanded season,
             delete with PIN re-use, toast notifications
═══════════════════════════════════════════════════ */

window.UploadManager = (function () {

  /* ── State ── */
  let verifiedPin  = null;   // cached after first successful verify
  let activeSeason = null;   // season currently being uploaded to
  let pendingFiles = [];     // FileList waiting to upload

  const SEASON_META = {
    spring:  { label:'Spring Whispers',  emoji:'🌸', badge:'rgba(255,198,221,.4)' },
    summer:  { label:'Summer Radiance',  emoji:'☀️', badge:'rgba(255,230,102,.4)' },
    monsoon: { label:'Monsoon Romance',  emoji:'🌧️', badge:'rgba(189,224,254,.5)' },
    autumn:  { label:'Autumn Grace',     emoji:'🍂', badge:'rgba(255,179,71,.35)' },
    winter:  { label:'Winter Glow',      emoji:'❄️', badge:'rgba(162,210,255,.4)' },
    golden:  { label:'Golden Hour',      emoji:'✨', badge:'rgba(205,186,219,.4)' },
  };

  /* ── DOM refs (created once) ── */
  let pinModal, pinInput, pinError, pinSubmit, pinBadge;
  let uploadModal, dropZone, fileInput, previewQueue, uploadGoBtn;
  let toast, toastTimer;

  /* ══════════════════════════════════
     INIT — inject modals into DOM
  ══════════════════════════════════ */
  function init () {
    injectHTML();
    pinModal    = document.getElementById('pinModal');
    pinInput    = document.getElementById('pinInput');
    pinError    = document.getElementById('pinError');
    pinSubmit   = document.getElementById('pinSubmit');
    pinBadge    = document.getElementById('pinBadge');
    uploadModal = document.getElementById('uploadModal');
    dropZone    = document.getElementById('dropZone');
    fileInput   = document.getElementById('fileInput');
    previewQueue= document.getElementById('previewQueue');
    uploadGoBtn = document.getElementById('uploadGo');
    toast       = document.getElementById('toast');

    bindEvents();
  }

  /* ── Inject modal HTML ── */
  function injectHTML () {
    const div = document.createElement('div');
    div.innerHTML = `
<!-- PIN modal -->
<div id="pinModal">
  <div class="pin-box">
    <button class="pin-close ripR" onclick="UploadManager.closePinModal()">✕</button>
    <span class="pin-icon">🔐</span>
    <h3 class="pin-title">Enter Upload PIN</h3>
    <p class="pin-sub">Only authorised users can add photos to her universe. Enter the PIN to continue.</p>
    <div id="pinBadge" class="pin-season-badge">Season</div>
    <div class="pin-input-wrap">
      <input id="pinInput" class="pin-input" type="password" maxlength="30"
             placeholder="• • • • • • • •" autocomplete="off" autocorrect="off" spellcheck="false">
    </div>
    <p id="pinError" class="pin-error"></p>
    <button id="pinSubmit" class="pin-submit ripR">Verify PIN →</button>
  </div>
</div>

<!-- Upload modal -->
<div id="uploadModal">
  <div class="upload-box">
    <div class="upload-box-hdr">
      <div class="upload-box-title">
        <span id="uSeasonLabel">Season</span>
        Add Your Photos
      </div>
      <button class="uclose ripR" onclick="UploadManager.closeUploadModal()">✕</button>
    </div>

    <div id="dropZone" class="drop-zone">
      <input id="fileInput" type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" multiple>
      <span class="drop-icon">📸</span>
      <p class="drop-label">Drop your photos here</p>
      <p class="drop-sub">JPEG, PNG, WEBP, GIF — max 15MB each</p>
      <div class="drop-or">or</div>
      <button class="browse-btn ripR" onclick="document.getElementById('fileInput').click()">
        Browse Files
      </button>
    </div>

    <div id="previewQueue" class="preview-queue"></div>

    <div class="upload-actions" id="uploadActions" style="display:none">
      <button class="upload-clear ripR" onclick="UploadManager.clearQueue()">Clear</button>
      <button id="uploadGo" class="upload-go ripR">Upload All ✨</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast"></div>`;
    document.body.appendChild(div);
  }

  /* ══════════════════════════════════
     EVENTS
  ══════════════════════════════════ */
  function bindEvents () {
    /* PIN submit */
    pinSubmit.addEventListener('click', submitPin);
    pinInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitPin(); });

    /* File input change */
    fileInput.addEventListener('change', () => addFiles(Array.from(fileInput.files)));

    /* Drag & drop */
    dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault(); dropZone.classList.remove('drag-over');
      addFiles(Array.from(e.dataTransfer.files));
    });

    /* Upload go */
    uploadGoBtn.addEventListener('click', doUpload);

    /* Dismiss modals on backdrop click */
    pinModal.addEventListener('click',    e => { if (e.target === pinModal)    closePinModal(); });
    uploadModal.addEventListener('click', e => { if (e.target === uploadModal) closeUploadModal(); });
  }

  /* ══════════════════════════════════
     OPEN FLOW  —  called from gallery card button
  ══════════════════════════════════ */
  function openForSeason (season) {
    activeSeason = season;
    const meta = SEASON_META[season] || {};

    if (verifiedPin) {
      // PIN already verified this session — go straight to upload
      openUploadModal();
    } else {
      // Show PIN modal first
      pinBadge.textContent = (meta.emoji || '') + '  ' + (meta.label || season);
      pinBadge.style.background = meta.badge || 'rgba(205,186,219,.4)';
      pinError.textContent = '';
      pinInput.value = '';
      pinInput.classList.remove('error');
      pinModal.classList.add('open');
      setTimeout(() => pinInput.focus(), 200);
    }
  }

  /* ══════════════════════════════════
     PIN LOGIC
  ══════════════════════════════════ */
  async function submitPin () {
    const pin = pinInput.value.trim();
    if (!pin) { shakeInput(); return; }

    pinSubmit.disabled = true;
    pinSubmit.textContent = 'Checking…';
    pinError.textContent = '';

    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.valid) {
        verifiedPin = pin;
        closePinModal();
        openUploadModal();
      } else {
        pinError.textContent = 'Wrong PIN. Try again.';
        shakeInput();
      }
    } catch (err) {
      pinError.textContent = 'Network error. Please try again.';
    }

    pinSubmit.disabled = false;
    pinSubmit.textContent = 'Verify PIN →';
  }

  function shakeInput () {
    pinInput.classList.remove('error');
    void pinInput.offsetWidth;
    pinInput.classList.add('error');
    setTimeout(() => pinInput.classList.remove('error'), 600);
  }

  function closePinModal () {
    pinModal.classList.remove('open');
  }

  /* ══════════════════════════════════
     UPLOAD MODAL
  ══════════════════════════════════ */
  function openUploadModal () {
    const meta = SEASON_META[activeSeason] || {};
    document.getElementById('uSeasonLabel').textContent =
      (meta.emoji || '') + ' ' + (meta.label || activeSeason) + ' — ';
    pendingFiles = [];
    previewQueue.innerHTML = '';
    document.getElementById('uploadActions').style.display = 'none';
    fileInput.value = '';
    uploadModal.classList.add('open');
  }

  function closeUploadModal () {
    uploadModal.classList.remove('open');
    pendingFiles = [];
    previewQueue.innerHTML = '';
    document.getElementById('uploadActions').style.display = 'none';
  }

  /* ── Add files to preview queue ── */
  function addFiles (files) {
    const imageFiles = files.filter(f => /^image\/(jpeg|jpg|png|webp|gif)$/i.test(f.type));
    if (imageFiles.length < files.length) {
      showToast('Some files skipped — only images allowed', 'info');
    }
    imageFiles.forEach(file => {
      if (pendingFiles.find(f => f.name === file.name && f.size === file.size)) return; // dedup
      pendingFiles.push(file);
      renderPreviewItem(file);
    });
    document.getElementById('uploadActions').style.display =
      pendingFiles.length > 0 ? 'flex' : 'none';
  }

  function renderPreviewItem (file) {
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.id = 'prev-' + safeId(file);

    const reader = new FileReader();
    reader.onload = e => {
      item.querySelector('.preview-thumb').src = e.target.result;
    };
    reader.readAsDataURL(file);

    item.innerHTML = `
      <img class="preview-thumb" src="" alt="">
      <div class="preview-info">
        <div class="preview-name">${escHtml(file.name)}</div>
        <div class="preview-size">${formatSize(file.size)}</div>
        <div class="preview-bar-wrap"><div class="preview-bar"></div></div>
      </div>
      <span class="preview-status">⏳</span>`;
    previewQueue.appendChild(item);
  }

  /* ── Do the upload ── */
  async function doUpload () {
    if (!pendingFiles.length) return;
    uploadGoBtn.disabled = true;
    uploadGoBtn.textContent = 'Uploading…';

    let successCount = 0;
    let failCount    = 0;

    // Upload in batches of 5
    const batchSize = 5;
    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      const batch = pendingFiles.slice(i, i + batchSize);
      const fd    = new FormData();
      batch.forEach(f => fd.append('photos', f));

      // Mark batch as uploading
      batch.forEach(f => setItemStatus(f, 'uploading', null));

      try {
        const res = await fetchWithProgress(
          `/api/upload/${activeSeason}`,
          fd,
          batch,
          progress => batch.forEach(f => setItemProgress(f, progress))
        );

        if (res.success) {
          successCount += res.uploaded.length;
          batch.forEach(f => setItemStatus(f, 'done', '✅'));
        } else {
          failCount += batch.length;
          batch.forEach(f => setItemStatus(f, 'fail', '❌'));
          if (res.error) showToast(res.error, 'error');
        }
      } catch (err) {
        failCount += batch.length;
        batch.forEach(f => setItemStatus(f, 'fail', '❌'));
      }
    }

    // Summary toast
    if (successCount > 0) {
      showToast(`${successCount} photo${successCount>1?'s':''} uploaded! 🎉`, 'success');
      // Refresh user photos in expanded view if open
      refreshUserPhotos(activeSeason);
    }
    if (failCount > 0) showToast(`${failCount} file${failCount>1?'s':''} failed`, 'error');

    uploadGoBtn.disabled = false;
    uploadGoBtn.textContent = 'Upload All ✨';
    pendingFiles = [];
    document.getElementById('uploadActions').style.display = 'none';
  }

  /* XHR-based upload so we can track progress */
  function fetchWithProgress (url, formData, files, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('x-upload-pin', verifiedPin);

      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
      });

      xhr.addEventListener('load', () => {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error('Invalid server response')); }
      });
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.send(formData);
    });
  }

  function setItemProgress (file, pct) {
    const item = document.getElementById('prev-' + safeId(file));
    if (!item) return;
    item.querySelector('.preview-bar').style.width = pct + '%';
  }

  function setItemStatus (file, state, icon) {
    const item = document.getElementById('prev-' + safeId(file));
    if (!item) return;
    item.classList.toggle('done', state === 'done');
    item.classList.toggle('fail', state === 'fail');
    if (icon) item.querySelector('.preview-status').textContent = icon;
    if (state === 'done') item.querySelector('.preview-bar').style.width = '100%';
  }

  function clearQueue () {
    pendingFiles = [];
    previewQueue.innerHTML = '';
    fileInput.value = '';
    document.getElementById('uploadActions').style.display = 'none';
  }

  /* ══════════════════════════════════
     USER PHOTOS GRID (inside expanded season)
  ══════════════════════════════════ */
  async function loadUserPhotos (season, containerEl) {
    try {
      const res  = await fetch(`/api/photos/${season}`);
      const data = await res.json();
      renderUserPhotos(data.photos || [], season, containerEl);
    } catch (e) {
      containerEl.innerHTML = '<p class="user-photos-empty">Could not load uploaded photos.</p>';
    }
  }

  function renderUserPhotos (photos, season, containerEl) {
    const section = containerEl.querySelector('.user-photos-section');
    if (section) section.remove();

    if (!photos.length) return; // nothing to show

    const sec = document.createElement('div');
    sec.className = 'user-photos-section';
    sec.innerHTML = `
      <div class="user-photos-hdr">
        <span class="user-photos-title">Your Added Photos</span>
        <span class="user-photos-count">${photos.length} photo${photos.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="user-photos-grid" id="uGrid-${season}"></div>`;
    containerEl.insertBefore(sec, containerEl.querySelector('.masonry'));

    const grid = sec.querySelector('.user-photos-grid');
    photos.forEach(p => grid.appendChild(makePhotoCard(p, season, grid)));
  }

  function makePhotoCard (photo, season, grid) {
    const div = document.createElement('div');
    div.className = 'user-photo-item';
    div.id = 'uph-' + photo.filename.replace(/\./g, '-');
    div.innerHTML = `
      <img src="${photo.url}" alt="" loading="lazy">
      <button class="user-photo-del ripR" title="Delete photo" data-fn="${escHtml(photo.filename)}" data-season="${season}">✕</button>`;
    div.querySelector('.user-photo-del').addEventListener('click', function (e) {
      e.stopPropagation();
      deletePhoto(season, photo.filename, div);
    });
    return div;
  }

  async function deletePhoto (season, filename, cardEl) {
    if (!verifiedPin) {
      showToast('Enter your PIN first to delete photos', 'info');
      openForSeason(season);
      return;
    }
    try {
      const res  = await fetch(`/api/photos/${season}/${filename}`, {
        method: 'DELETE',
        headers: { 'x-upload-pin': verifiedPin }
      });
      const data = await res.json();
      if (data.success) {
        cardEl.style.transform = 'scale(0)';
        cardEl.style.opacity   = '0';
        cardEl.style.transition = 'all .3s';
        setTimeout(() => {
          cardEl.remove();
          showToast('Photo deleted', 'info');
        }, 300);
      } else {
        showToast(data.error || 'Delete failed', 'error');
        if (res.status === 401) verifiedPin = null; // PIN expired/wrong
      }
    } catch {
      showToast('Network error', 'error');
    }
  }

  async function refreshUserPhotos (season) {
    const expv = document.getElementById('expv');
    if (!expv || !expv.classList.contains('open')) return;
    // Check if this is the right season
    const nameEl = document.getElementById('ename');
    if (!nameEl) return;
    await loadUserPhotos(season, expv);
  }

  /* ══════════════════════════════════
     TOAST
  ══════════════════════════════════ */
  function showToast (msg, type = 'info') {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = '';
    void toast.offsetWidth;
    toast.classList.add('show', type);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* ── Helpers ── */
  function safeId (file) {
    return (file.name + file.size).replace(/[^a-zA-Z0-9]/g, '_');
  }
  function escHtml (s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function formatSize (bytes) {
    return bytes < 1024*1024 ? (bytes/1024).toFixed(0)+'KB' : (bytes/1024/1024).toFixed(1)+'MB';
  }

  /* ── Public API ── */
  return {
    init,
    openForSeason,
    closePinModal,
    closeUploadModal,
    clearQueue,
    loadUserPhotos,
    showToast,
  };

})();

document.addEventListener('DOMContentLoaded', () => UploadManager.init());
