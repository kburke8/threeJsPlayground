import { PassiveEffect } from './PassiveData';
import { SkillEffect } from './SkillData';

export enum GearSlot {
  HEAD = 'HEAD',
  CHEST = 'CHEST',
  LEGS = 'LEGS',
  FEET = 'FEET',
  WEAPON = 'WEAPON',
  OFFHAND = 'OFFHAND',
  ACCESSORY1 = 'ACCESSORY1',
  ACCESSORY2 = 'ACCESSORY2'
}

export enum GearRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export interface GearStats {
  attack: number;
  defense: number;
  health: number;
  speed: number;
  energy: number;
}

export interface GearModifier {
  stats?: Partial<GearStats>;
  passiveEffects?: PassiveEffect[];
  skillEffects?: SkillEffect[];
}

export interface GearItem {
  id: string;
  name: string;
  description: string;
  slot: GearSlot;
  rarity: GearRarity;
  level: number;
  baseStats: GearStats;
  setId?: string;
  icon?: string;
  modelUrl?: string;
}

export interface GearSetBonus {
  pieces: number;
  stats: GearStats;
}

export interface GearSet {
  id: string;
  name: string;
  description: string;
  bonuses: GearSetBonus[];
}

export type GearLoadout = {
  [key in GearSlot]: GearItem | null;
};

export interface GearTotalStats {
  stats: GearStats;
  setBonuses: { setId: string; activeBonuses: number[] }[];
} 