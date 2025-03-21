import { CombatEntity } from '../../combat/types/CombatTypes';

export enum PassiveTrigger {
  ON_ATTACK = 'ON_ATTACK',
  ON_DAMAGED = 'ON_DAMAGED',
  ON_KILL = 'ON_KILL',
  ON_HEAL = 'ON_HEAL',
  PERMANENT = 'PERMANENT'
}

export enum PassiveType {
  STAT_BOOST = 'STAT_BOOST',
  LIFE_STEAL = 'LIFE_STEAL',
  DAMAGE_REFLECT = 'DAMAGE_REFLECT',
  CRIT_CHANCE = 'CRIT_CHANCE',
  DODGE_CHANCE = 'DODGE_CHANCE',
  HEAL_BOOST = 'HEAL_BOOST'
}

export interface PassiveEffect {
  type: PassiveType;
  value: number;
  chance?: number; // For random effects like crit/dodge
  duration?: number; // For temporary effects
}

export interface Passive {
  id: string;
  name: string;
  description: string;
  trigger: PassiveTrigger;
  effects: PassiveEffect[];
  level: number;
  maxLevel: number;
  icon?: string;
}

export interface PassiveSlot {
  index: number;
  passive: Passive | null;
}

export interface PassiveLoadout {
  slots: PassiveSlot[];
  maxSlots: number;
}

// Passive trigger result for combat feedback
export interface PassiveResult {
  passive: Passive;
  triggered: boolean;
  source: CombatEntity;
  target?: CombatEntity;
  effects: {
    type: PassiveType;
    value: number;
  }[];
  message?: string;
} 