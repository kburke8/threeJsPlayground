import { v4 as uuidv4 } from 'uuid';
import { RunStats, MetaUpgrade, MetaUpgradeType, PlayerProgress } from './types/ProgressionTypes';
import { CombatEntity } from '../combat/types/CombatTypes';

export class ProgressionManager {
  private currentRun: RunStats | null = null;
  private progress: PlayerProgress;
  private readonly SAVE_KEY = 'game_progress';
  private readonly BASE_DIFFICULTY_MULTIPLIER = 0.1;

  constructor() {
    this.progress = this.loadProgress();
    this.initializeMetaUpgrades();
  }

  private initializeMetaUpgrades(): void {
    if (this.progress.metaUpgrades.size === 0) {
      const defaultUpgrades: MetaUpgrade[] = [
        {
          id: 'damage-boost',
          name: 'Power Surge',
          description: 'Increase overall damage by 5% per level',
          type: MetaUpgradeType.DAMAGE_BOOST,
          value: 0.05,
          cost: 100,
          maxLevel: 10,
          currentLevel: 0
        },
        {
          id: 'health-boost',
          name: 'Vitality',
          description: 'Increase max health by 10% per level',
          type: MetaUpgradeType.HEALTH_BOOST,
          value: 0.10,
          cost: 100,
          maxLevel: 10,
          currentLevel: 0
        },
        {
          id: 'defense-boost',
          name: 'Iron Skin',
          description: 'Increase defense by 5% per level',
          type: MetaUpgradeType.DEFENSE_BOOST,
          value: 0.05,
          cost: 100,
          maxLevel: 10,
          currentLevel: 0
        },
        {
          id: 'resource-gain',
          name: 'Fortune Finder',
          description: 'Increase resource gain by 10% per level',
          type: MetaUpgradeType.RESOURCE_GAIN,
          value: 0.10,
          cost: 150,
          maxLevel: 5,
          currentLevel: 0
        }
      ];

      defaultUpgrades.forEach(upgrade => {
        this.progress.metaUpgrades.set(upgrade.id, upgrade);
      });
    }
  }

  public startNewRun(): void {
    this.currentRun = {
      runId: uuidv4(),
      startTime: Date.now(),
      endTime: 0,
      enemiesDefeated: 0,
      damageDealt: 0,
      damageTaken: 0,
      resourcesGained: 0,
      result: 'DEFEAT',
      difficulty: this.calculateDifficulty(),
      wave: 1
    };
  }

  public endRun(result: 'VICTORY' | 'DEFEAT'): void {
    if (!this.currentRun) return;

    this.currentRun.endTime = Date.now();
    this.currentRun.result = result;

    // Update progress
    this.progress.totalRuns++;
    this.progress.statistics.totalEnemiesDefeated += this.currentRun.enemiesDefeated;
    this.progress.statistics.totalDamageDealt += this.currentRun.damageDealt;
    this.progress.statistics.totalDamageTaken += this.currentRun.damageTaken;
    this.progress.statistics.totalResourcesGained += this.currentRun.resourcesGained;
    this.progress.statistics.totalPlayTime += (this.currentRun.endTime - this.currentRun.startTime);

    // Update best run
    if (!this.progress.bestRun || 
        (this.currentRun.wave > this.progress.bestRun.wave) ||
        (this.currentRun.wave === this.progress.bestRun.wave && 
         this.currentRun.resourcesGained > this.progress.bestRun.resourcesGained)) {
      this.progress.bestRun = { ...this.currentRun };
    }

    // Add resources
    this.progress.resources += this.calculateRunReward();

    // Save progress
    this.saveProgress();
  }

  public applyMetaUpgrades(entity: CombatEntity): void {
    this.progress.metaUpgrades.forEach(upgrade => {
      if (upgrade.currentLevel === 0) return;

      const multiplier = 1 + (upgrade.value * upgrade.currentLevel);
      switch (upgrade.type) {
        case MetaUpgradeType.DAMAGE_BOOST:
          entity.stats.attack *= multiplier;
          break;
        case MetaUpgradeType.HEALTH_BOOST:
          entity.stats.maxHealth *= multiplier;
          entity.stats.currentHealth = entity.stats.maxHealth;
          break;
        case MetaUpgradeType.DEFENSE_BOOST:
          entity.stats.defense *= multiplier;
          break;
        case MetaUpgradeType.SPEED_BOOST:
          entity.stats.speed *= multiplier;
          break;
        case MetaUpgradeType.ENERGY_BOOST:
          entity.stats.maxEnergy *= multiplier;
          entity.stats.currentEnergy = entity.stats.maxEnergy;
          break;
      }
    });
  }

