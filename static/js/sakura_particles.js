/**
 * Japanese Zen 3D Sakura & Spirit Particle System
 * Features 3D fluttering cherry blossom petals, Kodama spirit motes,
 * wind turbulence, and mouse interaction.
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
  canvas.style.zIndex = '1';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // Mouse wind tracker
  let mouse = { x: -1000, y: -1000, vx: 0, vy: 0, lastX: 0, lastY: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.vx = (e.clientX - mouse.lastX) * 0.15;
    mouse.vy = (e.clientY - mouse.lastY) * 0.15;
    mouse.lastX = e.clientX;
    mouse.lastY = e.clientY;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Sakura Petal Class with 3D tumbling physics
  class SakuraPetal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -20 - Math.random() * 40;
      this.z = Math.random() * 0.8 + 0.4; // 3D depth layer
      this.size = (Math.random() * 9 + 8) * this.z;
      
      // Speed vectors
      this.vx = (Math.random() * 1.2 - 0.4) * this.z;
      this.vy = (Math.random() * 1.4 + 0.8) * this.z;
      
      // 3D rotation angles & speeds
      this.pitch = Math.random() * Math.PI * 2;
      this.yaw = Math.random() * Math.PI * 2;
      this.roll = Math.random() * Math.PI * 2;
      
      this.dPitch = (Math.random() * 0.03 + 0.01) * (Math.random() < 0.5 ? 1 : -1);
      this.dYaw = (Math.random() * 0.03 + 0.01) * (Math.random() < 0.5 ? 1 : -1);
      this.dRoll = (Math.random() * 0.02 + 0.005);
      
      // Petal color nuances: delicate pink, blush sakura, cherry blossom white
      const hue = Math.floor(Math.random() * 15 + 345); // 345 - 360 (crimson/pink)
      const sat = Math.floor(Math.random() * 30 + 65);
      const light = Math.floor(Math.random() * 18 + 76);
      this.color = `hsl(${hue}, ${sat}%, ${light}%)`;
      this.shadowColor = `hsl(${hue}, 80%, 60%)`;
      this.opacity = Math.random() * 0.35 + 0.55;
    }

    update() {
      // Wind dynamics
      this.pitch += this.dPitch;
      this.yaw += this.dYaw;
      this.roll += this.dRoll;

      // Natural sway
      const sway = Math.sin(this.pitch) * 0.8;
      this.x += this.vx + sway;
      this.y += this.vy;

      // Mouse interactive wind gust
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = (1 - dist / 150) * 4;
        this.x += mouse.vx * force + (dx / (dist || 1)) * force * 2;
        this.y += mouse.vy * force + (dy / (dist || 1)) * force;
      }

      // Loop or reset when falling off screen
      if (this.y > height + 30 || this.x < -30 || this.x > width + 30) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.roll);
      
      // 3D perspective distortion (simulate tumbling)
      const scaleX = Math.cos(this.yaw);
      const scaleY = Math.sin(this.pitch);
      ctx.scale(scaleX, scaleY);

      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity * Math.abs(scaleX * scaleY * 0.4 + 0.6);

      // Organic Cherry Blossom Petal Path
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(this.size * 0.8, -this.size * 0.8, this.size * 0.9, this.size * 0.4, 0, this.size);
      ctx.bezierCurveTo(-this.size * 0.9, this.size * 0.4, -this.size * 0.8, -this.size * 0.8, 0, -this.size);
      
      // Notch at the petal tip (classic Sakura cleft)
      ctx.lineTo(0, -this.size * 0.8);
      ctx.closePath();
      ctx.fill();

      // Subtle translucent central vein
      ctx.strokeStyle = this.shadowColor;
      ctx.lineWidth = 0.6;
      ctx.globalAlpha = this.opacity * 0.35;
      ctx.beginPath();
      ctx.moveTo(0, this.size * 0.85);
      ctx.lineTo(0, -this.size * 0.6);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Kodama / Spirit Golden Ember Motes
  class SpiritMote {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.size = Math.random() * 2.5 + 1.0;
      this.vy = -(Math.random() * 0.6 + 0.3); // floats UPWARD
      this.vx = (Math.random() - 0.5) * 0.4;
      this.alpha = Math.random() * 0.6 + 0.2;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
      this.phase = Math.random() * Math.PI * 2;
      // Gold & sacred emerald spirit colors
      this.isGold = Math.random() > 0.4;
    }

    update() {
      this.phase += this.pulseSpeed;
      this.y += this.vy;
      this.x += this.vx + Math.sin(this.phase) * 0.5;

      if (this.y < -20) this.reset();
    }

    draw() {
      ctx.save();
      const currentAlpha = this.alpha * (Math.sin(this.phase) * 0.3 + 0.7);
      ctx.globalAlpha = Math.max(0, currentAlpha);
      
      // Radial glow
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3.5);
      if (this.isGold) {
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.4, '#eab308');
        grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      } else {
        grad.addColorStop(0, '#a7f3d0');
        grad.addColorStop(0.4, '#10b981');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      }
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Particle Pools
  const petalCount = Math.min(36, Math.floor(window.innerWidth / 35));
  const petals = Array.from({ length: petalCount }, () => new SakuraPetal());
  
  const moteCount = Math.min(22, Math.floor(window.innerWidth / 50));
  const motes = Array.from({ length: moteCount }, () => new SpiritMote());

  // Animation Loop
  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw spirit motes
    for (let i = 0; i < motes.length; i++) {
      motes[i].update();
      motes[i].draw();
    }

    // Draw 3D Sakura petals
    for (let i = 0; i < petals.length; i++) {
      petals[i].update();
      petals[i].draw();
    }

    requestAnimationFrame(animate);
  }

  animate();
})();
