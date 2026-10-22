/* =====================================================================
   WELT – Uhrwache: Ein Komet kreist als Zeiger über die Sternenuhr und springt Stern für Stern weiter.
   Manchmal springt er ZWEI Sterne weit – dann sofort Leertaste! Halte bis zum Ende Wache.
   Später: längere Wache, schnelleres Ticken, feinere Teilung, Sternschnuppen lenken ab,
   und der Zeiger stockt manchmal (Stocken ist kein Signal).
   ===================================================================== */
function makeUhrwache(next, level = 0) {
  const DUR = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75][level], TICK = [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55][level];
  const TGT = [5, 5, 6, 6, 6, 6, 7, 7, 7, 7][level], POS = [30, 30, 36, 36, 36, 40, 48, 48, 60, 60][level];
  const DISTRACT = level >= 4, STALL = [0, 0, 0, 0, 0, 0, 0, 0.05, 0.06, 0.07][level], WIN = 1.6, LIVES = 3;
  const CX = W / 2, CY = 218, RAD = 138;
  const finale = makeFinale(next);
  let plan, tickI, tickT, pos, shown, lastStep, jumpId, sinceJump, open, answered, lives, failed, timer, comets, fb, fbOk, t = 0, msg = '', msgT = 0, trail, hitAgo = 9;
  const ri = n => Math.floor(Math.random() * n);
  function makePlan() {
    const n = Math.round(DUR / TICK); plan = new Array(n).fill(1);
    let placed = 0, guard = 0;
    while (placed < TGT && guard++ < 1000) {
      const k = 4 + ri(n - 6);
      let ok = true; for (let d = -4; d <= 4; d++) if (plan[k + d] === 2) ok = false;
      if (ok) { plan[k] = 2; placed++; }
    }
    if (STALL) for (let k = 3; k < n - 1; k++) if (plan[k] === 1 && plan[k - 1] === 1 && plan[k + 1] === 1 && Math.random() < STALL) plan[k] = 0;
  }
  function reset() {
    makePlan(); tickI = 0; tickT = 1.2; pos = ri(POS); shown = pos; lastStep = 1; jumpId = 0; sinceJump = 9; open = null; answered = false;
    lives = LIVES; failed = false; comets = []; fb = 0; trail = [];
  }
  reset();
  function lose(text) { lives--; msg = text; msgT = 1.4; fb = 1; fbOk = false; Klang.tone(150, 0.35); if (lives <= 0) { failed = true; timer = 0.6; } }
  const ang = p => -Math.PI / 2 + p / POS * Math.PI * 2;
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, lastStep, jumpId, sinceJump, open: !!open }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; fb = Math.max(0, fb - dt * 2);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { timer -= dt; if (timer <= 0 && pressed.action) { died(); reset(); } return; }
      sinceJump += dt; hitAgo += dt;
      // Zeiger gleitet kurz zum neuen Stern
      shown += (pos - shown) * Math.min(1, dt * 30);
      tickT -= dt;
      if (tickT <= 0) {
        if (tickI >= plan.length) { if (!open) { finale.start(); Klang.tone(700, 0.4); } }
        else {
          const st = plan[tickI++]; trail.push(shown); if (trail.length > 3) trail.shift();
          pos += st; lastStep = st; jumpId++; sinceJump = 0; tickT = TICK;
          if (st > 0) Klang.tone(392, 0.04);
          if (st === 2) { open = { t: WIN }; }
        }
      }
      if (open) { open.t -= dt; if (open.t <= 0) { open = null; lose('Doppelsprung verpasst!'); if (failed) return; } }
      if (pressed.action) {
        if (open) { open = null; hitAgo = 0; fb = 1; fbOk = true; Klang.tone(660, 0.15); }
        else if (hitAgo > 0.5) lose('Kein Doppelsprung – Fehlalarm!');
      }
      if (DISTRACT) {
        if (Math.random() < dt * (0.25 + level * 0.04)) { const y = 40 + Math.random() * 300, l = Math.random() < 0.5; comets.push({ x: l ? -20 : W + 20, y, vx: (l ? 1 : -1) * (260 + Math.random() * 200), vy: 40 + Math.random() * 60, life: 2.5 }); }
        for (const m of comets) { m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt; }
        comets = comets.filter(m => m.life > 0);
      }
    },
    draw(c) {
      const g = c.createRadialGradient(CX, CY, 20, CX, CY, 460); g.addColorStop(0, '#1b1f4d'); g.addColorStop(1, '#05040f');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) { const x = (i * 131) % W, y = (i * 71 + 17) % H, a = 0.25 + 0.2 * Math.sin(t * 1.5 + i); c.fillStyle = `rgba(220,225,255,${a})`; c.fillRect(x, y, 1.5, 1.5); }
      for (const m of comets) {
        const tg = c.createLinearGradient(m.x, m.y, m.x - m.vx * 0.15, m.y - m.vy * 0.15); tg.addColorStop(0, 'rgba(255,255,255,0.9)'); tg.addColorStop(1, 'rgba(255,255,255,0)');
        c.strokeStyle = tg; c.lineWidth = 2; c.beginPath(); c.moveTo(m.x, m.y); c.lineTo(m.x - m.vx * 0.15, m.y - m.vy * 0.15); c.stroke();
      }
      // Zifferblatt
      c.strokeStyle = 'rgba(160,170,255,0.25)'; c.lineWidth = 1; c.beginPath(); c.arc(CX, CY, RAD + 16, 0, 7); c.stroke();
      c.beginPath(); c.arc(CX, CY, RAD - 16, 0, 7); c.stroke();
      for (let p = 0; p < POS; p++) {
        const a = ang(p), x = CX + Math.cos(a) * RAD, y = CY + Math.sin(a) * RAD, big = p % 5 === 0;
        c.fillStyle = big ? '#dfe3ff' : 'rgba(200,205,255,0.6)'; c.beginPath(); c.arc(x, y, big ? 2.6 : 1.7, 0, 7); c.fill();
      }
      c.fillStyle = '#2a2e6a'; c.beginPath(); c.arc(CX, CY, 9, 0, 7); c.fill();
      // Komet als Zeiger
      for (let i = 0; i < trail.length; i++) { const a = ang(trail[i]); c.fillStyle = `rgba(255,220,150,${0.1 + i * 0.07})`; c.beginPath(); c.arc(CX + Math.cos(a) * RAD, CY + Math.sin(a) * RAD, 4, 0, 7); c.fill(); }
      const a = ang(shown), hx = CX + Math.cos(a) * RAD, hy = CY + Math.sin(a) * RAD;
      c.strokeStyle = 'rgba(255,220,150,0.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(CX, CY); c.lineTo(hx, hy); c.stroke();
      const hg = c.createRadialGradient(hx, hy, 1, hx, hy, 18); hg.addColorStop(0, 'rgba(255,235,180,1)'); hg.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = hg; c.fillRect(hx - 18, hy - 18, 36, 36);
      // verbleibende Wachzeit als innerer Bogen
      const rest = clamp(1 - tickI / plan.length, 0, 1);
      c.strokeStyle = 'rgba(120,200,255,0.5)'; c.lineWidth = 4; c.beginPath(); c.arc(CX, CY, RAD - 30, -Math.PI / 2, -Math.PI / 2 + rest * Math.PI * 2); c.stroke();
      if (fb > 0) { c.strokeStyle = fbOk ? `rgba(125,255,176,${fb})` : `rgba(255,77,109,${fb})`; c.lineWidth = 3; c.beginPath(); c.arc(CX, CY, RAD + 26 + (1 - fb) * 20, 0, 7); c.stroke(); }
      label(c, `Wache ${Math.ceil(rest * DUR)} s`, 16, 26, '#c8d0ff');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff8aa8', 'right', 16);
      if (msgT > 0) label(c, msg, W / 2, 392, fb > 0 && fbOk ? '#7dffb0' : '#ffb3c0', 'center', 13);
      else label(c, STALL ? 'Leertaste nur beim DOPPELsprung · Stocken zählt nicht' : 'Leertaste, wenn der Komet ZWEI Sterne weit springt', W / 2, 392, '#9aa4e8', 'center', 13);
      if (failed) { c.fillStyle = 'rgba(5,4,15,0.92)'; c.fillRect(0, 178, W, 80); label(c, 'Wache verloren. Leertaste: neuer Versuch', W / 2, 223, '#ff9db0', 'center', 14); }
      finale.draw(c, '#c8d0ff', '#1b1f4d');
    }
  };
  return self;
}
