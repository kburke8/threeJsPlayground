import { CombatEntity } from '../../combat/types/CombatTypes';

export enum SkillType {
  ATTACK = 'ATTACK',
  HEAL = 'HEAL',
  BUFF = 'BUFF',
  DEBUFF = 'DEBUFF'
}

export enum TargetType {
  SELF = 'SELF',
  SINGLE_ENEMY = 'SINGLE_ENEMY',
  ALL_ENEMIES = 'ALL_ENEMIES',
  AREA = 'AREA'
}

export interface SkillEffect {
  type: SkillType;
  value: number;
  duration?: number; // For buffs/debuffs
  radius?: number;   // For area effects
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  targetType: TargetType;
  effects: SkillEffect[];
  cooldown: number;
  currentCooldown: number;
  energyCost: number;
  icon?: string;
  animation?: string;
}

export interface SkillSlot {
  index: number;
  skill: Skill | null;
}

export interface SkillLoadout {
  slots: SkillSlot[];
  maxSlots: number;
}

// Skill execution result for combat feedback
export interface SkillResult {
  success: boolean;
  targets: CombatEntity[];
  effects: {
    target: CombatEntity;
    effect: SkillEffect;
    value: number;
  }[];
  message?: string;
} 