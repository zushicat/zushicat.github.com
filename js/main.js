/* ============================================================
   Karin Hoehne — portfolio · main.js (M5)
   1. Entrance reveals — IntersectionObserver, one beat at a time,
      stagger 100ms (design-language §9); elements are marked from
      JS only, so no-JS shows the full page.
   2. G1 circuit traces — orthogonal, 12px elbows, solder dots —
      drawn from the portrait's three red terminals to the role
      chip, the dek, and the repositories links (masthead-internal;
      traces never cross text). Geometry computed live from DOM
      rects, snapped to the 8px grid, redrawn on resize.
   prefers-reduced-motion: everything instant (CSS + JS guards).
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1 · entrance reveals ---------- */

  var REVEAL_SELECTOR = [
    '.masthead .overline', '.giant-name', '.role-chip', '.dek', '.masthead-links', '.portrait-caption',
    '.section .overline', '.section h2', '.section-dek',
    '.profile-meta', '.prose', '.focus-list',
    '.era', '.project', '.toolbox-group', '.section-note',
    '.footer .overline', '.footer-title', '.footer-cta', '.footer-secondary', '.footer-note'
  ].join(', ');

  var revealables = Array.prototype.slice.call(document.querySelectorAll(REVEAL_SELECTOR));
  revealables.forEach(function (el) { el.classList.add('reveal'); });

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    /* arm transitions only after the hidden state is committed — marking
       must never animate 1 → 0 (flash-then-fade) */
    void document.body.offsetHeight;
    document.documentElement.classList.add('reveal-armed');
    var io = new IntersectionObserver(function (entries) {
      var arriving = entries.filter(function (e) { return e.isIntersecting; });
      arriving.forEach(function (entry, i) {
        entry.target.style.transitionDelay = (Math.min(i, 5) * 100) + 'ms'; // §9 stagger
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 2 · circuit traces ---------- */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function cellTerminals() {
    /* terminals in canvas cell units — from the generated grid blob */
    var data = window.PORTRAIT_DOTS;
    return (data && data.terminals) ? data.terminals.slice() : null;
  }

  function buildTraces() {
    var masthead = document.querySelector('.masthead');
    var canvas = document.getElementById('portrait-canvas');
    var chip = document.querySelector('.role-chip');
    var dek = document.querySelector('.dek');
    var links = document.querySelector('.masthead-links');
    var terms = cellTerminals();
    if (!masthead || !canvas || !chip || !dek || !links || !terms) return null;

    var m = masthead.getBoundingClientRect();
    var c = canvas.getBoundingClientRect();
    var targets = [chip, dek, links].map(function (el) { return el.getBoundingClientRect(); });

    /* stacked layout (portrait above its targets): proximity carries the flow — no traces */
    if (targets[0].top >= c.bottom) return null;

    var snap = function (v) { return Math.round(v / 8) * 8; };
    var cell = c.width / (window.PORTRAIT_DOTS.gw || 48);
    var rel = function (r) {
      return {
        left: r.left - m.left, right: r.right - m.left,
        top: r.top - m.top, bottom: r.bottom - m.top,
        cy: (r.top + r.bottom) / 2 - m.top
      };
    };
    var cr = rel(c);
    var textRight = Math.max.apply(null, targets.map(function (r) { return rel(r).right; }));
    var busBase = snap(textRight + 24);
    if (busBase + 8 >= cr.left) return null; /* no room between text and portrait */

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'trace-overlay');
    svg.setAttribute('width', Math.round(m.width));
    svg.setAttribute('height', Math.round(m.height));
    svg.setAttribute('viewBox', '0 0 ' + Math.round(m.width) + ' ' + Math.round(m.height));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    /* terminals sorted top→bottom (they are generated that way), targets likewise */
    terms.sort(function (a, b) { return a[1] - b[1]; });
    targets.sort(function (a, b) { return a.top - b.top; });

    terms.forEach(function (t, i) {
      var tr = targets[i];
      if (!tr) return;
      var r = rel(tr);
      var sx = cr.left + t[0] * cell;          /* terminal anchor (unsnapped — it pins to the red dot) */
      var sy = cr.top + t[1] * cell;
      var busX = busBase - (terms.length - 1 - i) * 8; /* staggered 8px-apart bus verticals */
      var endX = r.right - 2;
      var endY = r.cy;
      var dir = endY > sy ? 1 : -1;
      var d = 'M ' + sx + ' ' + sy +
        ' L ' + (busX + 12) + ' ' + sy +
        ' Q ' + busX + ' ' + sy + ' ' + busX + ' ' + (sy + dir * 12) +
        ' L ' + busX + ' ' + (endY - dir * 12) +
        ' Q ' + busX + ' ' + endY + ' ' + (busX - 12) + ' ' + endY +
        ' L ' + endX + ' ' + endY;
      var p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('class', 'trace');
      p.setAttribute('d', d);
      p.setAttribute('pathLength', '1');
      svg.appendChild(p);
      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('class', 'trace-dot');
      dot.setAttribute('cx', endX);
      dot.setAttribute('cy', endY);
      dot.setAttribute('r', '4');
      svg.appendChild(dot);
    });

    var old = masthead.querySelector('.trace-overlay');
    if (old) old.parentNode.removeChild(old);
    masthead.appendChild(svg);
    return svg;
  }

  function showTraces() {
    var svg = buildTraces();
    if (!svg) return;
    if (reduced) { svg.classList.add('is-drawn'); return; }
    /* draw-in one beat after the portrait sweep lands (§9: one beat at a time) */
    setTimeout(function () {
      svg.classList.add('is-drawn');
      window.setTimeout(function () {
        Array.prototype.forEach.call(svg.querySelectorAll('.trace'), function (p) {
          p.style.strokeDasharray = 'none'; /* crisp solid strokes once drawn */
        });
      }, 600);
    }, 400);
  }

  if (window.__portraitDone) {
    showTraces();
  } else {
    window.addEventListener('portrait:rendered', showTraces, { once: true });
    window.addEventListener('portrait:failed', function () { /* no portrait → no traces */ }, { once: true });
  }

  /* redraw traces on resize (geometry is live-computed) */
  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var svg = document.querySelector('.trace-overlay');
      if (svg) { showTraces(); }
    }, 150);
  });
})();
