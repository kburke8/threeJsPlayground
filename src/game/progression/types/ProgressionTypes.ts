export interface RunStats {
  runId: string;
  startTime: number;
  endTime: number;
  enemiesDefeated: number;
  damageDealt: number;
  damageTaken: number;
  resourcesGained: number;
  result: 'VICTORY' | 'DEFEAT';
  difficulty: number;
  wave: number;
}

export interface MetaUpgrade {
  id: string;
  name: string;
  description: string;
  type: MetaUpgradeType;
  value: number;
  cost: number;
  maxLevel: number;
  currentLevel: number;
}

export enum MetaUpgradeType {
  DAMAGE_BOOST = 'DAMAGE_BOOST',
  HEALTH_BOOST = 'HEALTH_BOOST',
  DEFENSE_BOOST = 'DEFENSE_BOOST',
  SPEED_BOOST = 'SPEED_BOOST',
  RESOURCE_GAIN = 'RESOURCE_GAIN',
  XP_GAIN = 'XP_GAIN',
  ENERGY_BOOST = 'ENERGY_BOOST',
  SKILL_COOLDOWN = 'SKILL_COOLDOWN'
}

export interface PlayerProgress {
  totalRuns: number;
  bestRun: RunStats | null;
  resources: number;
  metaUpgrades: Map<string, MetaUpgrade>;
  unlockedContent: Set<string>;
  statistics: {
    totalEnemiesDefeated: number;
    totalDamageDealt: number;
    totalDamageTaken: number;
    totalResourcesGained: number;
    totalPlayTime: number;
  };
} 