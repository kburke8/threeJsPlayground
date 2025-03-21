import * as THREE from 'three';
import { CombatEntity, CombatStats } from './types/CombatTypes';
import { v4 as uuidv4 } from 'uuid';
import { MixamoLoader, MixamoModel } from '../utils/MixamoLoader';

interface EnemyInstance {
  model: MixamoModel;
  entity: CombatEntity;
}

export class EnemySpawner {
  private scene: THREE.Scene;
  private spawnPoints: THREE.Vector3[] = [];
  private enemies: Map<string, EnemyInstance> = new Map();
  private mixamoLoader: MixamoLoader;
  private lastFrameTime: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.mixamoLoader = new MixamoLoader();
    this.initializeSpawnPoints();
  }

  private initializeSpawnPoints(): void {
    // Create spawn points in a circle around the center
    const radius = 5;
    const numPoints = 8;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      this.spawnPoints.push(new THREE.Vector3(x, 0, z));
    }
  }

  public async spawnEnemy(level: number): Promise<CombatEntity> {
    const spawnPoint = this.getRandomSpawnPoint();
    const stats = this.createEnemyStats(level);
    const entity: CombatEntity = {
      id: uuidv4(),
      name: `Enemy ${level}`,
      stats,
      position: spawnPoint.clone(),
      isPlayer: false
    };

    try {
      // Load Mixamo character
      const model = await this.mixamoLoader.loadCharacter(
        '/models/characters/enemy.fbx',
        MixamoLoader.getDefaultAnimations()
      );

      // Set initial position and play idle animation
      model.model.position.copy(spawnPoint);
      const idleAction = model.animations.get('idle');
      if (idleAction) {
        idleAction.play();
      }

      // Add to scene
      this.scene.add(model.model);
      this.enemies.set(entity.id, { model, entity });

      return entity;
    } catch (error) {
      console.error('Failed to load enemy model:', error);
      throw error;
    }
  }

  public updateEnemyPosition(enemyId: string, position: THREE.Vector3): void {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      enemy.model.model.position.copy(position);
      
      // Update animations based on movement
      const currentTime = Date.now();
      const deltaTime = (currentTime - this.lastFrameTime) / 1000;
      this.lastFrameTime = currentTime;

      // Update animation mixer
      enemy.model.mixer.update(deltaTime);

      // Handle animation transitions
      const isMoving = enemy.entity.position.distanceTo(position) > 0.01;
      const walkAction = enemy.model.animations.get('walk');
      const idleAction = enemy.model.animations.get('idle');

      if (isMoving && walkAction && idleAction) {
        walkAction.reset().play();
        idleAction.stop();
      } else if (!isMoving && walkAction && idleAction) {
        idleAction.reset().play();
        walkAction.stop();
      }

      // Update entity position
      enemy.entity.position.copy(position);
    }
  }

  public playAnimation(enemyId: string, animationName: string): void {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      const action = enemy.model.animations.get(animationName);
      if (action) {
        // Stop all current animations
        enemy.model.animations.forEach(a => a.stop());
        // Play requested animation
        action.reset().play();
        // If it's not a looping animation, return to idle after it's done
        if (animationName === 'attack' || animationName === 'hit' || animationName === 'death') {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
          setTimeout(() => {
            const idleAction = enemy.model.animations.get('idle');
            if (idleAction && animationName !== 'death') {
              idleAction.reset().play();
            }
          }, action.getClip().duration * 1000);
        }
      }
    }
  }

  public removeEnemy(enemyId: string): void {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      // Play death animation before removing
      this.playAnimation(enemyId, 'death');
      
      // Remove after animation completes
      setTimeout(() => {
        this.scene.remove(enemy.model.model);
        this.enemies.delete(enemyId);
      }, 2000); // Assuming death animation is 2 seconds
    }
  }

  public cleanup(): void {
    this.enemies.forEach((enemy, id) => {
      this.scene.remove(enemy.model.model);
    });
    this.enemies.clear();
  }

  private getRandomSpawnPoint(): THREE.Vector3 {
    const index = Math.floor(Math.random() * this.spawnPoints.length);
    return this.spawnPoints[index];
  }

  private createEnemyStats(level: number): CombatStats {
    const baseStats = {
      maxHealth: 50,
      currentHealth: 50,
      attack: 10,
      defense: 5,
      speed: 5,
      level: level,
      maxEnergy: 50,
      currentEnergy: 50
    };

    // Scale stats with level
    const levelMultiplier = 1 + (level - 1) * 0.2; // 20% increase per level
    return {
      maxHealth: Math.floor(baseStats.maxHealth * levelMultiplier),
      currentHealth: Math.floor(baseStats.maxHealth * levelMultiplier),
      attack: Math.floor(baseStats.attack * levelMultiplier),
      defense: Math.floor(baseStats.defense * levelMultiplier),
      speed: Math.floor(baseStats.speed * levelMultiplier),
      level: level,
      maxEnergy: Math.floor(baseStats.maxEnergy * levelMultiplier),
      currentEnergy: Math.floor(baseStats.maxEnergy * levelMultiplier)
    };
  }
} 