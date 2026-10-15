/**
 * Space Invaders: Neon Assault 90s - 90s Classic Platformer & Arcade Stages
 */

import { Invader, InvaderType } from '../types';

export interface StageDefinition {
  title: string;
  gameInspiration: string;
  backgroundTheme: string;
  musicMood: 'retro' | 'tense' | 'panic' | 'boss';
  alienSpeed: number;
  fireRate: number;
  diveChance: number;
  formationType: 'classic_grid' | 'v_swoop' | 'gradius_columns' | 'contra_hive' | 'boss_core' | 'megaman_staircase';
  invaders: Invader[];
  bossHp?: number;
}

export class LevelFactory {
  public static createStage(wave: number, canvasWidth: number, _canvasHeight: number): StageDefinition {
    const stageIndex = ((wave - 1) % 6) + 1;
    const loopMultiplier = Math.floor((wave - 1) / 6);
    const speedBonus = loopMultiplier * 0.35;
    const hpBonus = loopMultiplier * 2;

    switch (stageIndex) {
      case 1:
        return this.createClassicInvadersPhalanx(wave, canvasWidth, speedBonus, hpBonus);
      case 2:
        return this.createGalagaSwoopWave(wave, canvasWidth, speedBonus, hpBonus);
      case 3:
        return this.createGradiusEscortFlank(wave, canvasWidth, speedBonus, hpBonus);
      case 4:
        return this.createContraAlienHive(wave, canvasWidth, speedBonus, hpBonus);
      case 5:
        return this.createRTypeBydoCoreBoss(wave, canvasWidth, speedBonus, hpBonus);
      case 6:
        return this.createMegaManCitadel(wave, canvasWidth, speedBonus, hpBonus);
      default:
        return this.createClassicInvadersPhalanx(wave, canvasWidth, speedBonus, hpBonus);
    }
  }

