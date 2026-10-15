/**
 * Space Invaders: Neon Assault 90s - Achievements Definition & Management
 */

import { Achievement } from '../types';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    title: 'Primer Contacto Hostil',
    description: 'Destruye tu primer invasor extraterrestre.',
    icon: '👾',
    unlocked: false,
  },
  {
    id: 'sharpshooter',
    title: 'Francotirador Galaga',
    description: 'Alcanza más del 80% de precisión en una oleada completa.',
    icon: '🎯',
    unlocked: false,
  },
  {
    id: 'bullet_hell',
    title: 'Evasión Vectorial',
    description: 'Esquiva 15 proyectiles enemigos sin sufrir impactos de casco.',
    icon: '⚡',
    unlocked: false,
  },
  {
    id: 'max_overclock',
    title: 'Hiper-Armamento',
    description: 'Desbloquea el nivel máximo de potencia de disparo.',
    icon: '🚀',
    unlocked: false,
  },
  {
    id: 'bydo_slayer',
    title: 'Aniquilador de Bydo',
    description: 'Derrota al temible Jefe Biomecánico Core de la Fase 5.',
    icon: '👑',
    unlocked: false,
  },
  {
    id: 'coop_synergy',
    title: 'Escuadrón Táctico 2P',
    description: 'Juega en modo cooperativo local con un amigo.',
    icon: '👥',
    unlocked: false,
  },
  {
    id: 'speed_demon',
    title: 'Crono-Piloto 1994',
    description: 'Supera 60,000 puntos en el modo Contrarreloj.',
    icon: '⏱️',
    unlocked: false,
  },
  {
    id: 'cognitive_master',
    title: 'Mente Cinética S+',
    description: 'Alcanza el grado cognitivo S o S+ en el analizador de reflejos.',
    icon: '🧠',
    unlocked: false,
  },
  {
    id: 'ufo_hunter',
    title: 'Cazador de OVNIs',
    description: 'Derriba una nave nodriza de misterio en tránsito orbital.',
    icon: '🛸',
    unlocked: false,
  },
  {
    id: 'emp_purification',
    title: 'Tormenta de Iones',
    description: 'Detona un pulso EMP para limpiar la pantalla de amenazas.',
    icon: '💣',
    unlocked: false,
  },
];
