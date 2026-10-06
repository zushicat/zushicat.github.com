/* ============================================================
   Karin Hoehne — portfolio · portrait.js (M3, plan §5.2)
   Renders the pre-sampled halftone dot field onto a DPR-aware
   canvas with a single-beat column-sweep entrance (design-language §9).
   The sampling lives in tools/generate-portrait-fallback.js — this file
   only renders window.PORTRAIT_DOTS (assets/portrait-grid.js).
   Failure path (missing grid / no canvas): swaps in the pre-rendered
   assets/portrait-fallback.svg — the same field, zero drift.
   Reduced motion: no sweep, instant draw.
   Fires 'portrait:rendered' (terminal positions in CSS px) for the M5
   traces, or 'portrait:failed'.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('portrait-canvas');
  var figure = document.getElementById('portrait');
  if (!canvas || !figure) return;

  var data = window.PORTRAIT_DOTS;
  if (!data || !data.dots || !data.gw || !data.gh) { fail(); return; }

  var css = getComputedStyle(document.documentElement);
  var tok = function (name) { return css.getPropertyValue(name).trim(); };
  var COLORS = {
    screen: tok('--se-register-strong'),   // halftone screen — 3.2 on cream (graphics)
    solid: tok('--se-color-ink'),          // solid shapes
    detail: tok('--se-color-ink'),         // feature stipple
    terminal: tok('--se-accent-red'),      // the pop — trace sources (G2 as play)
    paper: tok('--se-color-paper'),        // keyline gap under terminals (§3.4 optical correction)
  };
  if (!COLORS.screen || !COLORS.solid || !COLORS.terminal || !COLORS.paper) { fail(); return; }

  var ctx = canvas.getContext('2d');
  if (!ctx) { fail(); return; }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DURATION = 400; // §9 standard entrance, one beat
  var ease = function (p) { return 1 - Math.pow(1 - p, 3); }; // entrance-curve family
  var cell = 0;
  var sweepCols = Infinity; // column boundary; Infinity = fully drawn
  var raf = 0;

  function size() {
    var w = figure.clientWidth || 320;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round((w * data.gh / data.gw) * dpr);
    canvas.style.aspectRatio = data.gw + ' / ' + data.gh;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = w / data.gw;
  }

  function bandColor(b) {
    return b === 0 ? COLORS.screen : COLORS.solid; // 0 screen · 1 solid · 2 detail
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var i, d, x, y, r;
    for (i = 0; i < data.dots.length; i++) {
      d = data.dots[i];
      if (d[0] > sweepCols) continue;        // dots are row-major: d[0] is the sweep key
      x = d[0] * cell; y = d[1] * cell; r = Math.max(d[2] * cell, 0.35);
      ctx.fillStyle = bandColor(d[3]);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.2832);
      ctx.fill();
    }
    for (i = 0; i < data.terminals.length; i++) {
      d = data.terminals[i];
      if (d[0] > sweepCols) continue;
      ctx.fillStyle = COLORS.paper;          // paper gap so the red reads on dense ink
      ctx.beginPath();
      ctx.arc(d[0] * cell, d[1] * cell, Math.max(d[2] * cell * 1.7, 2), 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = COLORS.terminal;
      ctx.beginPath();
      ctx.arc(d[0] * cell, d[1] * cell, Math.max(d[2] * cell, 1.2), 0, 6.2832);
      ctx.fill();
    }
  }

  function done() {
    window.__portraitDone = true; /* reduced-motion path dispatches before listeners exist */
    window.dispatchEvent(new CustomEvent('portrait:rendered', {
      detail: {
        terminals: data.terminals.map(function (t) { return { x: t[0] * cell, y: t[1] * cell, r: t[2] * cell }; }),
        width: data.gw * cell,
        height: data.gh * cell,
      },
    }));
  }

  function sweep() {
    var t0 = performance.now();
    var frame = function (t) {
      var p = Math.min(1, (t - t0) / DURATION);
      sweepCols = ease(p) * (data.gw + 1) - 0.5;
      draw();
      if (p < 1) { raf = requestAnimationFrame(frame); } else { done(); }
    };
    raf = requestAnimationFrame(frame);
  }

  function fail() {
    if (raf) cancelAnimationFrame(raf);
    canvas.style.display = 'none';
    if (!figure.querySelector('img.portrait-fallback')) {
      var img = document.createElement('img');
      img.className = 'portrait-fallback';
      img.src = './assets/portrait-fallback.svg';
      img.alt = '';
      figure.insertBefore(img, figure.firstChild);
    }
    window.dispatchEvent(new CustomEvent('portrait:failed'));
  }

  /* boot */
  size();
  if (reduced) { draw(); done(); } else { sweep(); }

  /* re-render on resize — instant, entrances are one beat only */
  var resizeTimer = 0;
  if ('ResizeObserver' in window) {
    new ResizeObserver(function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { size(); sweepCols = Infinity; draw(); }, 150);
    }).observe(figure);
  }
})();
