/**
 * Space Invaders: Neon Assault 90s - Cognitive Behavioral Performance Analyzer
 * Measures reaction latency, decision accuracy, spatial evasion, and dynamically modulates difficulty.
 */

import { CognitiveMetrics, DynamicDifficulty, PlayerShip, Projectile } from '../types';

export class CognitiveAnalyzer {
  private reactionSamples: number[] = [];
  private inputTimestamps: number[] = [];
  private evasionAttempts: number = 0;
  private evasionsSuccess: number = 0;
  private hitsTaken: number = 0;
  private panicBurstCount: number = 0;
  private lastThreatDetectTime: number = 0;
  private isThreatActive: boolean = false;
  private initialThreatX: number = 0;

  // Dynamic difficulty tuners
  public currentDifficulty: DynamicDifficulty = {
    alienSpeedMultiplier: 1.0,
    alienFireRateMultiplier: 1.0,
    bulletSpeedMultiplier: 1.0,
    powerupDropChance: 1.0,
    mysteryUfoIntervalSeconds: 30,
    diveBombFrequency: 1.0,
  };

  public recordAction() {
    const now = performance.now();
    this.inputTimestamps.push(now);
    // Keep only last 60 seconds
    const cutoff = now - 60000;
    while (this.inputTimestamps.length > 0 && this.inputTimestamps[0] < cutoff) {
      this.inputTimestamps.shift();
    }
  }

  public detectThreatProximity(player: PlayerShip, enemyBullets: Projectile[]) {
    const now = performance.now();
    const dangerZoneRadius = 140;

    let nearestThreatDist = 9999;
    let imminentBullet: Projectile | null = null;

    for (const b of enemyBullets) {
      if (b.isPlayer) continue;
      const dx = b.x - (player.x + player.width / 2);
      const dy = b.y - player.y;

      // Only consider bullets traveling toward player from above
      if (dy > -dangerZoneRadius && dy < 40 && Math.abs(dx) < 70 && b.vy > 0) {
        const dist = Math.hypot(dx, dy);
        if (dist < nearestThreatDist) {
          nearestThreatDist = dist;
          imminentBullet = b;
        }
      }
    }

    if (imminentBullet && !this.isThreatActive) {
      this.isThreatActive = true;
      this.lastThreatDetectTime = now;
      this.initialThreatX = player.x;
      this.evasionAttempts++;
    } else if (!imminentBullet && this.isThreatActive) {
      // Threat passed without hitting player
      const evasionLatency = now - this.lastThreatDetectTime;
      if (evasionLatency > 50 && evasionLatency < 1200) {
        this.reactionSamples.push(evasionLatency);
        if (this.reactionSamples.length > 20) this.reactionSamples.shift();
      }

      const movedDist = Math.abs(player.x - this.initialThreatX);
      if (movedDist > 15) {
        this.evasionsSuccess++;
      }
      this.isThreatActive = false;
    }
  }

  public recordHit() {
    this.hitsTaken++;
    this.isThreatActive = false;
  }

  public recordShot(wasAligned: boolean) {
    if (!wasAligned) {
      this.panicBurstCount++;
    }
  }

