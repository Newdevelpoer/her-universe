/* ═══════════════════════════════════════════════════
   COUNTDOWN.JS  —  Birthday Countdown
═══════════════════════════════════════════════════ */

/* ════════════════════════════════════
   SET HER BIRTHDAY HERE  (YYYY-MM-DD)
════════════════════════════════════ */
window.HER_BIRTHDAY = "2026-07-15";

(function () {
  function bump(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    const v = String(val).padStart(2, '0');
    if (el.textContent !== v) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
      el.textContent = v;
    }
  }

  function tick() {
    const now   = new Date();
    let   bday  = new Date(window.HER_BIRTHDAY + 'T00:00:00');
    if (bday <= now) bday.setFullYear(bday.getFullYear() + 1);
    const diff  = bday - now;

    if (diff <= 0) {
      ['cdd','cdh','cdm','cds'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '00';
      });
      const msg = document.getElementById('bmsg');
      if (msg) msg.style.display = 'block';
      return;
    }

    bump('cdd', Math.floor(diff / 864e5));
    bump('cdh', Math.floor((diff % 864e5) / 36e5));
    bump('cdm', Math.floor((diff % 36e5)  / 6e4));
    bump('cds', Math.floor((diff % 6e4)   / 1e3));

    const el = document.getElementById('cdt');
    if (el) {
      el.textContent = bday.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('cdd')) return; // not on this page
    tick();
    setInterval(tick, 1000);
  });
})();
