import { Passive, PassiveLoadout, PassiveResult, PassiveTrigger, PassiveType } from './types/PassiveData';
import { CombatEntity } from '../combat/types/CombatTypes';
import { v4 as uuidv4 } from 'uuid';

export class PassiveManager {
  private passives: Map<string, Passive> = new Map();
  private loadout: PassiveLoadout;

  constructor(maxSlots: number = 3) {
    this.loadout = {
      slots: Array.from({ length: maxSlots }, (_, i) => ({
        index: i,
        passive: null
      })),
      maxSlots
    };
    this.initializeDefaultPassives();
  }

  private initializeDefaultPassives(): void {
    const lifeSteal: Passive = {
      id: uuidv4(),
      name: 'Life Steal',
      description: 'Heal for a portion of damage dealt',
      trigger: PassiveTrigger.ON_ATTACK,
      effects: [{ type: PassiveType.LIFE_STEAL, value: 0.1 }], // 10% life steal
      level: 1,
      maxLevel: 5
    };

    const criticalStrike: Passive = {
      id: uuidv4(),
      name: 'Critical Strike',
      description: 'Chance to deal extra damage',
      trigger: PassiveTrigger.ON_ATTACK,
      effects: [{ type: PassiveType.CRIT_CHANCE, value: 0.15, chance: 0.2 }], // 20% chance for 15% extra damage
      level: 1,
      maxLevel: 5
    };

    const toughness: Passive = {
      id: uuidv4(),
      name: 'Toughness',
      description: 'Permanently increase defense',
      trigger: PassiveTrigger.PERMANENT,
      effects: [{ type: PassiveType.STAT_BOOST, value: 10 }], // +10 defense
      level: 1,
      maxLevel: 5
    };

    [lifeSteal, criticalStrike, toughness].forEach(passive => {
      this.passives.set(passive.id, passive);
    });
  }

  public getPassives(): Passive[] {
    return Array.from(this.passives.values());
  }

  public getLoadout(): PassiveLoadout {
    return this.loadout;
  }

  public equipPassive(passiveId: string, slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.loadout.maxSlots) return false;

    const passive = this.passives.get(passiveId);
    if (!passive) return false;

    // Remove passive if it's equipped in another slot
    this.loadout.slots.forEach(slot => {
      if (slot.passive?.id === passiveId) {
        slot.passive = null;
      }
    });

    this.loadout.slots[slotIndex].passive = passive;
    return true;
  }

  public unequipPassive(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.loadout.maxSlots) return false;
    this.loadout.slots[slotIndex].passive = null;
    return true;
  }

  public checkTrigger(
    trigger: PassiveTrigger,
    source: CombatEntity,
    target?: CombatEntity,
    value?: number
  ): PassiveResult[] {
    const results: PassiveResult[] = [];

    this.loadout.slots
      .filter(slot => slot.passive !== null)
      .filter(slot => slot.passive!.trigger === trigger)
      .forEach(slot => {
        const passive = slot.passive!;
        const triggered = this.rollPassive(passive);

        if (triggered) {
          const effects = passive.effects.map(effect => ({
            type: effect.type,
            value: this.calculatePassiveEffect(effect.value, source, target, value)
          }));

          results.push({
            passive,
            triggered: true,
            source,
            target,
            effects,
            message: `${passive.name} triggered`
          });
        }
      });

    return results;
  }

  private rollPassive(passive: Passive): boolean {
    // Permanent passives always trigger
    if (passive.trigger === PassiveTrigger.PERMANENT) return true;

    // Check chance-based effects
    return passive.effects.every(effect => 
      !effect.chance || Math.random() < effect.chance
    );
  }

  private calculatePassiveEffect(
    baseValue: number,
    source: CombatEntity,
    target?: CombatEntity,
    triggerValue?: number
  ): number {
    // Basic calculation that can be expanded based on level, stats, etc.
    const levelMultiplier = 1 + (source.stats.level - 1) * 0.1;
    return Math.floor(baseValue * levelMultiplier * (triggerValue || 1));
  }

  public levelUpPassive(passiveId: string): boolean {
    const passive = this.passives.get(passiveId);
    if (!passive || passive.level >= passive.maxLevel) return false;

    passive.level++;
    // Increase effect values based on level
    passive.effects.forEach(effect => {
      effect.value *= 1.2; // 20% increase per level
      if (effect.chance) {
        effect.chance = Math.min(1, effect.chance * 1.1); // 10% chance increase per level
      }
    });

    return true;
  }

  public getActivePassives(): Passive[] {
    return this.loadout.slots
      .filter(slot => slot.passive !== null)
      .map(slot => slot.passive!);
  }

  public applyPermanentPassives(entity: CombatEntity): void {
    const permanentPassives = this.getActivePassives()
      .filter(passive => passive.trigger === PassiveTrigger.PERMANENT);

    permanentPassives.forEach(passive => {
      passive.effects.forEach(effect => {
        if (effect.type === PassiveType.STAT_BOOST) {
          // Apply stat boosts
          entity.stats.attack += effect.value;
          entity.stats.defense += effect.value;
          entity.stats.maxHealth += effect.value * 10;
          entity.stats.currentHealth = Math.min(
            entity.stats.currentHealth + effect.value * 10,
            entity.stats.maxHealth
          );
        }
      });
    });
  }
} 