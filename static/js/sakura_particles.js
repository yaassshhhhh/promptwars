/**
 * ============================================================================
 * 🌸 SAKURA FUBUKI • 3D BLIZZARD & PROCEDURAL ZEN AMBIENCE ENGINE ⛩️
 * ============================================================================
 * Features:
 * - 3D Multi-Depth Cherry Blossom Storm (Foreground blurred, Midground crisp, Background motes)
 * - ✨ Japanese Shrine Glitter & Kinpaku Gold Leaf Flakes (金箔・神社の星神光 ✦)
 * - Mouse Wind Ribbon (trail of glittering stardust & golden shrine sparkles)
 * - Click-to-spawn Petal Swirl & Sacred Golden Glitter Burst
 * - Authentic Japanese Theme Music Suite (Zero synthetic beep noise):
 *   * Spiral Theme (螺旋 Rasen / Stardust Spiral)
 *   * Sacred Spiritual Zen (霊性 Traditional Koto & Shakuhachi Bamboo Flute)
 *   * Uzumaki Spiral Atmosphere (うずまき Ambient Melody)
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

    // 3D Parallax coordinates for living backdrop & layers
    const normX = ((e.clientX / (width || window.innerWidth)) - 0.5) * 2;
    const normY = ((e.clientY / (height || window.innerHeight)) - 0.5) * 2;
    document.documentElement.style.setProperty('--mouse-norm-x', normX.toFixed(3));
    document.documentElement.style.setProperty('--mouse-norm-y', normY.toFixed(3));

    // Add glowing Japanese shrine glitter & gold spark trail when moving mouse
    if (mouse.speed > 5) {
      for (let i = 0; i < 2; i++) {
        const isStar = Math.random() > 0.4;
        mouseTrail.push({
          x: e.clientX + (Math.random() - 0.5) * 16,
          y: e.clientY + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 2.2,
          vy: Math.random() * -1.8 - 0.4,
          alpha: 1.0,
          size: isStar ? (Math.random() * 4.5 + 2.5) : (Math.random() * 2.8 + 1.2),
          isGlitterStar: isStar,
          rot: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.08,
          color: Math.random() > 0.35 ? '#fbbf24' : (Math.random() > 0.5 ? '#fef08a' : '#fbcfe8')
        });
      }
    }
  });

  // Click burst: releases a whirlwind of 18 fluttering sakura petals + burst of sacred golden shrine glitter & Kinpaku gold leaf
  window.addEventListener('click', (e) => {
    // Sakura petals burst
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

    // Kinpaku gold leaf burst
    for (let i = 0; i < 16; i++) {
      if (kinpakuFlakes.length < 75) {
        const k = new KinpakuFlake(true);
        k.x = e.clientX + (Math.random() - 0.5) * 20;
        k.y = e.clientY + (Math.random() - 0.5) * 20;
        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * 4.5 + 2;
        k.vx = Math.cos(angle) * force;
        k.vy = Math.sin(angle) * force - 1.2;
        kinpakuFlakes.push(k);
      }
    }

    // Golden shrine glitter sparkle burst
    for (let i = 0; i < 12; i++) {
      mouseTrail.push({
        x: e.clientX + (Math.random() - 0.5) * 16,
        y: e.clientY + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 4.5,
        vy: (Math.random() - 0.5) * 4.5 - 1.5,
        alpha: 1.0,
        size: Math.random() * 6 + 3,
        isGlitterStar: true,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.12,
        color: Math.random() > 0.4 ? '#fef08a' : '#fbbf24'
      });
    }
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

  // ==========================================================================
  // ✨ JAPANESE SHRINE GLITTER & KINPAKU GOLD LEAF ENGINE (金箔・神社の星神光) ⛩️
  // ==========================================================================

  // 1. Radiant 4-Point & Diamond Shrine Glitter Star (✦)
  class ShrineGlitterSparkle {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + Math.random() * 35;
      this.size = Math.random() * 3.8 + 2.0;
      this.vx = (Math.random() - 0.48) * 0.35;
      this.vy = -(Math.random() * 0.6 + 0.25); // Sacred ascending motion like shrine incense
      this.phase = Math.random() * Math.PI * 2;
      this.twinkleSpeed = Math.random() * 0.045 + 0.02;
      this.rotation = Math.random() * Math.PI;
      this.rotSpeed = (Math.random() - 0.5) * 0.015;
      this.depth = Math.random() * 0.55 + 0.75;
      const r = Math.random();
      if (r < 0.65) {
        this.colorCore = '#ffffff';
        this.colorGlow = '#fbbf24'; // Radiant shrine gold
      } else if (r < 0.88) {
        this.colorCore = '#fffdf0';
        this.colorGlow = '#fef08a'; // Brilliant champagne gold
      } else {
        this.colorCore = '#fff1f2';
        this.colorGlow = '#f43f5e'; // Sacred vermilion temple sparkle
      }
    }
    update() {
      this.phase += this.twinkleSpeed;
      this.rotation += this.rotSpeed;
      this.y += this.vy * this.depth;
      this.x += this.vx + Math.sin(this.phase * 0.8) * 0.45 + (globalWindX * 0.2);

      // Mouse interactive drift
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130) {
        const force = (1 - dist / 130) * 2.2;
        this.x += (dx / (dist || 1)) * force + mouse.vx * 0.3;
        this.y += (dy / (dist || 1)) * force + mouse.vy * 0.3;
      }

      if (this.y < -35 || this.x < -35 || this.x > width + 35) {
        this.reset();
      }
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      const shimmer = Math.sin(this.phase);
      const alpha = Math.max(0, shimmer * 0.4 + 0.6) * this.depth;
      ctx.globalAlpha = Math.min(1, alpha);

      const r = this.size * (0.8 + shimmer * 0.3);

      // Sacred 4-point Shrine Sparkle (✦)
      ctx.fillStyle = this.colorGlow;
      ctx.beginPath();
      ctx.moveTo(0, -r * 2.2);
      ctx.quadraticCurveTo(0, 0, r * 2.2, 0);
      ctx.quadraticCurveTo(0, 0, 0, r * 2.2);
      ctx.quadraticCurveTo(0, 0, -r * 2.2, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r * 2.2);
      ctx.closePath();
      ctx.fill();

      // Dazzling white-gold center core
      ctx.fillStyle = this.colorCore;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.05);
      ctx.quadraticCurveTo(0, 0, r * 1.05, 0);
      ctx.quadraticCurveTo(0, 0, 0, r * 1.05);
      ctx.quadraticCurveTo(0, 0, -r * 1.05, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r * 1.05);
      ctx.closePath();
      ctx.fill();

      // Specular aura flare
      if (shimmer > 0.65) {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = (shimmer - 0.65) * 1.6;
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // 2. Realistic 3D Tumbling Japanese Gold Leaf Flakes (金箔・切箔 Kinpaku Flakes)
  class KinpakuFlake {
    constructor(isBurst = false) {
      this.isBurst = isBurst;
      this.reset(!isBurst);
    }
    reset(initial = false) {
      this.x = initial ? Math.random() * width : Math.random() * (width + 200) - 100;
      this.y = initial ? Math.random() * height : -20 - Math.random() * 40;
      this.size = Math.random() * 4.2 + 2.2;
      this.vx = (Math.random() * 0.6 + 0.3) + globalWindX * 0.4;
      this.vy = Math.random() * 0.85 + 0.55; // Gently falling like gold leaf dust
      this.pitch = Math.random() * Math.PI * 2;
      this.yaw = Math.random() * Math.PI * 2;
      this.roll = Math.random() * Math.PI * 2;
      this.dPitch = (Math.random() * 0.045 + 0.015) * (Math.random() < 0.5 ? 1 : -1);
      this.dYaw = (Math.random() * 0.05 + 0.015) * (Math.random() < 0.5 ? 1 : -1);
      this.dRoll = Math.random() * 0.025 + 0.01;
      this.shapePoints = [
        { x: -1 + Math.random() * 0.3, y: -1 + Math.random() * 0.3 },
        { x: 1 - Math.random() * 0.3, y: -0.7 + Math.random() * 0.4 },
        { x: 0.9 - Math.random() * 0.3, y: 1 - Math.random() * 0.3 },
        { x: -0.8 + Math.random() * 0.3, y: 0.8 - Math.random() * 0.3 }
      ];
      this.opacity = Math.random() * 0.35 + 0.65;
    }
    update() {
      this.pitch += this.dPitch;
      this.yaw += this.dYaw;
      this.roll += this.dRoll;

      this.x += this.vx + Math.sin(this.pitch) * 0.75;
      this.y += this.vy + Math.cos(this.yaw) * 0.35;

      // Mouse interactive displacement
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140) {
        const force = (1 - dist / 140) * 3.2;
        this.x += mouse.vx * force + (dx / (dist || 1)) * force * 1.8;
        this.y += mouse.vy * force + (dy / (dist || 1)) * force * 1.1;
      }

      if (this.y > height + 30 || this.x > width + 50 || this.x < -50) {
        if (this.isBurst) {
          const idx = kinpakuFlakes.indexOf(this);
          if (idx !== -1) kinpakuFlakes.splice(idx, 1);
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

      // Specular metallic sheen
      const specular = Math.abs(scaleX * scaleY);
      const isGlint = specular > 0.8;

      ctx.globalAlpha = this.opacity * (specular * 0.5 + 0.5);

      // Gold leaf metallic gradient
      const grad = ctx.createLinearGradient(-this.size, -this.size, this.size, this.size);
      if (isGlint) {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#fef08a');
        grad.addColorStop(0.7, '#fbbf24');
        grad.addColorStop(1, '#f59e0b');
      } else {
        grad.addColorStop(0, '#fde047');
        grad.addColorStop(0.5, '#f59e0b');
        grad.addColorStop(1, '#b45309');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      const pts = this.shapePoints;
      ctx.moveTo(pts[0].x * this.size, pts[0].y * this.size);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x * this.size, pts[i].y * this.size);
      }
      ctx.closePath();
      ctx.fill();

      // Specular glint star
      if (isGlint && Math.random() < 0.2) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Particle Pools (Balanced density for cinematic Japanese shrine immersion & 60fps)
  const baseCount = Math.max(55, Math.min(95, Math.floor(window.innerWidth / 16)));
  const petals = Array.from({ length: baseCount }, () => new SakuraPetal());
  const orbs = Array.from({ length: 26 }, () => new SpiritOrb());

  // Sacred Japanese Shrine Glitter & Kinpaku Gold Leaf Pools
  const shrineGlitterCount = Math.max(28, Math.min(55, Math.floor(window.innerWidth / 28)));
  const shrineGlitters = Array.from({ length: shrineGlitterCount }, () => new ShrineGlitterSparkle());
  const kinpakuCount = Math.max(22, Math.min(44, Math.floor(window.innerWidth / 36)));
  const kinpakuFlakes = Array.from({ length: kinpakuCount }, () => new KinpakuFlake());

  // Animation Loop
  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Global wind shifting like spring breeze
    windTime += 0.007;
    globalWindX = Math.sin(windTime) * 0.75 + 0.75;

    // Draw mouse spark & shrine glitter trail
    for (let i = mouseTrail.length - 1; i >= 0; i--) {
      const sp = mouseTrail[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      if (sp.rot !== undefined) sp.rot += sp.rotSpeed || 0.02;
      sp.alpha -= 0.024;
      if (sp.alpha <= 0) {
        mouseTrail.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, sp.alpha);
      if (sp.isGlitterStar) {
        // Draw radiant 4-point shrine sparkle
        ctx.translate(sp.x, sp.y);
        ctx.rotate(sp.rot || 0);
        const r = sp.size;
        ctx.fillStyle = sp.color || '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.quadraticCurveTo(0, 0, 0, r);
        ctx.quadraticCurveTo(0, 0, -r, 0);
        ctx.quadraticCurveTo(0, 0, 0, -r);
        ctx.closePath();
        ctx.fill();

        // White-gold core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw spirit orbs
    for (let i = 0; i < orbs.length; i++) {
      orbs[i].update();
      orbs[i].draw();
    }

    // Draw 3D Kinpaku Gold Leaf Flakes
    for (let i = 0; i < kinpakuFlakes.length; i++) {
      kinpakuFlakes[i].update();
      kinpakuFlakes[i].draw();
    }

    // Draw Sacred Shrine Glitter Stars (✦)
    for (let i = 0; i < shrineGlitters.length; i++) {
      shrineGlitters[i].update();
      shrineGlitters[i].draw();
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
  // 🎶 JAPANESE SPIRAL & SPIRITUAL THEME MUSIC CONTROLLER ⛩️
  // Pure authentic acoustic Japanese theme tracks: ZERO electronic beeps/oscillators
  // ==========================================================================
  let isJapaneseMusicPlaying = false;
  let audioFadeInterval = null;
  let currentTrackTitle = "Spiral Theme (螺旋)";

  function getThemeAudio() {
    let audio = document.getElementById('japaneseThemeAudio');
    if (!audio) {
      audio = new Audio('/static/audio/japanese_spiral_theme.mp3');
      audio.id = 'japaneseThemeAudio';
      audio.loop = true;
      document.body.appendChild(audio);
    }
    return audio;
  }

  function fadeAudio(audio, targetVol) {
    if (audioFadeInterval) clearInterval(audioFadeInterval);
    let vol = audio.volume;
    const step = targetVol > vol ? 0.05 : -0.05;
    audioFadeInterval = setInterval(() => {
      vol += step;
      if ((step > 0 && vol >= targetVol) || (step < 0 && vol <= targetVol)) {
        audio.volume = Math.max(0, Math.min(1, targetVol));
        clearInterval(audioFadeInterval);
        if (targetVol === 0) {
          audio.pause();
          isJapaneseMusicPlaying = false;
        }
      } else {
        audio.volume = Math.max(0, Math.min(1, vol));
      }
    }, 30);
  }

  function updateMusicUI(isPlaying) {
    const btn = document.getElementById('zenMusicToggleBtn');
    if (!btn) return;
    if (isPlaying) {
      btn.className = "p-2 sm:px-3 py-2 rounded-l-xl bg-[#1e0a12] text-rose-200 border border-rose-500 transition shadow-lg shadow-rose-950/60 flex items-center gap-2 active:scale-95 glow-hazard";
      btn.innerHTML = `
        <i id="zenMusicIcon" data-lucide="volume-2" class="w-4 h-4 text-rose-400 animate-pulse"></i>
        <span id="zenMusicLabel" class="text-xs font-bold text-rose-100 hidden sm:inline">Playing ${currentTrackTitle}</span>
        <span id="zenMusicVisualizer" class="flex items-center gap-0.5 h-3">
          <span class="w-0.5 h-2 bg-rose-400 rounded-full animate-bounce"></span>
          <span class="w-0.5 h-3 bg-rose-300 rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
          <span class="w-0.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
        </span>
      `;
    } else {
      btn.className = "p-2 sm:px-3 py-2 rounded-l-xl bg-[#0b1c15] text-slate-300 hover:text-rose-200 border border-emerald-800/80 hover:border-rose-500/60 transition shadow-sm flex items-center gap-2 active:scale-95 group";
      btn.innerHTML = `
        <i id="zenMusicIcon" data-lucide="music" class="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform"></i>
        <span id="zenMusicLabel" class="text-xs font-bold hidden sm:inline">Spiral Music: Off</span>
      `;
    }
    if (window.lucide) lucide.createIcons();
  }

  window.switchJapaneseTrack = function (trackSrc, trackTitle) {
    const audio = getThemeAudio();
    const trackSelect = document.getElementById('zenTrackSelect');
    if (!trackTitle && trackSelect) {
      trackTitle = trackSelect.options[trackSelect.selectedIndex]?.text || "Spiral Theme (螺旋)";
    }
    currentTrackTitle = trackTitle || "Spiral Theme (螺旋)";

    const wasPlaying = isJapaneseMusicPlaying;
    if (audioFadeInterval) clearInterval(audioFadeInterval);

    audio.pause();
    audio.src = trackSrc;
    audio.load();

    if (wasPlaying) {
      audio.volume = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isJapaneseMusicPlaying = true;
          fadeAudio(audio, 0.45);
          updateMusicUI(true);
        }).catch((err) => {
          console.log("Audio switch waiting for user interaction:", err);
          updateMusicUI(false);
        });
      }
    } else {
      updateMusicUI(false);
    }
  };

  window.toggleJapaneseMusic = function () {
    const audio = getThemeAudio();
    if (audioFadeInterval) clearInterval(audioFadeInterval);

    if (isJapaneseMusicPlaying) {
      fadeAudio(audio, 0);
      updateMusicUI(false);
    } else {
      audio.volume = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isJapaneseMusicPlaying = true;
          fadeAudio(audio, 0.45);
          updateMusicUI(true);
        }).catch((err) => {
          console.log("Audio play postponed until user gesture:", err);
        });
      }
    }
  };

  // Backwards compatibility / safety aliases (all synthetic beeps/tones disabled)
  window.toggleZenAmbience = window.toggleJapaneseMusic;
  window.playZenWindChime = function () {};
  window.playSoftZenChime = function () {};

  // Handle background video initialization & smooth fade-in
  function initBackgroundVideo() {
    const bgVideo = document.getElementById('bgVideo');
    if (!bgVideo) return;

    const markVideoActive = () => {
      bgVideo.classList.add('is-loaded');
    };

    if (bgVideo.readyState >= 2) {
      markVideoActive();
    } else {
      bgVideo.addEventListener('playing', markVideoActive, { once: true });
      bgVideo.addEventListener('canplay', markVideoActive, { once: true });
    }

    const tryPlay = () => {
      bgVideo.muted = true;
      const p = bgVideo.play();
      if (p !== undefined) {
        p.then(markVideoActive).catch(() => {
          const userPlay = () => {
            bgVideo.play().then(markVideoActive).catch(() => {});
            window.removeEventListener('click', userPlay);
            window.removeEventListener('touchstart', userPlay);
          };
          window.addEventListener('click', userPlay, { once: true });
          window.addEventListener('touchstart', userPlay, { once: true });
        });
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryPlay);
    } else {
      tryPlay();
    }
  }

  initBackgroundVideo();
})();