  public purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.progress.metaUpgrades.get(upgradeId);
    if (!upgrade || 
        upgrade.currentLevel >= upgrade.maxLevel || 
        this.progress.resources < upgrade.cost) {
      return false;
    }

    this.progress.resources -= upgrade.cost;
    upgrade.currentLevel++;
    upgrade.cost = Math.floor(upgrade.cost * 1.5); // Increase cost for next level
    this.saveProgress();
    return true;
  }

  public getCurrentRun(): RunStats | null {
    return this.currentRun;
  }

  public getProgress(): PlayerProgress {
    return this.progress;
  }

  public trackCombatEvent(type: 'damage_dealt' | 'damage_taken' | 'enemy_defeated', value: number): void {
    if (!this.currentRun) return;

    switch (type) {
      case 'damage_dealt':
        this.currentRun.damageDealt += value;
        break;
      case 'damage_taken':
        this.currentRun.damageTaken += value;
        break;
      case 'enemy_defeated':
        this.currentRun.enemiesDefeated += 1;
        this.currentRun.resourcesGained += this.calculateResourceGain(value);
        break;
    }
  }

  public advanceWave(): void {
    if (!this.currentRun) return;
    this.currentRun.wave++;
  }

  private calculateDifficulty(): number {
    const baseMultiplier = 1 + (this.progress.totalRuns * this.BASE_DIFFICULTY_MULTIPLIER);
    const upgradeOffset = Array.from(this.progress.metaUpgrades.values())
      .reduce((total, upgrade) => total + (upgrade.value * upgrade.currentLevel), 0);
    return Math.max(1, baseMultiplier - upgradeOffset);
  }

  private calculateRunReward(): number {
    if (!this.currentRun) return 0;

    const baseReward = this.currentRun.wave * 50;
    const enemyBonus = this.currentRun.enemiesDefeated * 10;
    const difficultyBonus = Math.floor(this.currentRun.difficulty * 100);
    const victoryBonus = this.currentRun.result === 'VICTORY' ? 500 : 0;

    const resourceMultiplier = 1 + (this.getMetaUpgradeEffect(MetaUpgradeType.RESOURCE_GAIN) || 0);
    return Math.floor((baseReward + enemyBonus + difficultyBonus + victoryBonus) * resourceMultiplier);
  }

  private calculateResourceGain(enemyLevel: number): number {
    const baseGain = enemyLevel * 5;
    const resourceMultiplier = 1 + (this.getMetaUpgradeEffect(MetaUpgradeType.RESOURCE_GAIN) || 0);
    return Math.floor(baseGain * resourceMultiplier);
  }

  private getMetaUpgradeEffect(type: MetaUpgradeType): number {
    for (const upgrade of this.progress.metaUpgrades.values()) {
      if (upgrade.type === type) {
        return upgrade.value * upgrade.currentLevel;
      }
    }
    return 0;
  }

  private loadProgress(): PlayerProgress {
    const savedProgress = localStorage.getItem(this.SAVE_KEY);
    if (!savedProgress) {
      return {
        totalRuns: 0,
        bestRun: null,
        resources: 0,
        metaUpgrades: new Map(),
        unlockedContent: new Set(),
        statistics: {
          totalEnemiesDefeated: 0,
          totalDamageDealt: 0,
          totalDamageTaken: 0,
          totalResourcesGained: 0,
          totalPlayTime: 0
        }
      };
    }

    const parsed = JSON.parse(savedProgress);
    return {
      ...parsed,
      metaUpgrades: new Map(Object.entries(parsed.metaUpgrades)),
      unlockedContent: new Set(parsed.unlockedContent)
    };
  }

  private saveProgress(): void {
    const serialized = {
      ...this.progress,
      metaUpgrades: Object.fromEntries(this.progress.metaUpgrades),
      unlockedContent: Array.from(this.progress.unlockedContent)
    };
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(serialized));
  }
} 