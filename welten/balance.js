/* =====================================================================
   WELT – Balance: Über ein Seil zur Tür auf der anderen Seite. Halte die Balance mit ← →.
   Je höher das Level, desto wackliger das Gleichgewicht und desto stärker der Wind.
   ===================================================================== */
function makeBalance(next, level = 0) {
  const LEN = [420, 520, 620, 720, 820, 900, 980, 1060, 1140, 1220][level], WALK = [42, 46, 50, 54, 58, 60, 62, 64, 66, 68][level];
  const GRAV = [2.4, 3, 3.5, 3.9, 4.3, 4.6, 4.9, 5.2, 5.5, 5.8][level], GUST = [0, 0.7, 1.1, 1.5, 1.9, 2.1, 2.3, 2.5, 2.7, 2.9][level], PUSH = 7;
  const X0 = 70, ROPE_Y = 250;
  let s, th, om, wind, windT, t = 0, flash = 0;
  function reset() { s = 0; th = 0.02; om = 0; wind = 0; windT = 1.5; }
  reset();
  const self = {
    done: false,
    door: () => { const cam = clamp(X0 + s - W * 0.45, 0, LEN + X0 + 120 - W); return { x: X0 + LEN + 40 - cam, y: ROPE_Y - 58, w: 30, h: 56 }; },
    test: () => ({ th, om }), // für Testprogramme
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      windT -= dt; if (windT <= 0) { windT = 1 + Math.random() * 2; wind = (Math.random() * 2 - 1) * GUST; }
      const input = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      om += (GRAV * Math.sin(th) + wind - om * 0.6 + input * PUSH) * dt;
      th += om * dt;
      s += WALK * (1 - Math.min(0.8, Math.abs(th))) * dt;
      if (Math.abs(th) > 1.05) { died(); flash = 0.6; reset(); return; }
      if (s >= LEN + 50) self.done = true;
    },
    draw(c) {
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#2b1640'); sky.addColorStop(0.6, '#d0634a'); sky.addColorStop(1, '#f2b26b');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      const cam = clamp(X0 + s - W * 0.45, 0, LEN + X0 + 120 - W);
      c.fillStyle = 'rgba(60,20,40,0.6)'; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) c.lineTo(x, 300 + Math.sin((x + cam * 0.3) * 0.02) * 20); c.lineTo(W, H); c.fill();
      c.save(); c.translate(-cam, 0);
      c.fillStyle = '#2a1420'; c.fillRect(0, ROPE_Y, X0, H); c.fillRect(X0 + LEN, ROPE_Y, 200, H);
      c.strokeStyle = '#3a2418'; c.lineWidth = 3; c.beginPath(); c.moveTo(X0, ROPE_Y); c.quadraticCurveTo(X0 + LEN / 2, ROPE_Y + 18, X0 + LEN, ROPE_Y); c.stroke();
      paintDoor(c, { x: X0 + LEN + 40, y: ROPE_Y - 58, w: 30, h: 56 }, { frame: '#2a1420', panel: '#d0634a', knob: '#f2b26b', light: next, open: clamp((s - LEN + 60) / 80, 0, 1) });
      // Seiltänzer mit Stange
      const px = X0 + s, k = s / LEN, py = ROPE_Y + Math.sin(Math.PI * clamp(k, 0, 1)) * 18;
      c.save(); c.translate(px, py); c.rotate(th);
      c.strokeStyle = '#1a0c14'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -34); c.moveTo(-6, 0); c.lineTo(0, -14); c.lineTo(6, 0); c.stroke();
      c.beginPath(); c.arc(0, -40, 6, 0, 7); c.fillStyle = '#1a0c14'; c.fill();
      c.strokeStyle = '#5a3a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-50, -26); c.quadraticCurveTo(0, -32, 50, -26); c.stroke();
      c.restore(); c.restore();
      // Neigungsanzeige
      c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 2; c.beginPath(); c.arc(W / 2, 70, 40, Math.PI, 0); c.stroke();
      c.strokeStyle = Math.abs(th) > 0.7 ? '#ff4d4d' : '#ffffff'; c.beginPath(); c.moveTo(W / 2, 70); c.lineTo(W / 2 + Math.sin(th) * 40, 70 - Math.cos(th) * 40); c.stroke();
      if (wind) label(c, wind > 0 ? 'Wind →' : '← Wind', W / 2, 98, 'rgba(255,255,255,0.7)', 'center');
      label(c, `${Math.round(Math.min(100, s / (LEN + 50) * 100))} % geschafft`, 16, 26, '#fff1e0');
      flashOverlay(c, flash, '40,10,30');
    }
  };
  return self;
}
