/**
 * Space Invaders: Neon Assault 90s - Types & Interfaces
 */

export type GameMode = 'classic' | 'timeattack' | 'coop';

export type WeaponType = 
  | 'SINGLE'
  | 'DOUBLE_CANNON'
  | 'SPREAD_SHOT'
  | 'PLASMA_PIERCER'
  | 'HOMING_MISSILES'
  | 'RAPID_OVERCLOCK';

export type PowerUpType =
  | 'UPGRADE_WEAPON'
  | 'SHIELD_RECHARGE'
  | 'EMP_BOMB'
  | 'CHRONO_WARP'
  | 'EXTRA_LIFE'
  | 'SCORE_MULTIPLIER';

export interface PowerUpItem {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: PowerUpType;
  color: string;
  icon: string;
  duration: number; // For active effects
  lifetime: number; // Time left before despawn on screen
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  glowColor: string;
  isPlayer: boolean;
  playerIndex?: 1 | 2;
  damage: number;
  piercing?: boolean;
  isHoming?: boolean;
  targetId?: string;
  trailHistory?: { x: number; y: number }[];
}

export type InvaderType = 'SCOUT' | 'CRUISER' | 'COMMANDER' | 'DREADNOUGHT' | 'MYSTERY_UFO' | 'BOSS_CORE';

export interface Invader {
  id: string;
  type: InvaderType;
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  points: number;
  color: string;
  glowColor: string;
  spriteIndex: number;
  attackCooldown: number;
  row: number;
  col: number;
  isDiving?: boolean;
  diveAngle?: number;
  diveTimer?: number;
  shield?: number;
}

export interface BunkerPixel {
  alive: boolean;
  color: string;
}

export interface Bunker {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  gridWidth: number;
  gridHeight: number;
  pixels: BunkerPixel[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  glow?: boolean;
  shape?: 'circle' | 'square' | 'spark' | 'ring';
  ringRadius?: number;
  ringExpand?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  alpha: number;
  scale: number;
}

export interface PlayerShip {
  id: 1 | 2;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetVx: number;
  targetVy: number;
  width: number;
  height: number;
  tiltAngle: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  lives: number;
  score: number;
  weaponType: WeaponType;
  weaponLevel: number;
  empCount: number;
  lastFireTime: number;
  invulnerableTimer: number;
  combo: number;
  comboTimer: number;
  shotsFired: number;
  shotsHit: number;
  color: string;
  secondaryColor: string;
  trailParticles: { x: number; y: number; alpha: number; color: string }[];
}

export interface CognitiveMetrics {
  reactionTimes: number[]; // ms samples
  avgReactionTimeMs: number;
  evasionEfficiency: number; // 0-100
  accuracy: number; // 0-100
  panicFiringRatio: number; // 0-100
  stressIndex: number; // 0-100
  actionsPerMinute: number;
  flowStateRating: 'Sobrecargado' | 'En Flujo Óptimo' | 'Dominio Absoluto';
  ninetyStyleArchetype: string;
  recentEvasions: number;
  recentHitsTaken: number;
}

export interface DynamicDifficulty {
  alienSpeedMultiplier: number;
  alienFireRateMultiplier: number;
  bulletSpeedMultiplier: number;
  powerupDropChance: number;
  mysteryUfoIntervalSeconds: number;
  diveBombFrequency: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  wave: number;
  mode: GameMode;
  accuracy: number;
  cognitiveGrade: string;
  isFriend?: boolean;
  date: string;
  avatarSeed: number;
}

export interface AsyncChallenge {
  id: string;
  creatorName: string;
  title: string;
  targetScore: number;
  targetWave: number;
  mode: 'classic' | 'timeattack';
  accuracyRequirement: number;
  cognitiveProfile: string;
  seed: number;
  completions: number;
  createdDate: string;
}

export interface KeyBindings {
  p1Left: string;
  p1Right: string;
  p1Up: string;
  p1Down: string;
  p1Fire: string;
  p1Emp: string;
  p2Left: string;
  p2Right: string;
  p2Up: string;
  p2Down: string;
  p2Fire: string;
  p2Emp: string;
  pause: string;
}

export interface GameSettings {
  soundVolume: number;
  musicVolume: number;
  crtEffect: boolean;
  screenShake: boolean;
  particlesIntensity: 'low' | 'med' | 'epic';
  touchControlsMode: 'auto' | 'always' | 'never';
  keyBindings: KeyBindings;
  gamepadDeadzone: number;
}
