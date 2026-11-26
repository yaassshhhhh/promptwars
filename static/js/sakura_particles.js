/**
 * Comprehensive Japanese Zen 3D Sakura & Wind Particle Engine
 * Features:
 * - Multi-layer depth of field (Foreground blurred, Midground crisp, Background micro-petals)
 * - 3D physics: pitch, yaw, roll, air resistance, turbulence, and gravity
 * - Interactive wind physics: cursor tracking creates breeze
 * - Click-to-spawn cherry blossom flurry
 * - Web Audio API synthesized Japanese Zen Temple Bell & Glass Wind Chime (風鈴)
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

  // Global breeze cycle (sinusoidal wind shifting direction like spring breeze)
  let windTime = 0;
  let globalWindX = 0.8;

  // Mouse wind tracker
  let mouse = { x: -1000, y: -1000, vx: 0, vy: 0, lastX: 0, lastY: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.vx = (e.clientX - mouse.lastX) * 0.2;
    mouse.vy = (e.clientY - mouse.lastY) * 0.2;
    mouse.lastX = e.clientX;
    mouse.lastY = e.clientY;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Click to burst a flurry of Sakura blossoms
  window.addEventListener('click', (e) => {
    // Spawn 16 fresh flurry petals bursting from cursor
    for (let i = 0; i < 16; i++) {
      if (petals.length < 130) {
        const p = new SakuraPetal(true);
        p.x = e.clientX + (Math.random() - 0.5) * 30;
        p.y = e.clientY + (Math.random() - 0.5) * 30;
        p.vx = (Math.random() - 0.5) * 6 + globalWindX * 2;
        p.vy = (Math.random() - 0.8) * 5;
        p.isFlurry = true;
        petals.push(p);
      }
    }
  });

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // 3D Sakura Petal Class with 3 Depth Layers
  class SakuraPetal {
    constructor(isFlurry = false) {
      this.isFlurry = isFlurry;
      this.reset(!isFlurry);
    }

    reset(initial = false) {
      this.x = initial ? Math.random() * width : Math.random() * (width + 300) - 200;
      this.y = initial ? Math.random() * height : -30 - Math.random() * 50;
      
      // Depth Layers:
      // 0.3 - 0.6: Background distant small petals
      // 0.6 - 1.1: Midground standard crisp petals
      // 1.1 - 1.6: Foreground large sweeping petals
      const layerRoll = Math.random();
      if (layerRoll < 0.25) {
        this.depth = Math.random() * 0.3 + 0.35; // Background
        this.blur = 0;
      } else if (layerRoll < 0.85) {
        this.depth = Math.random() * 0.5 + 0.65; // Midground
        this.blur = 0;
      } else {
        this.depth = Math.random() * 0.5 + 1.15; // Foreground
        this.blur = 1.2;
      }

      this.size = (Math.random() * 8 + 9) * this.depth;
      
      // Horizontal drift & vertical fall
      this.vx = (Math.random() * 0.8 + 0.5) * this.depth;
      this.vy = (Math.random() * 1.2 + 0.9) * this.depth;
      
      // 3D Tumbling Euler angles & angular velocities
      this.pitch = Math.random() * Math.PI * 2;
      this.yaw = Math.random() * Math.PI * 2;
      this.roll = Math.random() * Math.PI * 2;
      
      this.dPitch = (Math.random() * 0.035 + 0.015) * (Math.random() < 0.5 ? 1 : -1);
      this.dYaw = (Math.random() * 0.04 + 0.015) * (Math.random() < 0.5 ? 1 : -1);
      this.dRoll = Math.random() * 0.02 + 0.008;
      
      // Sakura color palette: pale blush pink, pure blossom white, vermilion-tinged tips
      const colorChoice = Math.random();
      if (colorChoice < 0.5) {
        // Soft cherry blossom pink (桜色)
        this.color = '#fbcfe8';
        this.edgeColor = '#f472b6';
      } else if (colorChoice < 0.8) {
        // Pure white-pink blossom
        this.color = '#fff1f2';
        this.edgeColor = '#fda4af';
      } else {
        // Traditional vermilion-tinted sakura
        this.color = '#fecdd3';
        this.edgeColor = '#fb7185';
      }

      this.opacity = Math.random() * 0.35 + (this.depth > 1 ? 0.45 : 0.65);
    }

    update() {
      // Advance 3D rotations
      this.pitch += this.dPitch;
      this.yaw += this.dYaw;
      this.roll += this.dRoll;

      // Natural sinusoidal wind wave
      const wave = Math.sin(this.pitch) * (1.2 * this.depth);
      this.x += this.vx + globalWindX * this.depth + wave;
      this.y += this.vy;

      // Mouse interactive breeze
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180) {
        const force = (1 - dist / 180) * 4.5;
        this.x += mouse.vx * force + (dx / (dist || 1)) * force * 2.5;
        this.y += mouse.vy * force + (dy / (dist || 1)) * force * 1.5;
      }

      // Despawn flurry or loop standard petals
      if (this.y > height + 40 || this.x < -150 || this.x > width + 200) {
        if (this.isFlurry) {
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
      
      // 3D perspective distortion (simulate tumbling in air current)
      const scaleX = Math.cos(this.yaw);
      const scaleY = Math.sin(this.pitch);
      ctx.scale(scaleX, scaleY);

      if (this.blur > 0) {
        ctx.filter = `blur(${this.blur}px)`;
      }

      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity * Math.abs(scaleX * scaleY * 0.45 + 0.55);

      // Organic Japanese Sakura Petal Geometry
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      // Left curve
      ctx.bezierCurveTo(this.size * 0.85, -this.size * 0.8, this.size * 0.95, this.size * 0.4, 0, this.size);
      // Right curve
      ctx.bezierCurveTo(-this.size * 0.95, this.size * 0.4, -this.size * 0.85, -this.size * 0.8, 0, -this.size);
      
      // Authentic cleft notch at the petal tip (桜の花びら特有の切れ込み)
      ctx.lineTo(0, -this.size * 0.82);
      ctx.closePath();
      ctx.fill();

      // Subtle delicate petal center vein
      ctx.strokeStyle = this.edgeColor;
      ctx.lineWidth = 0.7;
      ctx.globalAlpha = this.opacity * 0.4;
      ctx.beginPath();
      ctx.moveTo(0, this.size * 0.8);
      ctx.lineTo(0, -this.size * 0.55);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Floating Shrine Kodama Spirit Orbs (Gold and Vermilion)
  class SpiritOrb {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 20;
      this.size = Math.random() * 2.8 + 1.2;
      this.vy = -(Math.random() * 0.5 + 0.25);
      this.vx = (Math.random() - 0.5) * 0.3;
      this.phase = Math.random() * Math.PI * 2;
      this.pulseSpeed = Math.random() * 0.025 + 0.01;
      this.isGold = Math.random() > 0.35;
    }

    update() {
      this.phase += this.pulseSpeed;
      this.y += this.vy;
      this.x += this.vx + Math.sin(this.phase) * 0.4;
      if (this.y < -30) this.reset();
    }

    draw() {
      ctx.save();
      const alpha = (Math.sin(this.phase) * 0.3 + 0.7) * 0.65;
      ctx.globalAlpha = Math.max(0, alpha);
      
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3.5);
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
      ctx.arc(this.x, this.y, this.size * 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Particle Pools (Generous density for true full Japanese Sakura atmosphere)
  const baseCount = Math.max(45, Math.min(85, Math.floor(window.innerWidth / 18)));
  const petals = Array.from({ length: baseCount }, () => new SakuraPetal());
  const orbs = Array.from({ length: 24 }, () => new SpiritOrb());

  // Master Animation Loop
  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Global wind oscillation
    windTime += 0.008;
    globalWindX = Math.sin(windTime) * 0.7 + 0.6; // Gentle rightward breeze

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

  // Web Audio API Synthesizer: Japanese Zen Temple Bell & Glass Wind Chime (風鈴)
  window.playZenWindChime = function () {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const actx = new AudioContext();

      // Pentatonic Japanese Insen / Hirajōshi Scale Frequencies:
      // A5 (880Hz), C6 (1046.5Hz), D6 (1174.66Hz), F6 (1396.91Hz), A6 (1760Hz)
      const notes = [880, 1046.5, 1174.66, 1396.91, 1760, 2093];
      const selectedNote = notes[Math.floor(Math.random() * notes.length)];

      const osc = actx.createOscillator();
      const gain = actx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(selectedNote, actx.currentTime);
      // Harmonic shimmer
      osc.frequency.exponentialRampToValueAtTime(selectedNote * 1.002, actx.currentTime + 1.2);

      // Delicate glass bell envelope
      gain.gain.setValueAtTime(0.001, actx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, actx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 2.2);

      osc.connect(gain);
      gain.connect(actx.destination);

      osc.start();
      osc.stop(actx.currentTime + 2.3);

      // Play a soft harmonic overtone
      const osc2 = actx.createOscillator();
      const gain2 = actx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(selectedNote * 2.76, actx.currentTime);
      gain2.gain.setValueAtTime(0.001, actx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.06, actx.currentTime + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 1.5);

      osc2.connect(gain2);
      gain2.connect(actx.destination);
      osc2.start();
      osc2.stop(actx.currentTime + 1.6);
    } catch (e) {
      console.warn("Audio chime unsupported:", e);
    }
  };
})();
