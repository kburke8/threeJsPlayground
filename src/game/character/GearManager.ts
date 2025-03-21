import { GearItem, GearLoadout, GearRarity, GearSet, GearSlot, GearStats, GearTotalStats } from './types/GearData';
import { CombatEntity } from '../combat/types/CombatTypes';
import { v4 as uuidv4 } from 'uuid';

export class GearManager {
  private gear: Map<string, GearItem> = new Map();
  private loadout: GearLoadout = {
    [GearSlot.HEAD]: null,
    [GearSlot.CHEST]: null,
    [GearSlot.LEGS]: null,
    [GearSlot.FEET]: null,
    [GearSlot.WEAPON]: null,
    [GearSlot.OFFHAND]: null,
    [GearSlot.ACCESSORY1]: null,
    [GearSlot.ACCESSORY2]: null
  };
  private gearSets: Map<string, GearSet> = new Map();

  constructor() {
    this.initializeDefaultGear();
    this.initializeDefaultSets();
  }

  private initializeDefaultGear(): void {
    const basicSword: GearItem = {
      id: uuidv4(),
      name: 'Basic Sword',
      description: 'A simple but reliable sword',
      slot: GearSlot.WEAPON,
      rarity: GearRarity.COMMON,
      level: 1,
      baseStats: {
        attack: 10,
        defense: 0,
        health: 0,
        speed: 0,
        energy: 0
      },
      setId: 'warrior'
    };

    const basicShield: GearItem = {
      id: uuidv4(),
      name: 'Basic Shield',
      description: 'A sturdy wooden shield',
      slot: GearSlot.OFFHAND,
      rarity: GearRarity.COMMON,
      level: 1,
      baseStats: {
        attack: 0,
        defense: 10,
        health: 20,
        speed: -1,
        energy: 0
      },
      setId: 'warrior'
    };

    const leatherHelmet: GearItem = {
      id: uuidv4(),
      name: 'Leather Helmet',
      description: 'Basic head protection',
      slot: GearSlot.HEAD,
      rarity: GearRarity.COMMON,
      level: 1,
      baseStats: {
        attack: 0,
        defense: 5,
        health: 10,
        speed: 0,
        energy: 5
      },
      setId: 'warrior'
    };

    [basicSword, basicShield, leatherHelmet].forEach(item => {
      this.gear.set(item.id, item);
    });
  }

  private initializeDefaultSets(): void {
    const warriorSet: GearSet = {
      id: 'warrior',
      name: 'Warrior Set',
      description: 'Basic warrior equipment',
      bonuses: [
        {
          pieces: 2,
          stats: {
            attack: 5,
            defense: 5,
            health: 20,
            speed: 0,
            energy: 10
          }
        },
        {
          pieces: 4,
          stats: {
            attack: 15,
            defense: 15,
            health: 50,
            speed: 2,
            energy: 20
          }
        }
      ]
    };

    this.gearSets.set(warriorSet.id, warriorSet);
  }

  public getGear(): GearItem[] {
    return Array.from(this.gear.values());
  }

  public getLoadout(): GearLoadout {
    return this.loadout;
  }

  public equipGear(gearId: string, slot: GearSlot): boolean {
    const item = this.gear.get(gearId);
    if (!item || item.slot !== slot) return false;

    this.loadout[slot] = item;
    return true;
  }

  public unequipGear(slot: GearSlot): boolean {
    if (!this.loadout[slot]) return false;
    this.loadout[slot] = null;
    return true;
  }

  public calculateTotalStats(): GearTotalStats {
    const baseStats: GearStats = {
      attack: 0,
      defense: 0,
      health: 0,
      speed: 0,
      energy: 0
    };

    // Add base stats from gear
    Object.values(this.loadout).forEach(item => {
      if (item) {
        Object.entries(item.baseStats).forEach(([stat, value]) => {
          baseStats[stat as keyof GearStats] += value;
        });
      }
    });

    // Calculate set bonuses
    const setBonuses = this.calculateSetBonuses();
    Object.entries(setBonuses).forEach(([stat, value]) => {
      baseStats[stat as keyof GearStats] += value;
    });

    return {
      stats: baseStats,
      setBonuses: this.getActiveSetBonuses()
    };
  }

  private calculateSetBonuses(): GearStats {
    const setPieces = new Map<string, number>();
    const bonuses: GearStats = {
      attack: 0,
      defense: 0,
      health: 0,
      speed: 0,
      energy: 0
    };

    // Count pieces per set
    Object.values(this.loadout).forEach(item => {
      if (item?.setId) {
        setPieces.set(item.setId, (setPieces.get(item.setId) || 0) + 1);
      }
    });

    // Apply set bonuses
    setPieces.forEach((count, setId) => {
      const set = this.gearSets.get(setId);
      if (set) {
        set.bonuses
          .filter(bonus => bonus.pieces <= count)
          .forEach(bonus => {
            Object.entries(bonus.stats).forEach(([stat, value]) => {
              bonuses[stat as keyof GearStats] += value;
            });
          });
      }
    });

    return bonuses;
  }

  public getActiveSetBonuses(): { setId: string; activeBonuses: number[] }[] {
    const setPieces = new Map<string, number>();
    const activeSetBonuses: { setId: string; activeBonuses: number[] }[] = [];

    // Count pieces per set
    Object.values(this.loadout).forEach(item => {
      if (item?.setId) {
        setPieces.set(item.setId, (setPieces.get(item.setId) || 0) + 1);
      }
    });

    // Determine active bonuses
    setPieces.forEach((count, setId) => {
      const set = this.gearSets.get(setId);
      if (set) {
        const activeBonuses = set.bonuses
          .filter(bonus => bonus.pieces <= count)
          .map(bonus => bonus.pieces);

        if (activeBonuses.length > 0) {
          activeSetBonuses.push({ setId, activeBonuses });
        }
      }
    });

    return activeSetBonuses;
  }

  public applyGearStats(entity: CombatEntity): void {
    const totalStats = this.calculateTotalStats();
    
    // Apply base stats
    entity.stats.attack += totalStats.stats.attack;
    entity.stats.defense += totalStats.stats.defense;
    entity.stats.maxHealth += totalStats.stats.health;
    entity.stats.currentHealth = Math.min(
      entity.stats.currentHealth + totalStats.stats.health,
      entity.stats.maxHealth
    );
    entity.stats.speed += totalStats.stats.speed;
    entity.stats.maxEnergy += totalStats.stats.energy;
    entity.stats.currentEnergy = Math.min(
      entity.stats.currentEnergy + totalStats.stats.energy,
      entity.stats.maxEnergy
    );
  }

  public levelUpGear(gearId: string): boolean {
    const item = this.gear.get(gearId);
    if (!item) return false;

    item.level++;
    // Increase stats based on level and rarity
    const multiplier = this.getRarityMultiplier(item.rarity);
    Object.entries(item.baseStats).forEach(([stat, value]) => {
      item.baseStats[stat as keyof GearStats] = Math.floor(value * (1 + item.level * 0.1 * multiplier));
    });

    return true;
  }

  private getRarityMultiplier(rarity: GearRarity): number {
    switch (rarity) {
      case GearRarity.COMMON: return 1;
      case GearRarity.UNCOMMON: return 1.2;
      case GearRarity.RARE: return 1.5;
      case GearRarity.EPIC: return 2;
      case GearRarity.LEGENDARY: return 3;
    }
  }
} 