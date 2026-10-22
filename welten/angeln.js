/* =====================================================================
   WELT – Angeln: Fang den goldenen Schlüsselfisch am Grund und bring ihn zum Steg.
   Normale Fische fressen den Köder, Quallen reißen die Schnur.
   ===================================================================== */
function makeAngeln(next, level = 0) {
  // Je Level: mehr und schnellere Quallen und Fische, der Schlüsselfisch schwimmt schneller.
  const NJ = [3, 5, 6, 7, 8, 8, 9, 9, 10, 10][level], FAST = [1, 1.25, 1.5, 1.65, 1.8, 1.9, 2, 2.1, 2.2, 2.3][level];
  const SURF = 72, R = rng(8);
  const boat = { x: 120 };
  let depth = 0, hooked = false, hasKey = false, retract = 0, t = 0, flash = 0, msg = '', msgT = 0;
  const fish = Array.from({ length: 7 }, (_, i) => ({ x: R() * W, y: 130 + i * 28 + R() * 10, sp: (40 + R() * 50) * FAST * (R() < 0.5 ? -1 : 1), col: ['#ff8c42', '#ffd166', '#ef476f'][i % 3] }));
  const jelly = Array.from({ length: NJ }, (_, i) => ({ x: 90 + (i * 460 / Math.max(1, NJ - 1)), y0: 170 + (i % 4) * 45, ph: R() * 6, sp: 18 * FAST * (i % 2 ? 1 : -1) }));
  const keyFish = { x: 300, y: 350, sp: 35 * FAST * FAST };
  const door = { x: 596, y: 6, w: 30, h: 50 };
  const say = m => { msg = m; msgT = 1.6; };
  const hook = () => ({ x: boat.x + 22, y: SURF + 8 + depth });
  const jellyPos = j => ({ x: j.x, y: j.y0 + Math.sin(t * 1.3 + j.ph) * 40 });
  const self = {
    done: false, door: () => door,
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt); msgT -= dt;
      for (const fi of fish) { fi.x += fi.sp * dt; if (fi.x < -30) fi.x = W + 30; if (fi.x > W + 30) fi.x = -30; }
      for (const j of jelly) { j.x += j.sp * dt; if (j.x < 30 || j.x > W - 30) j.sp *= -1; }
      if (!hooked) { keyFish.x += keyFish.sp * dt; if (keyFish.x < 40 || keyFish.x > W - 80) keyFish.sp *= -1; }
      const maxX = hasKey ? W - 40 : 540;
      boat.x = clamp(boat.x + ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 150 * dt, 10, maxX);
      if (retract > 0) { depth = Math.max(0, depth - 320 * dt); if (depth === 0) retract = 0; return; }
      if (keys.down) depth = Math.min(H - SURF - 30, depth + 120 * dt);
      if (keys.up) depth = Math.max(0, depth - 170 * dt);
      const h = hook();
      if (hooked) { keyFish.x = h.x - 10; keyFish.y = h.y + 10; if (depth <= 2) { hooked = false; hasKey = true; say('Schlüssel an Bord! Fahr zum Steg.'); } }
      for (const j of jelly) { const p = jellyPos(j); if (Math.hypot(p.x - h.x, p.y - h.y) < 20) { died(); flash = 0.4; say('Qualle! Die Schnur ist gerissen.'); if (hooked) { hooked = false; keyFish.y = 350; } retract = 1; return; } }
      if (!hooked && !hasKey) {
        for (const fi of fish) if (Math.abs(fi.x - h.x) < 16 && Math.abs(fi.y - h.y) < 10) { say('Ein Fisch hat den Köder gefressen.'); retract = 1; return; }
        if (Math.abs(keyFish.x + 10 - h.x) < 18 && Math.abs(keyFish.y - h.y) < 12) { hooked = true; say('Angebissen! Jetzt hochziehen.'); }
      }
      if (hasKey && boat.x + 50 > door.x) self.done = true;
    },
    draw(c) {
      const sky = c.createLinearGradient(0, 0, 0, SURF); sky.addColorStop(0, '#bfe9f2'); sky.addColorStop(1, '#f2f7e8');
      c.fillStyle = sky; c.fillRect(0, 0, W, SURF);
      const sea = c.createLinearGradient(0, SURF, 0, H); sea.addColorStop(0, '#1aa3a3'); sea.addColorStop(1, '#062c46');
      c.fillStyle = sea; c.fillRect(0, SURF, W, H - SURF);
      c.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 5; i++) { const x = i * 150 + Math.sin(t * 0.5 + i) * 30; c.beginPath(); c.moveTo(x, SURF); c.lineTo(x + 50, SURF); c.lineTo(x + 140, H); c.lineTo(x + 40, H); c.fill(); }
      c.strokeStyle = '#0f5b3a'; c.lineWidth = 5; c.lineCap = 'round';
      for (let x = 20; x < W; x += 47) { c.beginPath(); c.moveTo(x, H); c.quadraticCurveTo(x + Math.sin(t + x) * 12, H - 30, x + Math.sin(t * 1.3 + x) * 8, H - 55 - (x % 3) * 10); c.stroke(); }
      for (const fi of fish) {
        const d = Math.sign(fi.sp);
        c.fillStyle = fi.col; c.beginPath(); c.ellipse(fi.x, fi.y, 13, 7, 0, 0, 7); c.fill();
        c.beginPath(); c.moveTo(fi.x - d * 11, fi.y); c.lineTo(fi.x - d * 20, fi.y - 7); c.lineTo(fi.x - d * 20, fi.y + 7); c.fill();
        c.fillStyle = '#062c46'; c.beginPath(); c.arc(fi.x + d * 7, fi.y - 2, 1.6, 0, 7); c.fill();
      }
      for (const j of jelly) {
        const p = jellyPos(j);
        c.fillStyle = 'rgba(255,120,200,0.55)'; c.beginPath(); c.arc(p.x, p.y, 14, Math.PI, 0); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,160,220,0.7)'; c.lineWidth = 2;
        for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(p.x + k * 5, p.y); c.quadraticCurveTo(p.x + k * 5 + Math.sin(t * 4 + k) * 4, p.y + 12, p.x + k * 5, p.y + 24); c.stroke(); }
      }
      if (!hasKey) {
        const d = hooked ? 1 : Math.sign(keyFish.sp);
        c.save(); c.shadowColor = '#ffd84d'; c.shadowBlur = 14; c.fillStyle = '#ffcf33';
        c.beginPath(); c.ellipse(keyFish.x + 10, keyFish.y, 16, 9, hooked ? -1.2 : 0, 0, 7); c.fill(); c.restore();
        c.strokeStyle = '#8a5a00'; c.lineWidth = 2; c.beginPath(); c.arc(keyFish.x + 4, keyFish.y, 3, 0, 7); c.moveTo(keyFish.x + 7, keyFish.y); c.lineTo(keyFish.x + 18, keyFish.y); c.stroke();
        c.fillStyle = '#ffcf33'; c.beginPath(); c.moveTo(keyFish.x + 10 - d * 14, keyFish.y); c.lineTo(keyFish.x + 10 - d * 24, keyFish.y - 8); c.lineTo(keyFish.x + 10 - d * 24, keyFish.y + 8); c.fill();
      }
      // Steg und Tür
      c.fillStyle = '#7a5230'; c.fillRect(570, SURF - 16, 70, 10); c.fillRect(580, SURF - 6, 8, 40); c.fillRect(624, SURF - 6, 8, 40);
      paintDoor(c, door, { frame: '#4a2f18', panel: hasKey ? '#d08a4a' : '#8a5a34', knob: '#ffe08a', light: hasKey ? next : '#3a2a1a', open: hasKey ? clamp(1 - (door.x - boat.x - 50) / 120, 0, 1) : 0 });
      // Boot
      const bob = Math.sin(t * 2) * 2, h = hook();
      c.strokeStyle = '#e8e8e8'; c.lineWidth = 1; c.beginPath(); c.moveTo(boat.x + 22, SURF - 30 + bob); c.lineTo(h.x, h.y); c.stroke();
      c.strokeStyle = '#ddd'; c.lineWidth = 2; c.beginPath(); c.arc(h.x - 3, h.y, 4, 0, Math.PI); c.stroke();
      c.fillStyle = '#b5652b'; c.beginPath(); c.moveTo(boat.x - 20, SURF - 12 + bob); c.lineTo(boat.x + 40, SURF - 12 + bob); c.lineTo(boat.x + 30, SURF + 4 + bob); c.lineTo(boat.x - 12, SURF + 4 + bob); c.fill();
      c.fillStyle = '#ffd166'; c.beginPath(); c.arc(boat.x + 4, SURF - 24 + bob, 7, 0, 7); c.fill();
      c.fillStyle = '#2a6f97'; c.fillRect(boat.x - 2, SURF - 18 + bob, 12, 8);
      c.strokeStyle = '#5a3a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(boat.x + 8, SURF - 16 + bob); c.lineTo(boat.x + 22, SURF - 30 + bob); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(0, SURF - 1, W, 2);
      label(c, msgT > 0 ? msg : hasKey ? 'Fahr nach rechts zum Steg' : '↓ Haken senken · ↑ einholen · ← → Boot', 12, H - 14, '#e6fbff');
      flashOverlay(c, flash);
    }
  };
  return self;
}
