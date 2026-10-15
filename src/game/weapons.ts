/**
 * Space Invaders: Neon Assault 90s - Weapon Systems & Power-Ups
 */

import { PlayerShip, Projectile, PowerUpItem, PowerUpType, WeaponType, Invader } from '../types';

export class WeaponSystem {
  public static createPlayerProjectiles(player: PlayerShip): Projectile[] {
    const projectiles: Projectile[] = [];
    const now = Date.now();
    const isP1 = player.id === 1;
    const baseColor = isP1 ? '#06b6d4' : '#ec4899';
    const glowColor = isP1 ? 'rgba(6, 182, 212, 0.8)' : 'rgba(236, 72, 153, 0.8)';

    switch (player.weaponType) {
      case 'SINGLE': {
        projectiles.push({
          id: `p-${player.id}-${now}-0`,
          x: player.x + player.width / 2 - 2,
          y: player.y - 10,
          vx: player.vx * 0.15,
          vy: -13,
          width: 4,
          height: 14,
          color: baseColor,
          glowColor,
          isPlayer: true,
          playerIndex: player.id,
          damage: 1,
        });
        break;
      }

      case 'DOUBLE_CANNON': {
        projectiles.push(
          {
            id: `p-${player.id}-${now}-1`,
            x: player.x + 4,
            y: player.y - 8,
            vx: player.vx * 0.12,
            vy: -14,
            width: 4,
            height: 16,
            color: '#38bdf8',
            glowColor: 'rgba(56, 189, 248, 0.8)',
            isPlayer: true,
            playerIndex: player.id,
            damage: 1.2,
          },
          {
            id: `p-${player.id}-${now}-2`,
            x: player.x + player.width - 8,
            y: player.y - 8,
            vx: player.vx * 0.12,
            vy: -14,
            width: 4,
            height: 16,
            color: '#38bdf8',
            glowColor: 'rgba(56, 189, 248, 0.8)',
            isPlayer: true,
            playerIndex: player.id,
            damage: 1.2,
          }
        );
        break;
      }

      case 'SPREAD_SHOT': {
        const spreadAngles = player.weaponLevel >= 2 ? [-0.35, -0.18, 0, 0.18, 0.35] : [-0.22, 0, 0.22];
        spreadAngles.forEach((angle, idx) => {
          const speed = 12.5;
          projectiles.push({
            id: `p-${player.id}-${now}-${idx}`,
            x: player.x + player.width / 2 - 3,
            y: player.y - 8,
            vx: Math.sin(angle) * speed + player.vx * 0.1,
            vy: -Math.cos(angle) * speed,
            width: 6,
            height: 12,
            color: '#f59e0b',
            glowColor: 'rgba(245, 158, 11, 0.8)',
            isPlayer: true,
            playerIndex: player.id,
            damage: 1.0,
          });
        });
        break;
      }

      case 'PLASMA_PIERCER': {
        projectiles.push({
          id: `p-${player.id}-${now}-pierce`,
          x: player.x + player.width / 2 - 5,
          y: player.y - 18,
          vx: 0,
          vy: -16,
          width: 10,
          height: 32,
          color: '#a855f7',
          glowColor: 'rgba(168, 85, 247, 0.9)',
          isPlayer: true,
          playerIndex: player.id,
          damage: 3.0,
          piercing: true,
        });
        break;
      }

      case 'HOMING_MISSILES': {
        // Spawn 2 micro-missiles angled slightly left and right
        [-1, 1].forEach((dir, idx) => {
          projectiles.push({
            id: `p-${player.id}-${now}-missile-${idx}`,
            x: player.x + (dir === -1 ? 6 : player.width - 10),
            y: player.y - 4,
            vx: dir * 3,
            vy: -6,
            width: 6,
            height: 12,
            color: '#10b981',
            glowColor: 'rgba(16, 185, 129, 0.85)',
            isPlayer: true,
            playerIndex: player.id,
            damage: 2.2,
            isHoming: true,
            trailHistory: [],
          });
        });
        break;
      }

      case 'RAPID_OVERCLOCK': {
        // High speed laser stream
        projectiles.push({
          id: `p-${player.id}-${now}-rapid`,
          x: player.x + player.width / 2 - 3,
          y: player.y - 12,
          vx: player.vx * 0.1,
          vy: -18,
          width: 6,
          height: 20,
          color: '#3b82f6',
          glowColor: 'rgba(59, 130, 246, 0.95)',
          isPlayer: true,
          playerIndex: player.id,
          damage: 1.5,
        });
        break;
      }
    }

    return projectiles;
  }

  public static getFireInterval(weaponType: WeaponType): number {
    switch (weaponType) {
      case 'RAPID_OVERCLOCK':
        return 95; // Extremely rapid
      case 'DOUBLE_CANNON':
        return 160;
      case 'SPREAD_SHOT':
        return 220;
      case 'HOMING_MISSILES':
        return 280;
      case 'PLASMA_PIERCER':
        return 320;
      case 'SINGLE':
      default:
        return 190;
    }
  }

  public static spawnPowerUp(x: number, y: number, dropChanceModifier: number = 1.0): PowerUpItem | null {
    const baseDropChance = 0.16 * dropChanceModifier;
    if (Math.random() > baseDropChance) return null;

    const roll = Math.random();
    let type: PowerUpType;
    let color: string;
    let icon: string;

    if (roll < 0.35) {
      type = 'UPGRADE_WEAPON';
      color = '#06b6d4';
      icon = '⚡';
    } else if (roll < 0.58) {
      type = 'SHIELD_RECHARGE';
      color = '#3b82f6';
      icon = '🛡️';
    } else if (roll < 0.74) {
      type = 'EMP_BOMB';
      color = '#a855f7';
      icon = '💣';
    } else if (roll < 0.88) {
      type = 'CHRONO_WARP';
      color = '#10b981';
      icon = '⏳';
    } else if (roll < 0.96) {
      type = 'SCORE_MULTIPLIER';
      color = '#f59e0b';
      icon = '⭐';
    } else {
      type = 'EXTRA_LIFE';
      color = '#ec4899';
      icon = '❤️';
    }

    return {
      id: `pw-${Date.now()}-${Math.random()}`,
      x,
      y,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 1.4 + Math.random() * 0.6,
      type,
      color,
      icon,
      duration: 10000,
      lifetime: 14000,
    };
  }

  public static updateHomingMissiles(projectiles: Projectile[], invaders: Invader[]) {
    for (const p of projectiles) {
      if (!p.isHoming) continue;

      if (!p.trailHistory) p.trailHistory = [];
      p.trailHistory.push({ x: p.x + p.width / 2, y: p.y + p.height / 2 });
      if (p.trailHistory.length > 5) p.trailHistory.shift();

      // Find closest invader
      let closest: Invader | null = null;
      let minDist = 999999;

      for (const inv of invaders) {
        const dx = inv.x + inv.width / 2 - p.x;
        const dy = inv.y + inv.height / 2 - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist && dy < 50) { // target enemies ahead or level
          minDist = dist;
          closest = inv;
        }
      }

      if (closest) {
        const targetX = closest.x + closest.width / 2;
        const targetY = closest.y + closest.height / 2;
        const angle = Math.atan2(targetY - p.y, targetX - p.x);
        const currentAngle = Math.atan2(p.vy, p.vx);

        // Smooth steering
        let angleDiff = angle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const steerSpeed = 0.12;
        const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), steerSpeed);
        const speed = 12;

        p.vx = Math.cos(newAngle) * speed;
        p.vy = Math.sin(newAngle) * speed;
      }
    }
  }
}
