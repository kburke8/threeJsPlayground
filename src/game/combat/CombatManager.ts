import * as THREE from 'three';
import { CombatEntity, CombatState, CombatAction, CombatRound, CombatResult, ActionType } from './types/CombatTypes';
import { SkillManager } from '../character/SkillManager';
import { PassiveManager } from '../character/PassiveManager';
import { GearManager } from '../character/GearManager';
import { PassiveTrigger } from '../character/types/PassiveData';
import { ProgressionManager } from '../progression/ProgressionManager';
import { EnemySpawner } from './EnemySpawner';
import { SkillEffect } from '../character/types/SkillData';
import { SkillType } from '../character/types/SkillData';

export class CombatManager {
  private player: CombatEntity;
  private enemies: CombatEntity[] = [];
  private currentState: CombatState = CombatState.WAITING;
  private rounds: CombatRound[] = [];
  private currentRound: number = 0;
  private actionQueue: CombatAction[] = [];
  private lastRoundTime: number = 0;
  private readonly ROUND_DURATION = 2000; // 2 seconds per round
  private readonly MOVE_SPEED = 0.1;
  private readonly ATTACK_RANGE = 1.0;

  private skillManager: SkillManager;
  private passiveManager: PassiveManager;
  private gearManager: GearManager;
  private progressionManager: ProgressionManager;
  private enemySpawner: EnemySpawner;

  constructor(
    player: CombatEntity,
    skillManager: SkillManager,
    passiveManager: PassiveManager,
    gearManager: GearManager,
    progressionManager: ProgressionManager,
    enemySpawner: EnemySpawner
  ) {
    this.player = player;
    this.skillManager = skillManager;
    this.passiveManager = passiveManager;
    this.gearManager = gearManager;
    this.progressionManager = progressionManager;
    this.enemySpawner = enemySpawner;

    // Apply gear stats and permanent passives
    this.gearManager.applyGearStats(player);
    this.passiveManager.applyPermanentPassives(player);
  }

  public addEnemy(enemy: CombatEntity): void {
    this.enemies.push(enemy);
  }

  public startCombat(): void {
    this.currentState = CombatState.IN_PROGRESS;
    this.lastRoundTime = Date.now();
    this.currentRound = 1;
  }

  public update(): void {
    if (this.currentState !== CombatState.IN_PROGRESS) return;

    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastRoundTime;

    // Process round less frequently
    if (deltaTime >= this.ROUND_DURATION) {
      this.processRound();
      this.lastRoundTime = currentTime;

      // Update skill cooldowns only when round changes
      this.skillManager.updateCooldowns();
    }

    // Process queued actions
    this.processActions();

    // Check combat end conditions only when needed
    if (this.player.stats.currentHealth <= 0 || this.enemies.every(enemy => enemy.stats.currentHealth <= 0)) {
      this.checkCombatEnd();
    }
  }

  private processRound(): void {
    // Clear previous round's actions
    this.actionQueue = [];

    // Cache alive entities and sort by speed
    const aliveEntities = [this.player, ...this.enemies].filter(entity => entity.stats.currentHealth > 0);
    aliveEntities.sort((a, b) => b.stats.speed - a.stats.speed);

    // Generate actions for each entity
    for (let i = 0; i < aliveEntities.length; i++) {
      const action = this.determineAction(aliveEntities[i]);
      if (action) {
        this.actionQueue.push(action);
      }
    }

    // Record the round
    this.rounds.push({
      roundNumber: this.currentRound++,
      actions: [...this.actionQueue],
      timestamp: Date.now()
    });
  }

  private determineAction(entity: CombatEntity): CombatAction | null {
    if (entity.isPlayer) {
      return this.determinePlayerAction();
    } else {
      return this.determineEnemyAction(entity);
    }
  }

