/* =====================================================================
   WELT – Takt: Rhythmusspiel. Drück die Pfeile genau dann, wenn die Noten die Linie erreichen.
   Mit Ton (Web Audio), startet beim ersten Tastendruck.
   ===================================================================== */
let tueraudio = null;
function beep(freq, dur = 0.12, type = 'square', vol = 0.06) {
  try {
    tueraudio = tueraudio || new (window.AudioContext || window.webkitAudioContext)();
    const o = tueraudio.createOscillator(), g = tueraudio.createGain(), now = tueraudio.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, now);
    if (type === 'sine') o.frequency.exponentialRampToValueAtTime(40, now + dur);
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g).connect(tueraudio.destination); o.start(now); o.stop(now + dur);
  } catch (e) {}
}
function makeTakt(next, level = 0) {
  // Je Level: schnelleres Tempo, mehr halbe Schläge, längerer Song, etwas mehr Treffer nötig.
  const BPM = [112, 124, 136, 146, 154, 160, 166, 172, 178, 184][level], BEAT = 60 / BPM, TRAVEL = [1.6, 1.45, 1.3, 1.2, 1.12, 1.06, 1, 0.96, 0.92, 0.88][level], WIN = 0.13, LANES = ['left', 'down', 'up', 'right'];
  const LCOL = ['#ff3fd2', '#00e5ff', '#ffe14d', '#7cff6b'], NOTEF = [262, 330, 392, 523];
  const R = rng(112 + level);
  const notes = [];
  for (let b = 4; b < [36, 44, 52, 60, 68, 72, 76, 80, 84, 88][level]; b += (R() < [0.25, 0.4, 0.5, 0.55, 0.6, 0.62, 0.64, 0.66, 0.68, 0.7][level] ? 0.5 : 1)) if (R() < 0.85) notes.push({ t: b * BEAT, lane: Math.floor(R() * 4), state: 0 });
  const NEED = Math.ceil(notes.length * [0.7, 0.72, 0.75, 0.77, 0.8, 0.8, 0.82, 0.82, 0.84, 0.85][level]);
  const END = notes[notes.length - 1].t + 1;
  let started = false, song = 0, beatN = -1, hits = 0, fb = '', fbT = 0, result = '', resT = 0, t = 0;
  const laneX = (lane, u) => { const near = 200 + lane * 80 + 40, far = W / 2 + (lane - 1.5) * 22; return near + (far - near) * u; };
  const laneY = u => 340 - 210 * (1 - Math.pow(1 - u, 1.6)) * 1;
  function restart() { started = false; song = 0; beatN = -1; hits = 0; result = ''; notes.forEach(n => n.state = 0); }
  const self = {
    done: false,
    door: () => ({ x: W / 2 - 20, y: 84, w: 40, h: 60 }),
    update(dt) {
      t += dt; fbT -= dt;
      if (result) { resT += dt; if (result === 'win' && resT > 1.6) self.done = true; if (result === 'fail' && resT > 0.8 && (pressed.action || dirOf(pressed))) restart(); return; }
      if (!started) { if (dirOf(pressed) || pressed.action) { started = true; song = -BEAT * 4; } return; } // vier Schläge Vorlauf
      song += dt;
      const bn = Math.floor(song / BEAT);
      if (bn !== beatN) { beatN = bn; if (song < END) beep(bn % 4 === 0 ? 120 : 90, 0.15, 'sine', 0.25); }
      LANES.forEach((k, lane) => {
        if (!pressed[k]) return;
        let best = null;
        for (const n of notes) if (n.lane === lane && n.state === 0 && Math.abs(n.t - song) < WIN && (!best || Math.abs(n.t - song) < Math.abs(best.t - song))) best = n;
        if (best) { best.state = 1; hits++; beep(NOTEF[lane], 0.12); fb = Math.abs(best.t - song) < 0.05 ? 'PERFEKT' : 'GUT'; fbT = 0.4; }
        else { fb = 'DANEBEN'; fbT = 0.4; }
      });
      for (const n of notes) if (n.state === 0 && song - n.t > WIN) { n.state = 2; fb = 'VERPASST'; fbT = 0.4; }
      if (song > END) { result = hits >= NEED ? 'win' : 'fail'; resT = 0; if (result === 'fail') died(); }
    },
    draw(c) {
      const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#14002b'); bg.addColorStop(0.5, '#3a0057'); bg.addColorStop(1, '#14002b');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      const sunG = c.createLinearGradient(0, 30, 0, 130); sunG.addColorStop(0, '#ffb347'); sunG.addColorStop(1, '#ff3fd2');
      c.fillStyle = sunG; c.beginPath(); c.arc(W / 2, 130, 80, Math.PI, 0); c.fill();
      c.fillStyle = '#3a0057'; for (let i = 0; i < 6; i++) c.fillRect(W / 2 - 90, 72 + i * 10, 180, 2 + i * 0.8);
      c.fillStyle = '#1a0033'; c.fillRect(0, 130, W, H - 130);
      c.strokeStyle = 'rgba(255,63,210,0.35)'; c.lineWidth = 1;
      for (let i = -10; i <= 10; i++) { c.beginPath(); c.moveTo(W / 2 + i * 8, 130); c.lineTo(W / 2 + i * 70, H); c.stroke(); }
      const ph = song > 0 ? (song / BEAT) % 1 : (t % 1);
      for (let k = 0; k < 8; k++) { const u = ((k + ph) / 8), y = 130 + Math.pow(u, 2.2) * (H - 130); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      const won = result === 'win' ? clamp(resT / 1, 0, 1) : 0;
      paintDoor(c, self.door(), { frame: '#ff3fd2', panel: '#2a0045', knob: '#00e5ff', light: won > 0 ? next : '#14002b', glow: '#ff3fd2', open: won });
      for (let lane = 0; lane < 4; lane++) {
        c.strokeStyle = LCOL[lane]; c.globalAlpha = 0.35; c.lineWidth = 2;
        c.beginPath(); c.moveTo(laneX(lane, 1), laneY(1)); c.lineTo(laneX(lane, 0), 360); c.stroke(); c.globalAlpha = 1;
        const lit = keys[LANES[lane]];
        c.save(); c.shadowColor = LCOL[lane]; c.shadowBlur = lit ? 20 : 6; c.strokeStyle = LCOL[lane]; c.lineWidth = lit ? 4 : 2;
        c.beginPath(); c.arc(laneX(lane, 0), 340, 20, 0, 7); c.stroke(); c.restore();
        label(c, ['←', '↓', '↑', '→'][lane], laneX(lane, 0), 346, LCOL[lane], 'center', 16);
      }
      if (started) for (const n of notes) {
        if (n.state === 1) continue;
        const u = (n.t - song) / TRAVEL;
        if (u > 1 || u < -0.15) continue;
        const uu = Math.max(0, u), x = laneX(n.lane, uu), y = laneY(uu), s = 18 * (1 - uu * 0.75);
        c.save(); c.globalAlpha = n.state === 2 ? 0.25 : 1; c.shadowColor = LCOL[n.lane]; c.shadowBlur = 12; c.fillStyle = LCOL[n.lane];
        c.beginPath(); c.arc(x, y, s, 0, 7); c.fill(); c.restore();
      }
      if (fbT > 0) label(c, fb, W / 2, 300, fb === 'PERFEKT' ? '#7cff6b' : fb === 'GUT' ? '#00e5ff' : '#ff6b8a', 'center', 16);
      label(c, `Treffer ${hits} / ${NEED} nötig`, 14, 24, '#ffd6f5');
      if (!started && !result) label(c, 'Drück eine Pfeiltaste, dann startet der Song', W / 2, 250, '#ffd6f5', 'center');
      else if (started && song < 0) label(c, String(Math.ceil(-song / BEAT)), W / 2, 250, '#ffd6f5', 'center', 28);
      if (result === 'fail') label(c, 'Zu wenige Treffer. Taste drücken für einen neuen Versuch.', W / 2, 250, '#ff6b8a', 'center');
    }
  };
  return self;
}
