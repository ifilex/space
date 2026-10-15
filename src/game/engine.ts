/**
 * Space Invaders: Neon Assault 90s - Core Canvas Game Engine
 * Features acceleration physics, spatial hash collision detection, destructible bunkers, and retro rendering.
 */

import {
  GameMode,
  PlayerShip,
  Invader,
  Projectile,
  PowerUpItem,
  Bunker,
  GameSettings,
  Achievement,
} from '../types';
import { ParticleSystem } from './particles';
import { WeaponSystem } from './weapons';
import { LevelFactory, StageDefinition } from './levels';
import { CognitiveAnalyzer } from './cognitive';
import { soundEngine } from '../audio/soundEngine';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public width: number = 800;
  public height: number = 900;

  // Game state
  public mode: GameMode = 'classic';
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public isGameOver: boolean = false;
  public wave: number = 1;
  public score: number = 0;
  public timeAttackRemainingMs: number = 180000; // 3 minutes for Time Attack
  public chronoWarpTimer: number = 0; // ms remaining of slow-mo

  // Entities
  public p1: PlayerShip;
  public p2?: PlayerShip;
  public isCoop: boolean = false;
  public invaders: Invader[] = [];
  public currentStage: StageDefinition | null = null;
  public projectiles: Projectile[] = [];
  public powerUps: PowerUpItem[] = [];
  public bunkers: Bunker[] = [];
  public mysteryUfo: Invader | null = null;
  private nextUfoTime: number = 20000;

  // Systems
  public particles: ParticleSystem;
  public cognitive: CognitiveAnalyzer;
  public settings: GameSettings;

  // Visual effects
  public screenShake: number = 0;
  public screenFlashAlpha: number = 0;
  public screenFlashColor: string = '#ffffff';

  // Spatial Partitioning Grid for O(N) Collision Detection
  private readonly cellSize: number = 64;
  private grid: Map<string, (Invader | Projectile | Bunker)[]> = new Map();

  // Callbacks
  public onGameOver?: (stats: { score: number; wave: number; accuracy: number; mode: GameMode }) => void;
  public onAchievementUnlocked?: (ach: Achievement) => void;
  public onWaveComplete?: (wave: number) => void;

  private lastTime: number = 0;
  private animFrameId: number | null = null;
  private accumulator: number = 0;
  private readonly FIXED_STEP: number = 16.666; // 60 updates/sec deterministic physics

  constructor(canvas: HTMLCanvasElement, settings: GameSettings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.settings = settings;

    this.particles = new ParticleSystem(this.width, this.height);
    this.cognitive = new CognitiveAnalyzer();

    this.p1 = this.createDefaultPlayer(1, '#06b6d4', '#38bdf8');
    this.resize(canvas.clientWidth, canvas.clientHeight);
  }

  public resize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(600, Math.min(1000, w));
    this.height = Math.max(700, Math.min(1100, h));

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    this.particles.initCosmicBackground(this.width, this.height);
    if (!this.isRunning) {
      this.p1.x = this.width / 2 - this.p1.width / 2;
      this.p1.y = this.height - 85;
    }
  }

  private createDefaultPlayer(id: 1 | 2, color: string, secondaryColor: string): PlayerShip {
    return {
      id,
      x: id === 1 ? this.width * 0.4 : this.width * 0.6,
      y: this.height - 85,
      vx: 0,
      vy: 0,
      targetVx: 0,
      targetVy: 0,
      width: 44,
      height: 34,
      tiltAngle: 0,
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      lives: 3,
      score: 0,
      weaponType: 'SINGLE',
      weaponLevel: 1,
      empCount: 1,
      lastFireTime: 0,
      invulnerableTimer: 0,
      combo: 0,
      comboTimer: 0,
      shotsFired: 0,
      shotsHit: 0,
      color,
      secondaryColor,
      trailParticles: [],
    };
  }

  public initBunkers() {
    this.bunkers = [];
    const count = 4;
    const bunkerWidth = 64;
    const bunkerHeight = 44;
    const spacing = (this.width - count * bunkerWidth) / (count + 1);

    for (let b = 0; b < count; b++) {
      const bx = spacing + b * (bunkerWidth + spacing);
      const by = this.height - 180;
      const cols = 16;
      const rows = 11;
      const pixels = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Arch cutout shape
          const isArchCutout = r >= 7 && c >= 5 && c <= 10;
          const isCornerCutout = (r === 0 && (c <= 1 || c >= 14)) || (r === 1 && (c === 0 || c === 15));
          const alive = !isArchCutout && !isCornerCutout;

          pixels.push({
            alive,
            color: '#22c55e',
          });
        }
      }

      this.bunkers.push({
        id: `bunker-${b}`,
        x: bx,
        y: by,
        width: bunkerWidth,
        height: bunkerHeight,
        gridWidth: cols,
        gridHeight: rows,
        pixels,
      });
    }
  }

  public start(mode: GameMode = 'classic') {
    this.mode = mode;
    this.isCoop = mode === 'coop';
    this.isGameOver = false;
    this.isPaused = false;
    this.wave = 1;
    this.score = 0;
    this.timeAttackRemainingMs = 180000;
    this.chronoWarpTimer = 0;
    this.projectiles = [];
    this.powerUps = [];
    this.mysteryUfo = null;
    this.nextUfoTime = performance.now() + 18000;

    this.p1 = this.createDefaultPlayer(1, '#06b6d4', '#38bdf8');
    this.p1.x = this.isCoop ? this.width * 0.35 : this.width / 2 - 22;
    this.p1.y = this.height - 85;

    if (this.isCoop) {
      this.p2 = this.createDefaultPlayer(2, '#ec4899', '#f472b6');
      this.p2.x = this.width * 0.65;
      this.p2.y = this.height - 85;
    } else {
      this.p2 = undefined;
    }

    this.cognitive.reset();
    this.initBunkers();
    this.loadWave(1);

    this.isRunning = true;
    this.lastTime = performance.now();
    soundEngine.startMusic();

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  public loadWave(waveNumber: number) {
    this.wave = waveNumber;
    this.currentStage = LevelFactory.createStage(waveNumber, this.width, this.height);
    this.invaders = this.currentStage.invaders;

    this.particles.addFloatingText(
      this.currentStage.title,
      this.width / 2,
      this.height * 0.35,
      '#38bdf8'
    );
    this.particles.addFloatingText(
      `Inspiración: ${this.currentStage.gameInspiration}`,
      this.width / 2,
      this.height * 0.40,
      '#facc15'
    );

    // Minor shield replenish on wave completion
    this.p1.shield = Math.min(this.p1.maxShield, this.p1.shield + 40);
    if (this.p2) this.p2.shield = Math.min(this.p2.maxShield, this.p2.shield + 40);

    soundEngine.playPowerUp();
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      soundEngine.stopMusic();
    } else {
      soundEngine.startMusic();
      this.lastTime = performance.now();
    }
  }

  public triggerEmp(playerIndex: 1 | 2 = 1) {
    const player = playerIndex === 1 ? this.p1 : this.p2;
    if (!player || player.empCount <= 0) return;

    player.empCount--;
    soundEngine.playEmpBlast();
    this.particles.emitEmpShockwave(player.x + player.width / 2, player.y + player.height / 2);
    this.screenShake = 18;
    this.screenFlashAlpha = 0.6;
    this.screenFlashColor = '#38bdf8';

    // Clear all enemy projectiles
    this.projectiles = this.projectiles.filter((p) => p.isPlayer);

    // Damage all invaders
    for (let i = this.invaders.length - 1; i >= 0; i--) {
      const inv = this.invaders[i];
      inv.health -= 3;
      this.particles.emitLaserImpactSparks(inv.x + inv.width / 2, inv.y + inv.height / 2, '#38bdf8');
      if (inv.health <= 0) {
        this.killInvader(inv, i, player);
      }
    }

    this.particles.addFloatingText('PULSO EMP DETONADO', this.width / 2, this.height * 0.5, '#38bdf8');
  }

  private loop(currentTime: number) {
    if (!this.isRunning) return;

    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    if (frameTime > 100) frameTime = 100; // Cap to avoid spiral of death on tab focus

    if (!this.isPaused && !this.isGameOver) {
      this.accumulator += frameTime;
      // Fixed 60Hz physics steps for deterministic, rock-solid gameplay
      while (this.accumulator >= this.FIXED_STEP) {
        this.update(this.FIXED_STEP, currentTime);
        this.accumulator -= this.FIXED_STEP;
      }
    } else {
      this.accumulator = 0;
    }

    this.render();
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  private update(dt: number, now: number) {
    // 1. Time Attack timer
    if (this.mode === 'timeattack') {
      this.timeAttackRemainingMs -= dt;
      if (this.timeAttackRemainingMs <= 0) {
        this.timeAttackRemainingMs = 0;
        this.endGame();
        return;
      }
    }

    // 2. Chrono Warp slow motion timer
    const timeScale = this.chronoWarpTimer > 0 ? 0.35 : 1.0;
    if (this.chronoWarpTimer > 0) {
      this.chronoWarpTimer -= dt;
    }

    // 3. Screen shake & flash decay
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - 0.9);
    if (this.screenFlashAlpha > 0) this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - 0.04);

    // 4. Update Players physics (Fast, agile, responsive arcade controls)
    this.updatePlayerPhysics(this.p1, dt);
    if (this.p2) this.updatePlayerPhysics(this.p2, dt);

    // 5. Update weapon homing kinematics
    WeaponSystem.updateHomingMissiles(this.projectiles, this.invaders);

    // 6. Update Projectiles
    this.updateProjectiles(dt * timeScale);

    // 7. Update Invaders formation and movement
    this.updateInvaders(dt * timeScale, now);

    // 8. Update Mystery UFO
    this.updateMysteryUfo(dt * timeScale, now);

    // 9. Update Power-ups
    this.updatePowerUps(dt);

    // 10. Optimized Spatial Grid Collisions
    this.checkSpatialCollisions();

    // 11. Particles & cosmic stars
    this.particles.update(dt, this.width, this.height, this.chronoWarpTimer > 0 ? 0.4 : 1.0);

    // 12. Cognitive Behavioral Tracking & Danger Proximity Detection
    this.cognitive.detectThreatProximity(this.p1, this.projectiles);
    if (this.p2) this.cognitive.detectThreatProximity(this.p2, this.projectiles);

    // 13. Dynamic tension soundtrack update
    const totalInvaders = this.currentStage ? this.currentStage.invaders.length : 30;
    const ratio = this.invaders.length / Math.max(1, totalInvaders);
    const isBoss = this.currentStage?.formationType === 'boss_core';
    soundEngine.updateTension(ratio, this.wave, isBoss, this.mode === 'timeattack');

    // 14. Check wave clear condition
    if (this.invaders.length === 0) {
      this.onWaveCleared();
    }
  }

  private updatePlayerPhysics(player: PlayerShip, dt: number) {
    // High-responsiveness arcade physics (fast, agile, razor-sharp response)
    const maxSpeed = 9.5;
    const accelRate = 0.35; // Instant responsive pickup (~3 frames)
    const decelRate = 0.74; // Crisp, non-slippery braking

    // Horizontal movement (classic Space Invaders primary axis)
    if (Math.abs(player.targetVx) > 0.04) {
      player.vx += (player.targetVx * maxSpeed - player.vx) * accelRate;
    } else {
      player.vx *= decelRate;
      if (Math.abs(player.vx) < 0.05) player.vx = 0;
    }

    // Subtle tactical vertical dodge (confined to bottom defense buffer)
    if (Math.abs(player.targetVy) > 0.04) {
      player.vy += (player.targetVy * (maxSpeed * 0.6) - player.vy) * accelRate;
    } else {
      player.vy *= decelRate;
      if (Math.abs(player.vy) < 0.05) player.vy = 0;
    }

    player.x += player.vx;
    player.y += player.vy;

    // Strict boundary clamping
    player.x = Math.max(16, Math.min(this.width - player.width - 16, player.x));
    player.y = Math.max(this.height - 125, Math.min(this.height - player.height - 18, player.y));

    // Smooth banking roll angle (tilt in direction of lateral velocity)
    player.tiltAngle = (player.vx / maxSpeed) * 0.22;

    // Shield passive regeneration if not hit recently
    if (player.shield < player.maxShield) {
      player.shield = Math.min(player.maxShield, player.shield + 0.035 * dt);
    }

    // Invulnerability decay
    if (player.invulnerableTimer > 0) {
      player.invulnerableTimer -= dt;
    }

    // Combo timer decay
    if (player.comboTimer > 0) {
      player.comboTimer -= dt;
      if (player.comboTimer <= 0) {
        player.combo = 0;
      }
    }

    // Emit subtle thrust particles only when moving
    if (Math.abs(player.vx) > 0.4 || Math.abs(player.vy) > 0.4) {
      this.particles.emitShipThrust(
        player.x + player.width / 2,
        player.y + player.height - 4,
        player.color,
        Math.abs(player.vx) / maxSpeed
      );
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * (dt / 16.6);
      p.y += p.vy * (dt / 16.6);

      // Despawn bounds
      if (p.y < -30 || p.y > this.height + 30 || p.x < -30 || p.x > this.width + 30) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateInvaders(dt: number, now: number) {
    if (this.invaders.length === 0) return;

    let hitEdge = false;
    let minX = 9999;
    let maxX = -9999;

    for (const inv of this.invaders) {
      minX = Math.min(minX, inv.x);
      maxX = Math.max(maxX, inv.x + inv.width);
    }

    const dda = this.cognitive.currentDifficulty;
    const baseSpeed = (this.currentStage?.alienSpeed || 1.2) * dda.alienSpeedMultiplier;

    // Check if group hits canvas edge
    if (minX <= 15 && this.invaders[0].vx < 0) hitEdge = true;
    if (maxX >= this.width - 15 && this.invaders[0].vx > 0) hitEdge = true;

    if (hitEdge) {
      for (const inv of this.invaders) {
        inv.vx = -inv.vx;
        inv.y += 16; // March downward
      }
    }

    // Update each invader position & attacks
    for (let i = this.invaders.length - 1; i >= 0; i--) {
      const inv = this.invaders[i];

      if (inv.isDiving && inv.diveTimer !== undefined) {
        // Dive bombing arc (Galaga style)
        inv.diveTimer += 0.04 * (dt / 16.6);
        inv.y += 3.5 * (dt / 16.6);
        inv.x += Math.sin(inv.diveTimer * 2) * 4 * (dt / 16.6);

        // Loop back up if passed bottom
        if (inv.y > this.height) {
          inv.y = -30;
          inv.isDiving = false;
        }
      } else {
        inv.x += inv.vx * baseSpeed * (dt / 16.6);
      }

      // Check if invaders invaded bottom (game over breach)
      if (inv.y + inv.height >= this.height - 95 && !inv.isDiving) {
        this.endGame();
        return;
      }

      // Attack countdown
      inv.attackCooldown -= (dt / 16.6) * dda.alienFireRateMultiplier;
      if (inv.attackCooldown <= 0) {
        inv.attackCooldown = 150 + Math.random() * 320;
        this.alienFire(inv);

        // Chance to trigger dive bomb
        if (
          !inv.isDiving &&
          Math.random() < (this.currentStage?.diveChance || 0.1) * dda.diveBombFrequency
        ) {
          inv.isDiving = true;
          inv.diveTimer = 0;
        }
      }
    }
  }

  private alienFire(inv: Invader) {
    soundEngine.playAlienLaser();
    const isBoss = inv.type === 'BOSS_CORE';
    const isCommander = inv.type === 'COMMANDER';
    const bulletSpeed = (isBoss ? 5.8 : isCommander ? 4.8 : 4.0) * this.cognitive.currentDifficulty.bulletSpeedMultiplier;

    if (isBoss) {
      // Triple radial spread
      [-0.25, 0, 0.25].forEach((angle) => {
        this.projectiles.push({
          id: `eb-${Date.now()}-${Math.random()}`,
          x: inv.x + inv.width / 2 - 3,
          y: inv.y + inv.height,
          vx: Math.sin(angle) * bulletSpeed,
          vy: Math.cos(angle) * bulletSpeed,
          width: 7,
          height: 14,
          color: '#f43f5e',
          glowColor: 'rgba(244, 63, 94, 0.9)',
          isPlayer: false,
          damage: 25,
        });
      });
    } else {
      this.projectiles.push({
        id: `eb-${Date.now()}-${Math.random()}`,
        x: inv.x + inv.width / 2 - 2,
        y: inv.y + inv.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: bulletSpeed,
        width: 5,
        height: 12,
        color: inv.color,
        glowColor: inv.glowColor,
        isPlayer: false,
        damage: 18,
      });
    }
  }

  private updateMysteryUfo(dt: number, now: number) {
    if (this.mysteryUfo) {
      this.mysteryUfo.x += this.mysteryUfo.vx * (dt / 16.6);
      if (this.mysteryUfo.x > this.width + 60 || this.mysteryUfo.x < -60) {
        this.mysteryUfo = null;
      }
    } else if (now > this.nextUfoTime) {
      // Spawn UFO
      const dir = Math.random() < 0.5 ? 1 : -1;
      this.mysteryUfo = {
        id: `ufo-${Date.now()}`,
        type: 'MYSTERY_UFO',
        x: dir === 1 ? -50 : this.width + 10,
        y: 35,
        originX: 0,
        originY: 0,
        vx: dir * 2.8,
        vy: 0,
        width: 48,
        height: 22,
        health: 5,
        maxHealth: 5,
        points: 1000,
        color: '#ef4444',
        glowColor: 'rgba(239, 68, 68, 0.9)',
        spriteIndex: 9,
        attackCooldown: 999,
        row: 0,
        col: 0,
      };
      this.nextUfoTime = now + (this.cognitive.currentDifficulty.mysteryUfoIntervalSeconds * 1000);
      soundEngine.playUfoAlert();
    }
  }

  private updatePowerUps(dt: number) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pw = this.powerUps[i];
      pw.x += pw.vx;
      pw.y += pw.vy;
      pw.lifetime -= dt;

      if (pw.y > this.height + 20 || pw.lifetime <= 0) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  /**
   * Optimized Spatial Partitioning Collision Detection
   */
  private checkSpatialCollisions() {
    this.grid.clear();

    // 1. Check Player Ship vs PowerUps
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pw = this.powerUps[i];
      const p1Hit = this.rectOverlap(this.p1.x, this.p1.y, this.p1.width, this.p1.height, pw.x, pw.y, 24, 24);
      const p2Hit = this.p2 && this.rectOverlap(this.p2.x, this.p2.y, this.p2.width, this.p2.height, pw.x, pw.y, 24, 24);

      if (p1Hit || p2Hit) {
        const targetPlayer = p1Hit ? this.p1 : this.p2!;
        this.collectPowerUp(pw, targetPlayer);
        this.powerUps.splice(i, 1);
      }
    }

    // 2. Check Projectiles against Invaders, UFO, Bunkers, and Players
    for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const p = this.projectiles[pIdx];

      if (p.isPlayer) {
        // Player projectile hitting Invaders
        let bulletConsumed = false;

        // Check UFO
        if (this.mysteryUfo && this.rectOverlap(p.x, p.y, p.width, p.height, this.mysteryUfo.x, this.mysteryUfo.y, this.mysteryUfo.width, this.mysteryUfo.height)) {
          this.mysteryUfo.health -= p.damage;
          this.particles.emitLaserImpactSparks(p.x, p.y, '#ef4444');
          soundEngine.playExplosion('small');

          if (this.mysteryUfo.health <= 0) {
            this.addScore(this.mysteryUfo.points, p.playerIndex);
            this.particles.emitExplosion(this.mysteryUfo.x + 24, this.mysteryUfo.y + 11, '#ef4444', 36, 'medium');
            this.particles.addFloatingText(`UFO +${this.mysteryUfo.points}`, this.mysteryUfo.x, this.mysteryUfo.y, '#ef4444');
            // Guaranteed rare powerup
            const pw = WeaponSystem.spawnPowerUp(this.mysteryUfo.x, this.mysteryUfo.y, 10.0);
            if (pw) this.powerUps.push(pw);
            this.mysteryUfo = null;
          }

          if (!p.piercing) {
            this.projectiles.splice(pIdx, 1);
            continue;
          }
        }

        // Check normal invaders
        for (let invIdx = this.invaders.length - 1; invIdx >= 0; invIdx--) {
          const inv = this.invaders[invIdx];

          if (this.rectOverlap(p.x, p.y, p.width, p.height, inv.x, inv.y, inv.width, inv.height)) {
            inv.health -= p.damage;
            const shooter = p.playerIndex === 2 && this.p2 ? this.p2 : this.p1;
            shooter.shotsHit++;
            this.particles.emitLaserImpactSparks(p.x, p.y, inv.color);
            soundEngine.playExplosion('small');

            if (inv.health <= 0) {
              this.killInvader(inv, invIdx, shooter);
            }

            if (!p.piercing) {
              bulletConsumed = true;
              break;
            }
          }
        }

        if (bulletConsumed) {
          this.projectiles.splice(pIdx, 1);
          continue;
        }

        // Check bunkers damage from player bullets (stray shots)
        if (this.checkBulletBunkerCollision(p)) {
          this.projectiles.splice(pIdx, 1);
          continue;
        }
      } else {
        // Enemy projectile hitting Bunkers or Players
        if (this.checkBulletBunkerCollision(p)) {
          this.projectiles.splice(pIdx, 1);
          continue;
        }

        // Check Player 1
        if (this.checkPlayerHit(this.p1, p)) {
          this.projectiles.splice(pIdx, 1);
          continue;
        }

        // Check Player 2 (Co-op)
        if (this.p2 && this.checkPlayerHit(this.p2, p)) {
          this.projectiles.splice(pIdx, 1);
          continue;
        }
      }
    }

    // 3. Check Diving Invaders hitting Players directly
    for (const inv of this.invaders) {
      if (inv.isDiving) {
        if (this.rectOverlap(inv.x, inv.y, inv.width, inv.height, this.p1.x, this.p1.y, this.p1.width, this.p1.height)) {
          this.damagePlayer(this.p1, 35);
        }
        if (this.p2 && this.rectOverlap(inv.x, inv.y, inv.width, inv.height, this.p2.x, this.p2.y, this.p2.width, this.p2.height)) {
          this.damagePlayer(this.p2, 35);
        }
      }
    }
  }

  private checkPlayerHit(player: PlayerShip, p: Projectile): boolean {
    if (player.invulnerableTimer > 0) return false;

    if (this.rectOverlap(p.x, p.y, p.width, p.height, player.x + 4, player.y + 4, player.width - 8, player.height - 8)) {
      this.damagePlayer(player, p.damage);
      return true;
    }
    return false;
  }

  private damagePlayer(player: PlayerShip, amount: number) {
    this.cognitive.recordHit();
    this.screenShake = 12;

    if (player.shield > 0) {
      player.shield -= amount * 1.5;
      soundEngine.playShieldHit();
      this.particles.emitLaserImpactSparks(player.x + player.width / 2, player.y + player.height / 2, '#38bdf8');
      if (player.shield < 0) {
        player.health += player.shield; // Overflow to health
        player.shield = 0;
      }
    } else {
      player.health -= amount;
      soundEngine.playExplosion('medium');
      this.screenFlashAlpha = 0.5;
      this.screenFlashColor = '#ef4444';
      this.particles.emitExplosion(player.x + player.width / 2, player.y + player.height / 2, player.color, 20, 'small');
    }

    if (player.health <= 0) {
      this.playerDied(player);
    }
  }

  private playerDied(player: PlayerShip) {
    player.lives--;
    this.particles.emitExplosion(player.x + player.width / 2, player.y + player.height / 2, player.color, 45, 'medium');
    soundEngine.playExplosion('boss');

    if (player.lives <= 0) {
      if (!this.isCoop || (this.p1.lives <= 0 && (!this.p2 || this.p2.lives <= 0))) {
        this.endGame();
      }
    } else {
      // Respawn with invulnerability
      player.health = player.maxHealth;
      player.shield = player.maxShield;
      player.invulnerableTimer = 3000;
      player.weaponType = 'SINGLE';
      player.weaponLevel = 1;
      player.x = player.id === 1 ? this.width * 0.4 : this.width * 0.6;
      player.y = this.height - 85;
      player.vx = 0;
      player.vy = 0;
      this.particles.addFloatingText('SISTEMAS REINICIADOS', player.x, player.y - 20, '#38bdf8');
    }
  }

  private checkBulletBunkerCollision(p: Projectile): boolean {
    for (const bunker of this.bunkers) {
      if (!this.rectOverlap(p.x, p.y, p.width, p.height, bunker.x, bunker.y, bunker.width, bunker.height)) {
        continue;
      }

      // Convert bullet position to bunker pixel grid
      const col = Math.floor(((p.x + p.width / 2 - bunker.x) / bunker.width) * bunker.gridWidth);
      const row = Math.floor(((p.y + p.height / 2 - bunker.y) / bunker.height) * bunker.gridHeight);

      if (col >= 0 && col < bunker.gridWidth && row >= 0 && row < bunker.gridHeight) {
        const idx = row * bunker.gridWidth + col;
        if (bunker.pixels[idx] && bunker.pixels[idx].alive) {
          // Destruct pixel and small radius around it (bullet crater)
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const r = row + dr;
              const c = col + dc;
              if (r >= 0 && r < bunker.gridHeight && c >= 0 && c < bunker.gridWidth) {
                const targetIdx = r * bunker.gridWidth + c;
                if (bunker.pixels[targetIdx]) {
                  bunker.pixels[targetIdx].alive = false;
                }
              }
            }
          }
          this.particles.emitLaserImpactSparks(p.x, p.y, '#22c55e');
          return true;
        }
      }
    }
    return false;
  }

  private killInvader(inv: Invader, index: number, shooter: PlayerShip) {
    this.invaders.splice(index, 1);
    this.addScore(inv.points, shooter.id);

    // Combo system
    shooter.combo++;
    shooter.comboTimer = 2500;
    if (shooter.combo >= 5) {
      this.particles.addFloatingText(`COMBO x${shooter.combo}!`, inv.x, inv.y - 12, '#f59e0b');
    }

    const isBoss = inv.type === 'BOSS_CORE';
    soundEngine.playExplosion(isBoss ? 'boss' : 'small');
    this.particles.emitExplosion(inv.x + inv.width / 2, inv.y + inv.height / 2, inv.color, isBoss ? 60 : 18, isBoss ? 'boss' : 'small');

    // Spawn power-up
    const ddaDropChance = this.cognitive.currentDifficulty.powerupDropChance;
    const pw = WeaponSystem.spawnPowerUp(inv.x + inv.width / 2 - 12, inv.y + inv.height / 2 - 12, ddaDropChance);
    if (pw) {
      this.powerUps.push(pw);
    }
  }

  private collectPowerUp(pw: PowerUpItem, player: PlayerShip) {
    soundEngine.playPowerUp();
    this.particles.emitLaserImpactSparks(pw.x, pw.y, pw.color);

    switch (pw.type) {
      case 'UPGRADE_WEAPON': {
        const weaponCycle: typeof player.weaponType[] = [
          'DOUBLE_CANNON',
          'SPREAD_SHOT',
          'PLASMA_PIERCER',
          'HOMING_MISSILES',
          'RAPID_OVERCLOCK',
        ];
        const nextIdx = (weaponCycle.indexOf(player.weaponType) + 1) % weaponCycle.length;
        player.weaponType = weaponCycle[nextIdx];
        player.weaponLevel = Math.min(3, player.weaponLevel + 1);
        this.particles.addFloatingText(`ARMA: ${player.weaponType}`, player.x, player.y - 25, pw.color);
        break;
      }
      case 'SHIELD_RECHARGE': {
        player.shield = player.maxShield;
        this.particles.addFloatingText('ESCUDO RESTAURADO', player.x, player.y - 25, pw.color);
        break;
      }
      case 'EMP_BOMB': {
        player.empCount = Math.min(3, player.empCount + 1);
        this.particles.addFloatingText('+1 PULSO EMP', player.x, player.y - 25, pw.color);
        break;
      }
      case 'CHRONO_WARP': {
        this.chronoWarpTimer = 7000;
        soundEngine.playTimeWarp();
        this.particles.addFloatingText('DISTORSIÓN CRONO 7s', this.width / 2, this.height * 0.45, pw.color);
        break;
      }
      case 'EXTRA_LIFE': {
        player.lives++;
        this.particles.addFloatingText('+1 VIDA EXTRA', player.x, player.y - 25, pw.color);
        break;
      }
      case 'SCORE_MULTIPLIER': {
        this.addScore(2500, player.id);
        this.particles.addFloatingText('+2500 PTS', player.x, player.y - 25, pw.color);
        break;
      }
    }
  }

  private addScore(amount: number, playerIndex: 1 | 2 = 1) {
    const player = playerIndex === 1 ? this.p1 : this.p2 || this.p1;
    const comboMult = 1 + (player.combo * 0.1);
    const timeAttackMult = this.mode === 'timeattack' ? 1.5 : 1.0;
    const finalPoints = Math.round(amount * comboMult * timeAttackMult);

    player.score += finalPoints;
    this.score += finalPoints;
  }

  private onWaveCleared() {
    this.wave++;
    this.onWaveComplete?.(this.wave);
    this.loadWave(this.wave);
  }

  public fireWeapon(playerIndex: 1 | 2 = 1) {
    const player = playerIndex === 1 ? this.p1 : this.p2;
    if (!player || player.lives <= 0) return;

    const now = performance.now();
    const fireInterval = WeaponSystem.getFireInterval(player.weaponType);

    if (now - player.lastFireTime < fireInterval) return;
    player.lastFireTime = now;
    player.shotsFired++;

    this.cognitive.recordAction();

    // Check if player is aligned with any invader to measure calculated accuracy vs panic spam
    const isAligned = this.invaders.some(
      (inv) => Math.abs(inv.x + inv.width / 2 - (player.x + player.width / 2)) < 30
    );
    this.cognitive.recordShot(isAligned);

    const newProjectiles = WeaponSystem.createPlayerProjectiles(player);
    this.projectiles.push(...newProjectiles);
    soundEngine.playLaser(player.weaponType);
  }

  public setPlayerInput(playerIndex: 1 | 2, x: number, y: number) {
    const player = playerIndex === 1 ? this.p1 : this.p2;
    if (!player) return;
    player.targetVx = Math.max(-1, Math.min(1, x));
    player.targetVy = Math.max(-1, Math.min(1, y));
    this.cognitive.recordAction();
  }

  public endGame() {
    this.isGameOver = true;
    this.isRunning = false;
    soundEngine.stopMusic();

    const totalShots = this.p1.shotsFired + (this.p2?.shotsFired || 0);
    const totalHits = this.p1.shotsHit + (this.p2?.shotsHit || 0);
    const accuracy = totalShots > 0 ? Math.min(100, Math.round((totalHits / totalShots) * 100)) : 0;

    this.onGameOver?.({
      score: this.score,
      wave: this.wave,
      accuracy,
      mode: this.mode,
    });
  }

  // --- RENDERING ---

  public render() {
    const ctx = this.ctx;

    // 1. Wipe the entire canvas clean FIRST before any transform to prevent ghosting/clones
    ctx.save();
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Screen shake transform
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // 3. Cosmic Background (Nebula & Parallax Stars)
    this.particles.render(ctx);

    // 4. Destructible Bunkers
    this.renderBunkers(ctx);

    // 5. Invaders
    this.renderInvaders(ctx);

    // 6. Mystery UFO
    if (this.mysteryUfo) {
      this.renderUfo(ctx, this.mysteryUfo);
    }

    // 7. Power-Up crates
    this.renderPowerUps(ctx);

    // 8. Projectiles with laser bloom
    this.renderProjectiles(ctx);

    // 9. Players
    if (this.p1.lives > 0) this.renderPlayer(ctx, this.p1);
    if (this.p2 && this.p2.lives > 0) this.renderPlayer(ctx, this.p2);

    // 10. Screen Flash on hit or EMP
    if (this.screenFlashAlpha > 0) {
      ctx.fillStyle = this.screenFlashColor;
      ctx.globalAlpha = this.screenFlashAlpha;
      ctx.fillRect(-20, -20, this.width + 40, this.height + 40);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, player: PlayerShip) {
    ctx.save();
    const cx = Math.round(player.x + player.width / 2);
    const cy = Math.round(player.y + player.height / 2);
    ctx.translate(cx, cy);
    ctx.rotate(player.tiltAngle);

    // Invulnerability blink: never disappear completely, show pulsing shield luminescence
    if (player.invulnerableTimer > 0) {
      const blinkPhase = Math.floor(player.invulnerableTimer / 120) % 2;
      ctx.globalAlpha = blinkPhase === 0 ? 0.65 : 1.0;

      // Protective cyan resonance ring
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, player.width * 0.68, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Shield Dome Glow
    if (player.shield > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + (player.shield / player.maxShield) * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, player.width * 0.72, player.height * 0.72, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Pixel Art Retro Ship Model
    const w = player.width;
    const h = player.height;
    const hw = w / 2;
    const hh = h / 2;

    ctx.fillStyle = player.color;

    // Fuselage / Wings
    ctx.beginPath();
    ctx.moveTo(0, -hh); // Nose
    ctx.lineTo(hw - 4, hh - 4); // Right wing tip
    ctx.lineTo(hw - 10, hh);
    ctx.lineTo(4, hh - 6);
    ctx.lineTo(-4, hh - 6);
    ctx.lineTo(-hw + 10, hh);
    ctx.lineTo(-hw + 4, hh - 4); // Left wing tip
    ctx.closePath();
    ctx.fill();

    // Wing highlights
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -hh + 8, 4, 10);

    // Cockpit neon canopy
    ctx.fillStyle = player.secondaryColor;
    ctx.beginPath();
    ctx.ellipse(0, -hh + 12, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player badge (P1 / P2)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`P${player.id}`, 0, hh + 12);

    ctx.restore();
  }

  private renderInvaders(ctx: CanvasRenderingContext2D) {
    for (const inv of this.invaders) {
      ctx.save();
      ctx.translate(Math.round(inv.x), Math.round(inv.y));
      ctx.fillStyle = inv.color;

      if (inv.type === 'BOSS_CORE') {
        // Giant Boss Core with glowing rings
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(8, 8, inv.width - 16, inv.height - 16);

        // Core eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(inv.width / 2, inv.height / 2, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(inv.width / 2, inv.height / 2, 6, 0, Math.PI * 2);
        ctx.fill();

        // Boss health bar above
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, -10, inv.width, 6);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(0, -10, inv.width * (inv.health / inv.maxHealth), 6);
      } else {
        // Authentic pixel art sprite rendering for Invader classes
        this.renderInvaderSprite(ctx, inv);
      }

      ctx.restore();
    }
  }

  private renderInvaderSprite(ctx: CanvasRenderingContext2D, inv: Invader) {
    const pw = inv.width / 8;
    const ph = inv.height / 6;

    // Classic 8x6 pixel matrices for retro invaders
    const sprites: number[][][] = [
      // Scout (Type 0)
      [
        [0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 0, 1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 0, 0, 0, 0, 1, 0],
      ],
      // Cruiser (Type 1)
      [
        [0, 1, 0, 0, 0, 0, 1, 0],
        [0, 0, 1, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 0, 1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 0, 1, 0, 1],
      ],
      // Commander (Type 2)
      [
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 0, 1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0, 1, 0, 0],
      ],
      // Dreadnought (Type 3)
      [
        [1, 1, 0, 0, 0, 0, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 0, 1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 0, 1, 1, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 0, 1],
      ],
    ];

    const sprite = sprites[inv.spriteIndex % sprites.length] || sprites[0];

    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 8; c++) {
        if (sprite[r][c] === 1) {
          ctx.fillRect(c * pw, r * ph, pw, ph);
        }
      }
    }
  }

  private renderUfo(ctx: CanvasRenderingContext2D, ufo: Invader) {
    ctx.save();
    ctx.translate(ufo.x, ufo.y);

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
    ctx.shadowBlur = 12;

    // Classic saucer shape
    ctx.beginPath();
    ctx.ellipse(ufo.width / 2, ufo.height / 2, ufo.width / 2, ufo.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dome
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(ufo.width / 2, ufo.height / 2 - 4, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flashing signal lights
    const colors = ['#ffffff', '#38bdf8', '#fbbf24'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[(Math.floor(Date.now() / 150) + i) % colors.length];
      ctx.fillRect(8 + i * 9, ufo.height / 2 + 2, 3, 3);
    }

    ctx.restore();
  }

  private renderPowerUps(ctx: CanvasRenderingContext2D) {
    for (const pw of this.powerUps) {
      ctx.save();
      ctx.translate(pw.x, pw.y);

      // Oscillating hover glow
      const glowScale = 1 + Math.sin(Date.now() * 0.008) * 0.15;
      ctx.shadowColor = pw.color;
      ctx.shadowBlur = 14 * glowScale;

      ctx.strokeStyle = pw.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 24, 24);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, 24, 24);

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pw.icon, 12, 12);

      ctx.restore();
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.projectiles) {
      if (p.isHoming && p.trailHistory) {
        // Missile smoke trail
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        p.trailHistory.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      }

      // Outer laser beam
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 3);
      ctx.fill();

      // Bright white-hot laser energy core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(p.x + 1, p.y + 1, Math.max(1, p.width - 2), Math.max(2, p.height - 2), 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderBunkers(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = '#22c55e';

    for (const bunker of this.bunkers) {
      const pw = bunker.width / bunker.gridWidth;
      const ph = bunker.height / bunker.gridHeight;
      const bx = Math.round(bunker.x);
      const by = Math.round(bunker.y);

      for (let r = 0; r < bunker.gridHeight; r++) {
        for (let c = 0; c < bunker.gridWidth; c++) {
          const idx = r * bunker.gridWidth + c;
          const pixel = bunker.pixels[idx];
          if (pixel && pixel.alive) {
            ctx.fillRect(bx + c * pw, by + r * ph, pw, ph);
          }
        }
      }
    }
    ctx.restore();
  }

  private rectOverlap(
    x1: number,
    y1: number,
    w1: number,
    h1: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number
  ): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  public destroy() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    soundEngine.stopMusic();
  }
}