  private determinePlayerAction(): CombatAction | null {
    // Find nearest enemy
    const nearestEnemy = this.findNearestEnemy(this.player.position);
    if (!nearestEnemy) return null;

    // Check for available skills
    const availableSkills = this.skillManager.getAvailableSkills(this.player);
    if (availableSkills.length > 0) {
      // For now, just use the first available skill
      const skill = availableSkills[0];
      return {
        type: 'SKILL',
        source: this.player,
        target: nearestEnemy,
        skill
      };
    }

    // If within attack range, attack
    if (this.isWithinAttackRange(this.player.position, nearestEnemy.position)) {
      return {
        type: 'ATTACK',
        source: this.player,
        target: nearestEnemy,
        damage: this.calculateDamage(this.player, nearestEnemy)
      };
    }

    // Otherwise, move towards enemy
    return {
      type: 'MOVE',
      source: this.player,
      targetPosition: nearestEnemy.position
    };
  }

  private determineEnemyAction(enemy: CombatEntity): CombatAction | null {
    // Simple AI: If within range, attack player. Otherwise, move towards player
    if (this.isWithinAttackRange(enemy.position, this.player.position)) {
      return {
        type: 'ATTACK',
        source: enemy,
        target: this.player,
        damage: this.calculateDamage(enemy, this.player)
      };
    }

    return {
      type: 'MOVE',
      source: enemy,
      targetPosition: this.player.position
    };
  }

  private processActions(): void {
    while (this.actionQueue.length > 0) {
      const action = this.actionQueue[0];
      
      switch (action.type) {
        case 'ATTACK': {
          // Check for ON_ATTACK passives
          const attackPassives = this.passiveManager.checkTrigger(
            PassiveTrigger.ON_ATTACK,
            action.source,
            action.target,
            action.damage
          );

          // Apply passive effects
          let finalDamage = action.damage;
          attackPassives.forEach(result => {
            result.effects.forEach(effect => {
              // Apply effect modifiers to damage
              finalDamage *= (1 + effect.value);
            });
          });

          this.handleAttack(action.source, action.target);
          break;
        }
        case 'SKILL': {
          const result = this.skillManager.executeSkill(action.skill, action.source, [action.target]);
          if (result.success) {
            result.effects.forEach(effect => {
              this.handleSkillEffect(action.source, effect);
            });
          }
          break;
        }
        case 'MOVE': {
          this.moveEntity(action.source, action.targetPosition);
          break;
        }
      }

      this.actionQueue.shift();
    }
  }

  private handleSkillEffect(source: CombatEntity, effect: { target: CombatEntity; effect: SkillEffect; value: number }): void {
    switch (effect.effect.type) {
      case SkillType.ATTACK:
        this.handleAttack(source, effect.target);
        break;
      case SkillType.HEAL:
        effect.target.stats.currentHealth = Math.min(
          effect.target.stats.maxHealth,
          effect.target.stats.currentHealth + effect.value
        );
        break;
      case SkillType.BUFF:
        // Handle buffs
        break;
      case SkillType.DEBUFF:
        // Handle debuffs
        break;
    }
  }

  private handleAttack(attacker: CombatEntity, target: CombatEntity): void {
    // Calculate damage
    const damage = Math.max(1, attacker.stats.attack - target.stats.defense);
    target.stats.currentHealth = Math.max(0, target.stats.currentHealth - damage);

    // Play attack animation for attacker
    if (attacker.isPlayer) {
      (window as any).game.playPlayerAnimation('attack');
    } else {
      this.enemySpawner.playAnimation(attacker.id, 'attack');
    }

    // Play hit animation for target
    if (target.isPlayer) {
      (window as any).game.playPlayerAnimation('hit');
    } else {
      this.enemySpawner.playAnimation(target.id, 'hit');
    }

    // Track combat event
    if (attacker.isPlayer) {
      this.progressionManager.trackCombatEvent('damage_dealt', damage);
    } else {
      this.progressionManager.trackCombatEvent('damage_taken', damage);
    }

    // Check if target died
    if (target.stats.currentHealth <= 0) {
      if (!target.isPlayer) {
        this.progressionManager.trackCombatEvent('enemy_defeated', target.stats.level);
        this.removeEnemy(target);
      }
    }
  }

