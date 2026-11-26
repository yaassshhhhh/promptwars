/**
 * ============================================================================
 * 🌸 SAKURA FUBUKI • 3D BLIZZARD & PROCEDURAL ZEN AMBIENCE ENGINE ⛩️
 * ============================================================================
 * Features:
 * - 3D Multi-Depth Cherry Blossom Storm (Foreground blurred, Midground crisp, Background motes)
 * - Mouse Wind Ribbon (trail of glittering stardust & petal flurry)
 * - Click-to-spawn Petal Swirl with organic dispersion
 * - Pure Procedural Web Audio API Japanese Zen Soundscape:
 *   * Sacred Temple Singing Bowl / Bonshō Bell (108Hz resonant drone)
 *   * Crystalline Glass Wind Chime (風鈴 Fūrin) pentatonic harmonies
 *   * Bamboo Water Fountain (鹿おどし Shishi-odoshi) wooden percussive knock
 * ============================================================================
 */

(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'sakura3DCanvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '2';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  let windTime = 0;
  let globalWindX = 0.9;
  let globalWindY = 0.4;

  // Mouse tracking with speed ribbon
  let mouse = { x: -1000, y: -1000, vx: 0, vy: 0, lastX: 0, lastY: 0, speed: 0 };
  const mouseTrail = [];

  window.addEventListener('mousemove', (e) => {
    const dx = e.clientX - mouse.lastX;
    const dy = e.clientY - mouse.lastY;
    mouse.speed = Math.sqrt(dx * dx + dy * dy);
    mouse.vx = dx * 0.22;
    mouse.vy = dy * 0.22;
    mouse.lastX = e.clientX;
    mouse.lastY = e.clientY;
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    // Add glowing spark trail when moving mouse
    if (mouse.speed > 8) {
      for (let i = 0; i < 2; i++) {
        mouseTrail.push({
          x: e.clientX + (Math.random() - 0.5) * 12,
          y: e.clientY + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * -1.5 - 0.5,
          alpha: 0.9,
          size: Math.random() * 3 + 2,
          color: Math.random() > 0.4 ? '#fbcfe8' : '#fbbf24'
        });
      }
    }
  });

  // Click burst: releases a whirlwind of 20 fluttering sakura petals
  window.addEventListener('click', (e) => {
    for (let i = 0; i < 18; i++) {
      if (petals.length < 140) {
        const p = new SakuraPetal(true);
        p.x = e.clientX + (Math.random() - 0.5) * 24;
        p.y = e.clientY + (Math.random() - 0.5) * 24;
        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * 5 + 3;
        p.vx = Math.cos(angle) * force + globalWindX * 2;
        p.vy = Math.sin(angle) * force - 1;
        p.isBurst = true;
        petals.push(p);
      }
    }
    // Play subtle soft chime tap
    if (window.playSoftZenChime) window.playSoftZenChime();
  });

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // 3D Sakura Petal Class with 3 Realistic Depth Layers
  class SakuraPetal {
    constructor(isBurst = false) {
      this.isBurst = isBurst;
      this.reset(!isBurst);
    }

    reset(initial = false) {
      this.x = initial ? Math.random() * width : Math.random() * (width + 400) - 250;
      this.y = initial ? Math.random() * height : -35 - Math.random() * 60;
      
      // Depth of Field:
      // 0.35 - 0.65: Far background
      // 0.65 - 1.15: Midground sharp focus
      // 1.15 - 1.70: Foreground cinematic close-up
      const layer = Math.random();
      if (layer < 0.25) {
        this.depth = Math.random() * 0.3 + 0.35;
        this.blur = 0;
      } else if (layer < 0.85) {
        this.depth = Math.random() * 0.5 + 0.65;
        this.blur = 0;
      } else {
        this.depth = Math.random() * 0.55 + 1.15;
        this.blur = 1.4;
      }

      this.size = (Math.random() * 8 + 9.5) * this.depth;
      this.vx = (Math.random() * 0.9 + 0.6) * this.depth;
      this.vy = (Math.random() * 1.3 + 0.95) * this.depth;
      
      // 3D Euler angles
      this.pitch = Math.random() * Math.PI * 2;
      this.yaw = Math.random() * Math.PI * 2;
      this.roll = Math.random() * Math.PI * 2;
      
      this.dPitch = (Math.random() * 0.04 + 0.015) * (Math.random() < 0.5 ? 1 : -1);
      this.dYaw = (Math.random() * 0.045 + 0.015) * (Math.random() < 0.5 ? 1 : -1);
      this.dRoll = Math.random() * 0.025 + 0.01;
      
      // Authentic Japanese Cherry Blossom color tones
      const r = Math.random();
      if (r < 0.55) {
        this.color = '#fce7f3'; // Soft cherry silk (薄桜)
        this.edgeColor = '#f472b6';
      } else if (r < 0.85) {
        this.color = '#fff1f2'; // Pristine snow blossom (白桜)
        this.edgeColor = '#fda4af';
      } else {
        this.color = '#fecdd3'; // Crimson-tinged blossom (紅桜)
        this.edgeColor = '#fb7185';
      }

      this.opacity = Math.random() * 0.35 + (this.depth > 1 ? 0.5 : 0.72);
    }

    update() {
      this.pitch += this.dPitch;
      this.yaw += this.dYaw;
      this.roll += this.dRoll;

      // Natural wind oscillation
      const sway = Math.sin(this.pitch) * (1.3 * this.depth);
      this.x += this.vx + globalWindX * this.depth + sway;
      this.y += this.vy + globalWindY;

      // Mouse interactive wind displacement
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 190) {
        const force = (1 - dist / 190) * 4.8;
        this.x += mouse.vx * force + (dx / (dist || 1)) * force * 2.8;
        this.y += mouse.vy * force + (dy / (dist || 1)) * force * 1.6;
      }

      // Loop around screen
      if (this.y > height + 50 || this.x < -180 || this.x > width + 220) {
        if (this.isBurst) {
          const idx = petals.indexOf(this);
          if (idx !== -1) petals.splice(idx, 1);
        } else {
          this.reset();
        }
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.roll);
      
      const scaleX = Math.cos(this.yaw);
      const scaleY = Math.sin(this.pitch);
      ctx.scale(scaleX, scaleY);

      if (this.blur > 0) ctx.filter = `blur(${this.blur}px)`;

      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity * Math.abs(scaleX * scaleY * 0.45 + 0.55);

      // Organic Japanese Cherry Blossom Petal Path
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(this.size * 0.88, -this.size * 0.82, this.size * 0.98, this.size * 0.42, 0, this.size);
      ctx.bezierCurveTo(-this.size * 0.98, this.size * 0.42, -this.size * 0.88, -this.size * 0.82, 0, -this.size);
      
      // Authentic cleft notch at the petal tip (桜特有の切れ込み)
      ctx.lineTo(0, -this.size * 0.84);
      ctx.closePath();
      ctx.fill();

      // Delicate center vein
      ctx.strokeStyle = this.edgeColor;
      ctx.lineWidth = 0.75;
      ctx.globalAlpha = this.opacity * 0.45;
      ctx.beginPath();
      ctx.moveTo(0, this.size * 0.82);
      ctx.lineTo(0, -this.size * 0.58);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Floating Shrine Kodama Spirit Orbs (Gold & Sacred Vermilion)
  class SpiritOrb {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 25;
      this.size = Math.random() * 3 + 1.2;
      this.vy = -(Math.random() * 0.65 + 0.3);
      this.vx = (Math.random() - 0.5) * 0.35;
      this.phase = Math.random() * Math.PI * 2;
      this.pulseSpeed = Math.random() * 0.03 + 0.012;
      this.isGold = Math.random() > 0.4;
    }
    update() {
      this.phase += this.pulseSpeed;
      this.y += this.vy;
      this.x += this.vx + Math.sin(this.phase) * 0.45;
      if (this.y < -35) this.reset();
    }
    draw() {
      ctx.save();
      const alpha = (Math.sin(this.phase) * 0.35 + 0.65) * 0.7;
      ctx.globalAlpha = Math.max(0, alpha);
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3.8);
      if (this.isGold) {
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.35, '#f59e0b');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else {
        grad.addColorStop(0, '#fecdd3');
        grad.addColorStop(0.35, '#e11d48');
        grad.addColorStop(1, 'rgba(225, 29, 72, 0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Particle Pools (Substantial density for true cinematic Japanese immersion)
  const baseCount = Math.max(55, Math.min(95, Math.floor(window.innerWidth / 16)));
  const petals = Array.from({ length: baseCount }, () => new SakuraPetal());
  const orbs = Array.from({ length: 28 }, () => new SpiritOrb());

  // Animation Loop
  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Global wind shifting like spring breeze
    windTime += 0.007;
    globalWindX = Math.sin(windTime) * 0.75 + 0.75;

    // Draw mouse spark trail
    for (let i = mouseTrail.length - 1; i >= 0; i--) {
      const sp = mouseTrail[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.alpha -= 0.025;
      if (sp.alpha <= 0) {
        mouseTrail.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw spirit orbs
    for (let i = 0; i < orbs.length; i++) {
      orbs[i].update();
      orbs[i].draw();
    }

    // Draw 3D Sakura Petals
    for (let i = 0; i < petals.length; i++) {
      petals[i].update();
      petals[i].draw();
    }

    requestAnimationFrame(animate);
  }

  animate();

  // ==========================================================================
  // 🎶 PROCEDURAL WEB AUDIO API JAPANESE ZEN SOUNDSCAPE (雅楽)
  // ==========================================================================
  let zenAudioContext = null;
  let isZenAmbienceActive = false;
  let ambientDroneGain = null;
  let bambooTimer = null;

  function getAudioCtx() {
    if (!zenAudioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      zenAudioContext = new AudioCtx();
    }
    if (zenAudioContext.state === 'suspended') {
      zenAudioContext.resume();
    }
    return zenAudioContext;
  }

  // Soft wooden click / gentle chime for UI clicks
  window.playSoftZenChime = function () {
    try {
      const actx = getAudioCtx();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      const notes = [1046.5, 1174.66, 1396.91, 1567.98, 1760];
      const note = notes[Math.floor(Math.random() * notes.length)];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, actx.currentTime);
      gain.gain.setValueAtTime(0.001, actx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, actx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.85);
    } catch (e) {}
  };

  // Grand Wind Chime (風鈴 Fūrin)
  window.playZenWindChime = function () {
    try {
      const actx = getAudioCtx();
      const pentatonic = [880, 1046.5, 1174.66, 1396.91, 1760, 2093];
      const selected = pentatonic[Math.floor(Math.random() * pentatonic.length)];

      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(selected, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(selected * 1.003, actx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.001, actx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, actx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 2.6);

      // Harmonic chime overtone
      const osc2 = actx.createOscillator();
      const gain2 = actx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(selected * 2.76, actx.currentTime);
      gain2.gain.setValueAtTime(0.001, actx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.06, actx.currentTime + 0.018);
      gain2.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 1.6);
      osc2.connect(gain2);
      gain2.connect(actx.destination);
      osc2.start();
      osc2.stop(actx.currentTime + 1.7);
    } catch (e) {}
  };

  // Shishi-odoshi (Bamboo Water Fountain Knock)
  function playBambooKnock() {
    try {
      const actx = getAudioCtx();
      // Low wooden "thock" sound
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, actx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.26);

      // Secondary hollow echo
      const osc2 = actx.createOscillator();
      const gain2 = actx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(280, actx.currentTime + 0.02);
      osc2.frequency.exponentialRampToValueAtTime(110, actx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.09, actx.currentTime + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.2);
      osc2.connect(gain2);
      gain2.connect(actx.destination);
      osc2.start(actx.currentTime + 0.02);
      osc2.stop(actx.currentTime + 0.22);
    } catch (e) {}
  }

  // Toggle Continuous Ambient Zen Shrine Soundscape (雅楽)
  window.toggleZenAmbience = function () {
    const actx = getAudioCtx();
    const btn = document.getElementById('zenAmbienceToggleBtn');

    if (isZenAmbienceActive) {
      // Turn OFF
      if (ambientDroneGain) {
        ambientDroneGain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.8);
      }
      if (bambooTimer) clearInterval(bambooTimer);
      isZenAmbienceActive = false;
      if (btn) {
        btn.innerHTML = `<i data-lucide="volume-x" class="w-4 h-4 text-slate-400"></i><span class="text-xs font-kanji font-bold">雅楽: 停止 (Off)</span>`;
        btn.classList.remove('border-rose-500', 'bg-rose-950/60');
      }
    } else {
      // Turn ON
      isZenAmbienceActive = true;
      if (btn) {
        btn.innerHTML = `<i data-lucide="volume-2" class="w-4 h-4 text-rose-400 animate-pulse"></i><span class="text-xs font-kanji font-bold text-rose-200">雅楽: 再生中 (Zen On)</span>`;
        btn.classList.add('border-rose-500', 'bg-rose-950/60');
      }

      // Sacred Temple Singing Bowl Drone (108 Hz Sacred Om / Hirajōshi harmonic)
      const droneOsc = actx.createOscillator();
      const droneOsc2 = actx.createOscillator();
      ambientDroneGain = actx.createGain();

      droneOsc.type = 'sine';
      droneOsc.frequency.setValueAtTime(108, actx.currentTime); // 108 Sacred temple bell harmonic
      droneOsc2.type = 'triangle';
      droneOsc2.frequency.setValueAtTime(216, actx.currentTime);

      ambientDroneGain.gain.setValueAtTime(0.001, actx.currentTime);
      ambientDroneGain.gain.linearRampToValueAtTime(0.045, actx.currentTime + 2.5);

      droneOsc.connect(ambientDroneGain);
      droneOsc2.connect(ambientDroneGain);
      ambientDroneGain.connect(actx.destination);

      droneOsc.start();
      droneOsc2.start();

      // Trigger bamboo knock & periodic chime every 10-14 seconds
      bambooTimer = setInterval(() => {
        if (!isZenAmbienceActive) return;
        playBambooKnock();
        setTimeout(() => {
          if (isZenAmbienceActive && Math.random() > 0.4) {
            window.playZenWindChime();
          }
        }, 1200);
      }, 11000);

      // Play immediate welcoming chime
      window.playZenWindChime();
    }

    if (window.lucide) lucide.createIcons();
  };
})();