  public computeMetrics(p1: PlayerShip, p2?: PlayerShip): CognitiveMetrics {
    const avgReactionTimeMs = this.reactionSamples.length > 0
      ? Math.round(this.reactionSamples.reduce((a, b) => a + b, 0) / this.reactionSamples.length)
      : 280;

    const totalEvasions = Math.max(1, this.evasionAttempts);
    const evasionEfficiency = Math.min(100, Math.round((this.evasionsSuccess / totalEvasions) * 100));

    const totalShots = (p1.shotsFired || 0) + (p2?.shotsFired || 0);
    const totalHits = (p1.shotsHit || 0) + (p2?.shotsHit || 0);
    const accuracy = totalShots > 0 ? Math.min(100, Math.round((totalHits / totalShots) * 100)) : 70;

    const apm = this.inputTimestamps.length; // inputs in last 60s
    const panicFiringRatio = totalShots > 0 ? Math.min(100, Math.round((this.panicBurstCount / totalShots) * 100)) : 10;

    // Stress index calculated from low shield/health, high APM panic, and recent hits
    const healthStress = ((1 - (p1.health / p1.maxHealth)) * 40) + ((1 - (p1.shield / p1.maxShield)) * 20);
    const hitStress = Math.min(30, this.hitsTaken * 5);
    const stressIndex = Math.min(100, Math.round(healthStress + hitStress + (panicFiringRatio * 0.4)));

    let flowStateRating: 'Sobrecargado' | 'En Flujo Óptimo' | 'Dominio Absoluto';
    if (stressIndex > 65 || (accuracy < 40 && this.hitsTaken > 3)) {
      flowStateRating = 'Sobrecargado';
    } else if (accuracy > 75 && avgReactionTimeMs < 240 && evasionEfficiency > 75) {
      flowStateRating = 'Dominio Absoluto';
    } else {
      flowStateRating = 'En Flujo Óptimo';
    }

    let ninetyStyleArchetype = 'Piloto de Flujo Armónico (Estilo Gradius 1990)';
    if (avgReactionTimeMs < 230 && accuracy > 80) {
      ninetyStyleArchetype = 'Estratega Hipercinético (Estilo R-Type / Contra)';
    } else if (evasionEfficiency > 85) {
      ninetyStyleArchetype = 'Maestro de Evasión Vectorial (Estilo Asteroids / Defender)';
    } else if (panicFiringRatio > 35) {
      ninetyStyleArchetype = 'Respondedor Táctico Bajo Presión (Estilo 1978 Arcade)';
    } else if (accuracy > 85) {
      ninetyStyleArchetype = 'Francotirador de Alta Precisión (Estilo Galaga 1981)';
    }

    // Adapt dynamic difficulty according to cognitive state
    this.adjustDifficulty(flowStateRating, avgReactionTimeMs, accuracy);

    return {
      reactionTimes: [...this.reactionSamples],
      avgReactionTimeMs,
      evasionEfficiency,
      accuracy,
      panicFiringRatio,
      stressIndex,
      actionsPerMinute: apm,
      flowStateRating,
      ninetyStyleArchetype,
      recentEvasions: this.evasionsSuccess,
      recentHitsTaken: this.hitsTaken,
    };
  }

  private adjustDifficulty(flow: 'Sobrecargado' | 'En Flujo Óptimo' | 'Dominio Absoluto', reactionMs: number, accuracy: number) {
    if (flow === 'Dominio Absoluto') {
      this.currentDifficulty = {
        alienSpeedMultiplier: 1.25,
        alienFireRateMultiplier: 1.3,
        bulletSpeedMultiplier: 1.15,
        powerupDropChance: 0.85,
        mysteryUfoIntervalSeconds: 18,
        diveBombFrequency: 1.4,
      };
    } else if (flow === 'Sobrecargado') {
      this.currentDifficulty = {
        alienSpeedMultiplier: 0.82,
        alienFireRateMultiplier: 0.8,
        bulletSpeedMultiplier: 0.85,
        powerupDropChance: 1.45, // Assist the struggling player
        mysteryUfoIntervalSeconds: 40,
        diveBombFrequency: 0.6,
      };
    } else {
      // Balanced standard progression
      this.currentDifficulty = {
        alienSpeedMultiplier: 1.0 + (accuracy > 70 ? 0.08 : 0),
        alienFireRateMultiplier: 1.0 + (reactionMs < 260 ? 0.1 : 0),
        bulletSpeedMultiplier: 1.0,
        powerupDropChance: 1.0,
        mysteryUfoIntervalSeconds: 28,
        diveBombFrequency: 1.0,
      };
    }
  }

  public reset() {
    this.reactionSamples = [];
    this.inputTimestamps = [];
    this.evasionAttempts = 0;
    this.evasionsSuccess = 0;
    this.hitsTaken = 0;
    this.panicBurstCount = 0;
    this.isThreatActive = false;
  }
}