  private removeEnemy(enemy: CombatEntity): void {
    const index = this.enemies.indexOf(enemy);
    if (index !== -1) {
      this.enemies.splice(index, 1);
      this.enemySpawner.removeEnemy(enemy.id);
    }
  }

  private applyDamage(target: CombatEntity, damage: number): void {
    // Check for ON_DAMAGED passives before applying damage
    const damagedPassives = this.passiveManager.checkTrigger(
      PassiveTrigger.ON_DAMAGED,
      target,
      undefined,
      damage
    );

    // Apply passive effects
    let finalDamage = damage;
    damagedPassives.forEach(result => {
      result.effects.forEach(effect => {
        // Apply effect modifiers to damage
        finalDamage *= (1 - effect.value);
      });
    });

    // Apply the damage
    const previousHealth = target.stats.currentHealth;
    target.stats.currentHealth = Math.max(0, target.stats.currentHealth - finalDamage);

    // Check for ON_KILL passives if target died
    if (target.stats.currentHealth <= 0 && previousHealth > 0) {
      this.passiveManager.checkTrigger(
        PassiveTrigger.ON_KILL,
        target,
        undefined,
        finalDamage
      );
    }
  }

  private moveEntity(entity: CombatEntity, targetPosition: THREE.Vector3): void {
    // Optimize vector operations by reusing objects
    const direction = targetPosition.clone().sub(entity.position).normalize();
    entity.position.addScaledVector(direction, this.MOVE_SPEED);
  }

  private calculateDamage(attacker: CombatEntity, defender: CombatEntity): number {
    const baseDamage = attacker.stats.attack;
    const defense = defender.stats.defense;
    return Math.max(1, baseDamage - defense); // Minimum 1 damage
  }

  private isWithinAttackRange(pos1: THREE.Vector3, pos2: THREE.Vector3): boolean {
    // Use squared distance for better performance
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return (dx * dx + dz * dz) <= (this.ATTACK_RANGE * this.ATTACK_RANGE);
  }

  private findNearestEnemy(position: THREE.Vector3): CombatEntity | null {
    let nearest: CombatEntity | null = null;
    let minDistance = Infinity;

    // Manual loop is faster than reduce
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (enemy.stats.currentHealth <= 0) continue;

      const dx = enemy.position.x - position.x;
      const dz = enemy.position.z - position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < minDistance) {
        minDistance = distSq;
        nearest = enemy;
      }
    }

    return nearest;
  }

  private checkCombatEnd(): void {
    // Check if player is defeated
    if (this.player.stats.currentHealth <= 0) {
      this.endCombat({
        state: CombatState.DEFEAT,
        winner: this.enemies.find(e => e.stats.currentHealth > 0) || undefined
      });
      return;
    }

    // Check if all enemies are defeated
    if (this.enemies.every(enemy => enemy.stats.currentHealth <= 0)) {
      this.endCombat({
        state: CombatState.VICTORY,
        winner: this.player,
        experienceGained: this.calculateExperienceGain(),
        lootDropped: this.generateLoot()
      });
    }
  }

  private endCombat(result: CombatResult): void {
    this.currentState = result.state;
    // We'll implement proper experience and loot handling later
  }

  private calculateExperienceGain(): number {
    return this.enemies.reduce((total, enemy) => total + enemy.stats.level * 10, 0);
  }

  private generateLoot(): any[] {
    // We'll implement proper loot generation later
    return [];
  }

  public getCurrentState(): CombatState {
    return this.currentState;
  }

  public getRounds(): CombatRound[] {
    return this.rounds;
  }

  public getEnemies(): CombatEntity[] {
    return this.enemies;
  }
} 