  private static createClassicInvadersPhalanx(wave: number, width: number, speedBonus: number, hpBonus: number): StageDefinition {
    const invaders: Invader[] = [];
    const rows = 5;
    const cols = 10;
    const spacingX = Math.min(52, (width - 120) / cols);
    const spacingY = 38;
    const startX = (width - cols * spacingX) / 2;
    const startY = 80;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type: InvaderType = 'SCOUT';
        let color = '#22c55e';
        let glowColor = 'rgba(34, 197, 94, 0.8)';
        let baseHp = 1 + hpBonus;
        let points = 50;

        if (r === 0) {
          type = 'COMMANDER';
          color = '#ec4899';
          glowColor = 'rgba(236, 72, 153, 0.8)';
          baseHp = 3 + hpBonus;
          points = 200;
        } else if (r <= 2) {
          type = 'CRUISER';
          color = '#38bdf8';
          glowColor = 'rgba(56, 189, 248, 0.8)';
          baseHp = 2 + hpBonus;
          points = 100;
        }

        invaders.push({
          id: `inv-${r}-${c}`,
          type,
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          originX: startX + c * spacingX,
          originY: startY + r * spacingY,
          vx: 1.0 + speedBonus,
          vy: 0,
          width: 32,
          height: 24,
          health: baseHp,
          maxHealth: baseHp,
          points,
          color,
          glowColor,
          spriteIndex: r % 3,
          attackCooldown: 100 + Math.random() * 300,
          row: r,
          col: c,
        });
      }
    }

    return {
      title: `FASE ${wave}: PHALANX CLÁSICO 1978`,
      gameInspiration: 'Space Invaders Clásico (Taito 1978/1990)',
      backgroundTheme: 'Deep Space Grid',
      musicMood: 'retro',
      alienSpeed: 1.2 + speedBonus,
      fireRate: 1.0 + speedBonus * 0.5,
      diveChance: 0.05,
      formationType: 'classic_grid',
      invaders,
    };
  }

  private static createGalagaSwoopWave(wave: number, width: number, speedBonus: number, hpBonus: number): StageDefinition {
    const invaders: Invader[] = [];
    // V-Formation shaped like Galaga attack wing
    const wings = [
      { colOffset: 0, rowOffset: 0, type: 'COMMANDER' as InvaderType, color: '#f59e0b', hp: 4 },
      { colOffset: -1, rowOffset: 1, type: 'CRUISER' as InvaderType, color: '#ec4899', hp: 3 },
      { colOffset: 1, rowOffset: 1, type: 'CRUISER' as InvaderType, color: '#ec4899', hp: 3 },
      { colOffset: -2, rowOffset: 2, type: 'CRUISER' as InvaderType, color: '#a855f7', hp: 2 },
      { colOffset: 2, rowOffset: 2, type: 'CRUISER' as InvaderType, color: '#a855f7', hp: 2 },
      { colOffset: -3, rowOffset: 3, type: 'SCOUT' as InvaderType, color: '#06b6d4', hp: 1 },
      { colOffset: 3, rowOffset: 3, type: 'SCOUT' as InvaderType, color: '#06b6d4', hp: 1 },
      { colOffset: -4, rowOffset: 4, type: 'SCOUT' as InvaderType, color: '#10b981', hp: 1 },
      { colOffset: 4, rowOffset: 4, type: 'SCOUT' as InvaderType, color: '#10b981', hp: 1 },
    ];

    const centerX = width / 2;
    const startY = 70;
    const stepX = 42;
    const stepY = 32;

    // Center wing
    wings.forEach((w, idx) => {
      const x = centerX + w.colOffset * stepX - 16;
      const y = startY + w.rowOffset * stepY;
      invaders.push({
        id: `gala-c-${idx}`,
        type: w.type,
        x,
        y,
        originX: x,
        originY: y,
        vx: 1.4 + speedBonus,
        vy: 0,
        width: 32,
        height: 24,
        health: w.hp + hpBonus,
        maxHealth: w.hp + hpBonus,
        points: w.hp * 100,
        color: w.color,
        glowColor: `${w.color}cc`,
        spriteIndex: idx % 3,
        attackCooldown: 90 + Math.random() * 200,
        row: w.rowOffset,
        col: w.colOffset,
        diveAngle: 0,
      });
    });

    // Flanking rear scouts
    for (let c = -5; c <= 5; c++) {
      if (Math.abs(c) < 2) continue;
      const x = centerX + c * stepX - 16;
      const y = startY + 5 * stepY;
      invaders.push({
        id: `gala-f-${c}`,
        type: 'SCOUT',
        x,
        y,
        originX: x,
        originY: y,
        vx: 1.4 + speedBonus,
        vy: 0,
        width: 32,
        height: 24,
        health: 1 + hpBonus,
        maxHealth: 1 + hpBonus,
        points: 75,
        color: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.8)',
        spriteIndex: 1,
        attackCooldown: 120 + Math.random() * 250,
        row: 5,
        col: c,
      });
    }

    return {
      title: `FASE ${wave}: SWOOP DESTRUCTOR GALAGA`,
      gameInspiration: 'Galaga Arcade (Namco 1981/1990s)',
      backgroundTheme: 'Hyper-Warp Neon',
      musicMood: 'tense',
      alienSpeed: 1.5 + speedBonus,
      fireRate: 1.3 + speedBonus * 0.5,
      diveChance: 0.25, // Higher dive bombing chance!
      formationType: 'v_swoop',
      invaders,
    };
  }

  private static createGradiusEscortFlank(wave: number, width: number, speedBonus: number, hpBonus: number): StageDefinition {
    const invaders: Invader[] = [];
    const cols = 8;
    const rows = 4;
    const spacingX = Math.min(55, (width - 140) / cols);
    const startX = (width - cols * spacingX) / 2;
    const startY = 75;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Dual column dreadnoughts in center
        const isCenterArmored = (c === 3 || c === 4) && r <= 1;
        const type: InvaderType = isCenterArmored ? 'DREADNOUGHT' : r === 0 ? 'COMMANDER' : 'CRUISER';
        const color = isCenterArmored ? '#ef4444' : r === 0 ? '#f59e0b' : '#3b82f6';
        const hp = (isCenterArmored ? 6 : r === 0 ? 3 : 2) + hpBonus;

        invaders.push({
          id: `gradius-${r}-${c}`,
          type,
          x: startX + c * spacingX,
          y: startY + r * 42,
          originX: startX + c * spacingX,
          originY: startY + r * 42,
          vx: 1.3 + speedBonus,
          vy: 0,
          width: isCenterArmored ? 38 : 32,
          height: isCenterArmored ? 28 : 24,
          health: hp,
          maxHealth: hp,
          points: hp * 120,
          color,
          glowColor: `${color}cc`,
          spriteIndex: isCenterArmored ? 3 : r % 3,
          attackCooldown: 80 + Math.random() * 220,
          row: r,
          col: c,
          shield: isCenterArmored ? 2 : 0,
        });
      }
    }

    return {
      title: `FASE ${wave}: BARRERA BACTERION GRADIUS`,
      gameInspiration: 'Gradius III / IV (Konami 1990)',
      backgroundTheme: 'Asteroid Field',
      musicMood: 'tense',
      alienSpeed: 1.4 + speedBonus,
      fireRate: 1.4 + speedBonus * 0.6,
      diveChance: 0.15,
      formationType: 'gradius_columns',
      invaders,
    };
  }

  private static createContraAlienHive(wave: number, width: number, speedBonus: number, hpBonus: number): StageDefinition {
    const invaders: Invader[] = [];
    // Cross / Hive pattern
    const rows = 5;
    const cols = 9;
    const spacingX = Math.min(54, (width - 120) / cols);
    const startX = (width - cols * spacingX) / 2;
    const startY = 80;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Checkerboard / cross hive layout
        if ((r + c) % 2 !== 0 && !(r === 2 && c === 4)) continue;

        const isHeart = r === 2 && c === 4;
        const type: InvaderType = isHeart ? 'COMMANDER' : r <= 1 ? 'DREADNOUGHT' : 'SCOUT';
        const color = isHeart ? '#fb7185' : isHeart ? '#e11d48' : '#a855f7';
        const hp = (isHeart ? 8 : type === 'DREADNOUGHT' ? 4 : 2) + hpBonus;

        invaders.push({
          id: `contra-${r}-${c}`,
          type,
          x: startX + c * spacingX,
          y: startY + r * 38,
          originX: startX + c * spacingX,
          originY: startY + r * 38,
          vx: 1.6 + speedBonus,
          vy: 0,
          width: isHeart ? 44 : 32,
          height: isHeart ? 30 : 24,
          health: hp,
          maxHealth: hp,
          points: hp * 150,
          color,
          glowColor: `${color}dd`,
          spriteIndex: isHeart ? 4 : r % 3,
          attackCooldown: 70 + Math.random() * 180,
          row: r,
          col: c,
        });
      }
    }

    return {
      title: `FASE ${wave}: COLMENA RED FALCON CONTRA`,
      gameInspiration: 'Contra III: Alien Wars (Konami 1992)',
      backgroundTheme: 'Bio-Organic Hive',
      musicMood: 'panic',
      alienSpeed: 1.7 + speedBonus,
      fireRate: 1.8 + speedBonus * 0.7,
      diveChance: 0.3,
      formationType: 'contra_hive',
      invaders,
    };
  }

  private static createRTypeBydoCoreBoss(wave: number, width: number, speedBonus: number, hpBonus: number): StageDefinition {
    const invaders: Invader[] = [];
    const bossHp = 45 + hpBonus * 8;
    const centerX = width / 2;

    // The giant Bydo Core Boss in center
    invaders.push({
      id: `rtype-boss-core`,
      type: 'BOSS_CORE',
      x: centerX - 50,
      y: 80,
      originX: centerX - 50,
      originY: 80,
      vx: 1.5 + speedBonus,
      vy: 0,
      width: 100,
      height: 60,
      health: bossHp,
      maxHealth: bossHp,
      points: 5000,
      color: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.95)',
      spriteIndex: 5,
      attackCooldown: 40,
      row: 0,
      col: 0,
      shield: 10 + hpBonus * 2,
    });

    // Orbiting / protecting escort drones
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 90;
      const x = centerX + Math.cos(angle) * radius - 16;
      const y = 110 + Math.sin(angle) * (radius * 0.6);

      invaders.push({
        id: `rtype-escort-${i}`,
        type: 'COMMANDER',
        x,
        y,
        originX: x,
        originY: y,
        vx: 1.5 + speedBonus,
        vy: 0,
        width: 32,
        height: 24,
        health: 3 + hpBonus,
        maxHealth: 3 + hpBonus,
        points: 250,
        color: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.8)',
        spriteIndex: i % 3,
        attackCooldown: 70 + Math.random() * 150,
        row: 1,
        col: i,
      });
    }

    return {
      title: `FASE ${wave}: ENCLAVE BYDO R-TYPE`,
      gameInspiration: 'R-Type Final / Super R-Type (Irem 1991)',
      backgroundTheme: 'Biomechanical Core Void',
      musicMood: 'boss',
      alienSpeed: 1.3 + speedBonus,
      fireRate: 2.2 + speedBonus * 0.8,
      diveChance: 0.1,
      formationType: 'boss_core',
      invaders,
      bossHp,
    };
  }

  private static createMegaManCitadel(wave: number, width: number, speedBonus: number, hpBonus: number): StageDefinition {
    const invaders: Invader[] = [];
    const steps = 7;
    const stepWidth = Math.min(50, (width - 140) / steps);
    const startX = (width - steps * stepWidth) / 2;

    // Diagonal stepped staircase platform hazard
    for (let s = 0; s < steps; s++) {
      for (let stack = 0; stack < 3; stack++) {
        const x = startX + s * stepWidth;
        const y = 80 + s * 18 + stack * 34;
        const isApex = s === 3;
        const type: InvaderType = isApex ? 'DREADNOUGHT' : stack === 0 ? 'COMMANDER' : 'CRUISER';
        const color = isApex ? '#eab308' : stack === 0 ? '#06b6d4' : '#8b5cf6';
        const hp = (isApex ? 5 : 2) + hpBonus;

        invaders.push({
          id: `megaman-${s}-${stack}`,
          type,
          x,
          y,
          originX: x,
          originY: y,
          vx: 1.5 + speedBonus,
          vy: 0,
          width: 32,
          height: 24,
          health: hp,
          maxHealth: hp,
          points: hp * 110,
          color,
          glowColor: `${color}cc`,
          spriteIndex: s % 3,
          attackCooldown: 80 + Math.random() * 200,
          row: stack,
          col: s,
        });
      }
    }

    return {
      title: `FASE ${wave}: FORTALEZA WILY MEGA MAN`,
      gameInspiration: 'Mega Man X / Classic (Capcom 1993)',
      backgroundTheme: 'Neon Circuit Citadel',
      musicMood: 'panic',
      alienSpeed: 1.6 + speedBonus,
      fireRate: 1.7 + speedBonus * 0.7,
      diveChance: 0.2,
      formationType: 'megaman_staircase',
      invaders,
    };
  }
}
