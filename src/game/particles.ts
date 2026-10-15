/**
 * Space Invaders: Neon Assault 90s - Particle Simulator & Lighting System
 */

import { Particle, FloatingText } from '../types';

export class ParticleSystem {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public stars: { x: number; y: number; speed: number; size: number; alpha: number; color: string }[] = [];
  public nebulas: { x: number; y: number; radius: number; color: string; alpha: number; vx: number }[] = [];

  constructor(width: number = 800, height: number = 900) {
    this.initCosmicBackground(width, height);
  }

  public initCosmicBackground(width: number, height: number) {
    this.stars = [];
    for (let i = 0; i < 140; i++) {
      const speed = 0.2 + Math.random() * 1.5;
      const size = Math.random() < 0.8 ? 1 : Math.random() < 0.95 ? 2 : 3;
      const colors = ['#ffffff', '#67e8f9', '#f472b6', '#a78bfa', '#fef08a'];
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed,
        size,
        alpha: 0.3 + Math.random() * 0.7,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    this.nebulas = [
      { x: width * 0.2, y: height * 0.3, radius: 220, color: 'rgba(56, 189, 248, 0.08)', alpha: 0.08, vx: 0.05 },
      { x: width * 0.8, y: height * 0.7, radius: 260, color: 'rgba(217, 70, 239, 0.07)', alpha: 0.07, vx: -0.04 },
      { x: width * 0.5, y: height * 0.15, radius: 180, color: 'rgba(99, 102, 241, 0.09)', alpha: 0.09, vx: 0.02 },
    ];
  }

  public update(dt: number, width: number, height: number, speedMultiplier: number = 1.0) {
    // 1. Update stars with warp speed factor
    for (const star of this.stars) {
      star.y += star.speed * speedMultiplier;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    }

    // 2. Update nebulae
    for (const neb of this.nebulas) {
      neb.x += neb.vx;
      if (neb.x - neb.radius > width) neb.x = -neb.radius;
      if (neb.x + neb.radius < 0) neb.x = width + neb.radius;
    }

    // 3. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;

      if (p.shape === 'ring' && p.ringRadius !== undefined && p.ringExpand) {
        p.ringRadius += p.ringExpand;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Cap maximum particles to maintain 60+ FPS
    if (this.particles.length > 160) {
      this.particles.splice(0, this.particles.length - 160);
    }

    // 4. Update floating text popups
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.018;
      ft.scale = Math.min(1.2, ft.scale + 0.01);
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public emitShipThrust(x: number, y: number, color: string = '#06b6d4', intensity: number = 1) {
    const count = Math.min(2, Math.ceil(1.5 * intensity));
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + Math.random() * 2,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 1.8 + Math.random() * 2.5,
        size: 1.5 + Math.random() * 2.0,
        color,
        alpha: 0.8,
        decay: 0.08 + Math.random() * 0.04,
        shape: 'circle',
        glow: true,
      });
    }
  }

  public emitExplosion(x: number, y: number, color: string = '#f59e0b', count: number = 24, size: 'small' | 'medium' | 'boss' = 'medium') {
    const baseCount = size === 'boss' ? 70 : size === 'medium' ? 32 : 16;
    const maxSpeed = size === 'boss' ? 8 : size === 'medium' ? 5 : 3.5;

    // Shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 2,
      color,
      alpha: 0.9,
      decay: 0.03,
      shape: 'ring',
      ringRadius: 6,
      ringExpand: size === 'boss' ? 7 : 4,
      glow: true,
    });

    // Spark shower
    for (let i = 0; i < baseCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * maxSpeed;
      const palette = [color, '#ffffff', '#fbbf24', '#ef4444', '#ec4899'];
      const pColor = palette[Math.floor(Math.random() * palette.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 3.5,
        color: pColor,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.025,
        shape: Math.random() < 0.3 ? 'spark' : 'circle',
        glow: true,
      });
    }
  }

  public emitEmpShockwave(x: number, y: number) {
    for (let r = 0; r < 3; r++) {
      this.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        size: 4 - r,
        color: r === 0 ? '#38bdf8' : r === 1 ? '#818cf8' : '#c084fc',
        alpha: 0.95,
        decay: 0.02,
        shape: 'ring',
        ringRadius: 10 + r * 15,
        ringExpand: 12 + r * 2,
        glow: true,
      });
    }

    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3,
        color: '#67e8f9',
        alpha: 0.9,
        decay: 0.025,
        shape: 'spark',
        glow: true,
      });
    }
  }

  public emitLaserImpactSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2,
        color,
        alpha: 0.9,
        decay: 0.05 + Math.random() * 0.05,
        shape: 'circle',
        glow: true,
      });
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string = '#facc15') {
    this.floatingTexts.push({
      id: `${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      vy: -1.2,
      color,
      alpha: 1.0,
      scale: 1.0,
    });
  }

  public render(ctx: CanvasRenderingContext2D) {
    // 1. Render nebulae glow (soft atmospheric background)
    for (const neb of this.nebulas) {
      ctx.fillStyle = neb.color;
      ctx.beginPath();
      ctx.arc(neb.x, neb.y, neb.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render stars
    for (const star of this.stars) {
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.alpha;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1.0;

    // 3. Render glowing particles with additive blending (Ultra-fast & vibrant)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.shape === 'ring' && p.ringRadius !== undefined) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, p.size);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, p.size);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Inner white-hot neon highlight for glowing sparks
        if (p.glow && p.size > 2.2) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();

    // 4. Render floating text popups
    ctx.save();
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);

      // Clean shadow offset instead of blur
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillText(ft.text, 1.5, 1.5);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);

      ctx.restore();
    }
    ctx.restore();
  }
}
