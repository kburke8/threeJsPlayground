import { Skill, SkillLoadout, SkillResult, SkillType, TargetType } from './types/SkillData';
import { CombatEntity } from '../combat/types/CombatTypes';
import { v4 as uuidv4 } from 'uuid';

export class SkillManager {
  private skills: Map<string, Skill> = new Map();
  private loadout: SkillLoadout;

  constructor(maxSlots: number = 4) {
    this.loadout = {
      slots: Array.from({ length: maxSlots }, (_, i) => ({
        index: i,
        skill: null
      })),
      maxSlots
    };
    this.initializeDefaultSkills();
  }

  private initializeDefaultSkills(): void {
    const basicAttack: Skill = {
      id: uuidv4(),
      name: 'Basic Attack',
      description: 'A basic attack dealing physical damage',
      type: SkillType.ATTACK,
      targetType: TargetType.SINGLE_ENEMY,
      effects: [{ type: SkillType.ATTACK, value: 100 }],
      cooldown: 0,
      currentCooldown: 0,
      energyCost: 0
    };

    const powerStrike: Skill = {
      id: uuidv4(),
      name: 'Power Strike',
      description: 'A powerful strike dealing heavy damage',
      type: SkillType.ATTACK,
      targetType: TargetType.SINGLE_ENEMY,
      effects: [{ type: SkillType.ATTACK, value: 200 }],
      cooldown: 3,
      currentCooldown: 0,
      energyCost: 30
    };

    const heal: Skill = {
      id: uuidv4(),
      name: 'Heal',
      description: 'Restore some health',
      type: SkillType.HEAL,
      targetType: TargetType.SELF,
      effects: [{ type: SkillType.HEAL, value: 50 }],
      cooldown: 5,
      currentCooldown: 0,
      energyCost: 40
    };

    [basicAttack, powerStrike, heal].forEach(skill => {
      this.skills.set(skill.id, skill);
    });

    // Auto-equip basic attack
    this.equipSkill(basicAttack.id, 0);
  }

  public getSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  public getLoadout(): SkillLoadout {
    return this.loadout;
  }

  public equipSkill(skillId: string, slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.loadout.maxSlots) return false;

    const skill = this.skills.get(skillId);
    if (!skill) return false;

    // Remove skill if it's equipped in another slot
    this.loadout.slots.forEach(slot => {
      if (slot.skill?.id === skillId) {
        slot.skill = null;
      }
    });

    this.loadout.slots[slotIndex].skill = skill;
    return true;
  }

  public unequipSkill(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.loadout.maxSlots) return false;
    this.loadout.slots[slotIndex].skill = null;
    return true;
  }

  public executeSkill(
    skill: Skill,
    source: CombatEntity,
    targets: CombatEntity[]
  ): SkillResult {
    // Check cooldown
    if (skill.currentCooldown > 0) {
      return {
        success: false,
        targets: [],
        effects: [],
        message: 'Skill is on cooldown'
      };
    }

    // Check energy cost
    if (source.stats.currentEnergy < skill.energyCost) {
      return {
        success: false,
        targets: [],
        effects: [],
        message: 'Not enough energy'
      };
    }

    // Apply effects
    const effects = targets.flatMap(target => 
      skill.effects.map(effect => ({
        target,
        effect,
        value: this.calculateSkillEffect(effect.value, source, target)
      }))
    );

    // Apply cooldown and energy cost
    skill.currentCooldown = skill.cooldown;
    source.stats.currentEnergy -= skill.energyCost;

    return {
      success: true,
      targets,
      effects,
      message: `${skill.name} executed successfully`
    };
  }

  private calculateSkillEffect(
    baseValue: number,
    source: CombatEntity,
    target: CombatEntity
  ): number {
    // Basic calculation, can be expanded based on stats, gear, etc.
    const attackMultiplier = source.stats.attack / 100;
    const defenseMultiplier = target.stats.defense / 100;
    return Math.floor(baseValue * attackMultiplier * (1 - defenseMultiplier));
  }

  public updateCooldowns(): void {
    this.loadout.slots.forEach(slot => {
      if (slot.skill && slot.skill.currentCooldown > 0) {
        slot.skill.currentCooldown--;
      }
    });
  }

  public getAvailableSkills(source: CombatEntity): Skill[] {
    return this.loadout.slots
      .filter(slot => slot.skill !== null)
      .filter(slot => {
        const skill = slot.skill!;
        return skill.currentCooldown === 0 && source.stats.currentEnergy >= skill.energyCost;
      })
      .map(slot => slot.skill!);
  }
} 