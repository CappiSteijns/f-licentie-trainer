// Confetti over het hele scherm (en boven een geopend venster), ongeveer 3,5 seconde. Zonder animatie als je systeem
// "minder beweging" vraagt: dan blijft het bij het feestelijke venster.
export function confetti(ms = 3500) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas');
  cv.setAttribute('popover', 'manual');   // popover komt in de 'top layer', dus óók boven een modaal venster
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;margin:0;padding:0;border:0;background:transparent;pointer-events:none;overflow:hidden';
  document.body.append(cv);
  try { cv.showPopover(); } catch { /* oudere browser: dan zonder top layer */ }
  const dpr = window.devicePixelRatio || 1, W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr, ctx = cv.getContext('2d');
  const colors = ['#4da3ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#ff7b72', '#79c0ff'];
  const mk = (x, y, vx, vy) => ({ x, y, vx, vy, w: (6 + Math.random() * 7) * dpr, h: (4 + Math.random() * 5) * dpr, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4, c: colors[(Math.random() * colors.length) | 0] });
  const ps = [];
  for (let i = 0; i < 110; i++) ps.push(mk(W * (.2 + Math.random() * .6), H * .35, (Math.random() - .5) * 16 * dpr, -(8 + Math.random() * 12) * dpr));   // fontein uit het midden
  for (let i = 0; i < 70; i++) ps.push(mk(Math.random() * W, -20 * dpr - Math.random() * H * .4, (Math.random() - .5) * 3 * dpr, (2 + Math.random() * 3) * dpr));   // regen van boven
  const t0 = performance.now();
  (function frame(now) {
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = t > ms - 800 ? Math.max(0, (ms - t) / 800) : 1;
    for (const p of ps) {
      p.vy += .32 * dpr; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (t < ms) requestAnimationFrame(frame); else { try { cv.hidePopover(); } catch { /* */ } cv.remove(); }
  })(t0);
}
