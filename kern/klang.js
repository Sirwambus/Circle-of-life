/* =====================================================================
   KLANG – generative, sphärische Musik mit Web Audio (keine Audiodateien).
   Bordun in D (Sägezähne und Sinus durch einen langsam atmenden Tiefpass),
   Glocken aus der pentatonischen Tonleiter (D F G A C) mit langem Hall, ein schimmernder Oberton.
   Browser erlauben Ton erst nach einer Nutzeraktion: Klang.toggle() aus einem Klick heraus aufrufen.
   ===================================================================== */
const Klang = (() => {
  let ac = null, master = null, bus = null, on = false, nextBell = 0, level = 1, chordAt = 0;
  const SCALE = [146.83, 174.61, 196.0, 220.0, 261.63, 293.66, 349.23, 392.0, 440.0, 523.25, 587.33];
  function impulse(sec) { // Hallfahne aus abklingendem Rauschen
    const len = ac.sampleRate * sec, buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    return buf;
  }
  function init() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    const verb = ac.createConvolver(); verb.buffer = impulse(5.5);
    const wet = ac.createGain(); wet.gain.value = 0.7; verb.connect(wet).connect(master);
    bus = ac.createGain(); bus.gain.value = 0.8; bus.connect(master); bus.connect(verb);
    // Bordun
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 6; lp.connect(bus);
    const lfo = ac.createOscillator(), lfoAmp = ac.createGain(); lfo.frequency.value = 0.045; lfoAmp.gain.value = 380; lfo.connect(lfoAmp).connect(lp.frequency); lfo.start();
    for (const [f, type, g] of [[73.42, 'sawtooth', 0.035], [73.7, 'sawtooth', 0.035], [110.0, 'triangle', 0.05], [146.83, 'sine', 0.05], [220.4, 'sine', 0.018]]) {
      const o = ac.createOscillator(), gg = ac.createGain(); o.type = type; o.frequency.value = f; gg.gain.value = g; o.connect(gg).connect(lp); o.start();
    }
    // Schimmer: hoher Sinus mit langsamem Tremolo
    const sh = ac.createOscillator(), shg = ac.createGain(), trem = ac.createOscillator(), tremAmp = ac.createGain();
    sh.frequency.value = 1174.7; sh.type = 'sine'; shg.gain.value = 0.006; trem.frequency.value = 0.13; tremAmp.gain.value = 0.006;
    trem.connect(tremAmp).connect(shg.gain); sh.connect(shg).connect(verb); sh.start(); trem.start();
    nextBell = ac.currentTime + 1;
  }
  function bell(time, f, vol = 0.07, dur = 4) {
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
    o.type = 'sine'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2.76; // unharmonischer Teilton wie bei einer Klangschale
    const g2 = ac.createGain(); g2.gain.value = 0.25;
    g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(vol, time + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g); o2.connect(g2).connect(g);
    if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; g.connect(pan).connect(bus); } else g.connect(bus);
    o.start(time); o2.start(time); o.stop(time + dur + 0.1); o2.stop(time + dur + 0.1);
  }
  return {
    get on() { return on; },
    toggle() {
      try {
        if (!ac) init();
        on = !on;
        if (on) ac.resume();
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.linearRampToValueAtTime(on ? 0.55 * level : 0, ac.currentTime + (on ? 3 : 0.8));
      } catch (e) { on = false; }
      return on;
    },
    // Lautstärke je nach Situation: 1 im Kreis, leiser in den Spielen, 0 bei Takt
    setLevel(x) { level = x; if (ac && on) { master.gain.cancelScheduledValues(ac.currentTime); master.gain.linearRampToValueAtTime(0.55 * x, ac.currentTime + 1.5); } },
    tick() {
      if (!ac || !on) return;
      while (nextBell < ac.currentTime + 0.4) {
        bell(nextBell, SCALE[Math.floor(Math.random() * SCALE.length)], 0.03 + Math.random() * 0.04, 3 + Math.random() * 3);
        nextBell += 0.7 + Math.random() * 2.6;
      }
    },
    // Akkord, wenn ein Level im Kreis aufleuchtet
    chord() { if (!ac || !on || ac.currentTime < chordAt) return; chordAt = ac.currentTime + 0.5; [0, 2, 4, 7].forEach((k, i) => bell(ac.currentTime + i * 0.12, SCALE[k + 2], 0.06, 5)); },
    // Einzelner Ton für Spiele (Farbfolge, Sternenpfad). Funktioniert auch bei ausgeschalteter Musik.
    tone(f, dur = 0.6) {
      try {
        if (!ac) { init(); ac.resume(); }
        const g = ac.createGain(), o = ac.createOscillator(), t = ac.currentTime;
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(ac.destination); if (on) g.connect(bus);
        o.start(t); o.stop(t + dur + 0.05);
      } catch (e) {}
    }
  };
})();
