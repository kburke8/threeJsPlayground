import * as THREE from 'three';
import { CombatEntity, CombatAction } from './types/CombatTypes';

export class CombatVisualizer {
  private scene: THREE.Scene;
  private healthBars: Map<string, { 
    group: THREE.Group;
    foreground: THREE.Mesh;
    lastHealth: number;
  }> = new Map();
  private damageTexts: Map<string, THREE.Sprite> = new Map();
  private readonly HEALTH_BAR_WIDTH = 1;
  private readonly HEALTH_BAR_HEIGHT = 0.1;
  private readonly HEALTH_BAR_OFFSET_Y = 2.5;
  private readonly DAMAGE_TEXT_MATERIAL = new THREE.SpriteMaterial();
  private readonly HEALTH_BAR_GEOMETRY = new THREE.PlaneGeometry(this.HEALTH_BAR_WIDTH, this.HEALTH_BAR_HEIGHT);
  private readonly HEALTH_BAR_RED_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  private readonly HEALTH_BAR_GREEN_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createHealthBar(entity: CombatEntity): void {
    // Create health bar background (red)
    const background = new THREE.Mesh(this.HEALTH_BAR_GEOMETRY, this.HEALTH_BAR_RED_MATERIAL);

    // Create health bar foreground (green)
    const foreground = new THREE.Mesh(this.HEALTH_BAR_GEOMETRY, this.HEALTH_BAR_GREEN_MATERIAL);

    // Position health bars above entity
    background.position.y = this.HEALTH_BAR_OFFSET_Y;
    foreground.position.y = this.HEALTH_BAR_OFFSET_Y;
    
    // Make health bars always face camera
    background.rotation.x = -Math.PI / 2;
    foreground.rotation.x = -Math.PI / 2;

    // Add health bars to entity
    const healthBarGroup = new THREE.Group();
    healthBarGroup.add(background);
    healthBarGroup.add(foreground);
    healthBarGroup.position.copy(entity.position);

    this.healthBars.set(entity.id, {
      group: healthBarGroup,
      foreground,
      lastHealth: entity.stats.currentHealth
    });
    this.scene.add(healthBarGroup);
  }

  public updateHealthBar(entity: CombatEntity): void {
    const healthBar = this.healthBars.get(entity.id);
    if (!healthBar) return;

    // Only update if health has changed
    if (healthBar.lastHealth !== entity.stats.currentHealth) {
      const healthPercentage = entity.stats.currentHealth / entity.stats.maxHealth;
      healthBar.foreground.scale.x = Math.max(0, healthPercentage);
      healthBar.lastHealth = entity.stats.currentHealth;
    }
    
    // Update position to follow entity
    healthBar.group.position.copy(entity.position);
  }

  private damageTextCanvas: HTMLCanvasElement | null = null;
  private damageTextContext: CanvasRenderingContext2D | null = null;

  private getDamageTextCanvas(): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
    if (!this.damageTextCanvas || !this.damageTextContext) {
      this.damageTextCanvas = document.createElement('canvas');
      this.damageTextCanvas.width = 100;
      this.damageTextCanvas.height = 50;
      const context = this.damageTextCanvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get 2D context');
      }
      this.damageTextContext = context;
    }
    return { canvas: this.damageTextCanvas, context: this.damageTextContext };
  }

  public showDamageText(target: CombatEntity, damage: number): void {
    const { canvas, context } = this.getDamageTextCanvas();

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw text
    context.fillStyle = '#ff0000';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText(damage.toString(), canvas.width / 2, canvas.height / 2);

    // Update texture
    const texture = new THREE.CanvasTexture(canvas);
    this.DAMAGE_TEXT_MATERIAL.map = texture;
    this.DAMAGE_TEXT_MATERIAL.needsUpdate = true;

    // Create sprite
    const sprite = new THREE.Sprite(this.DAMAGE_TEXT_MATERIAL.clone());

    // Position sprite above target
    sprite.position.copy(target.position);
    sprite.position.y += this.HEALTH_BAR_OFFSET_Y + 0.5;

    // Add to scene
    this.scene.add(sprite);
    this.damageTexts.set(target.id + Date.now(), sprite);

    // Animate and remove after delay
    const startY = sprite.position.y;
    const startTime = Date.now();
    const duration = 1000; // 1 second

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        sprite.position.y = startY + progress * 0.5; // Float upward
        sprite.material.opacity = 1 - progress; // Fade out
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(sprite);
        this.damageTexts.delete(target.id + startTime);
        sprite.material.dispose();
      }
    };

    animate();
  }

  public visualizeAction(action: CombatAction): void {
    switch (action.type) {
      case 'ATTACK':
        if (action.target && action.damage) {
          this.showDamageText(action.target, action.damage);
          // TODO: Add attack animation/effects
        }
        break;
      case 'MOVE':
        // TODO: Add movement trails/effects
        break;
    }
  }

  public cleanup(): void {
    // Remove all health bars
    this.healthBars.forEach(({ group }) => {
      this.scene.remove(group);
    });
    this.healthBars.clear();

    // Remove all damage texts
    this.damageTexts.forEach((sprite) => {
      sprite.material.dispose();
      this.scene.remove(sprite);
    });
    this.damageTexts.clear();

    // Clean up shared resources
    if (this.damageTextCanvas) {
      this.damageTextCanvas = null;
      this.damageTextContext = null;
    }
  }
} 