import { Vector3 } from 'three';
import * as THREE from 'three';
import { Skill } from '../../character/types/SkillData';

export interface CombatStats {
  level: number;
  maxHealth: number;
  currentHealth: number;
  attack: number;
  defense: number;
  speed: number;
  maxEnergy: number;
  currentEnergy: number;
}

export interface CombatEntity {
  id: string;
  name: string;
  stats: CombatStats;
  position: Vector3;
  isPlayer: boolean;
}

export enum CombatState {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT'
}

export enum ActionType {
  MOVE = 'MOVE',
  ATTACK = 'ATTACK',
  SKILL = 'SKILL'
}

export interface SkillEffect {
  type: 'DAMAGE' | 'HEAL' | 'BUFF' | 'DEBUFF';
  value: number;
  duration?: number;
}

export type CombatAction = {
  type: 'MOVE';
  source: CombatEntity;
  targetPosition: THREE.Vector3;
} | {
  type: 'ATTACK';
  source: CombatEntity;
  target: CombatEntity;
  damage: number;
} | {
  type: 'SKILL';
  source: CombatEntity;
  target: CombatEntity;
  skill: Skill;
};

export interface CombatRound {
  roundNumber: number;
  actions: CombatAction[];
  timestamp: number;
}

export interface CombatResult {
  state: CombatState;
  winner?: CombatEntity;
  experienceGained?: number;
  lootDropped?: any[]; // We'll define a proper loot type later
} 