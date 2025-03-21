import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CharacterManager } from './character/CharacterManager';
import { CharacterCustomizationUI } from './character/CharacterCustomizationUI';
import { CharacterCustomization, CharacterPartType, AnimationType } from './character/types/CharacterData';
import { CombatManager } from './combat/CombatManager';
import { CombatVisualizer } from './combat/CombatVisualizer';
import { EnemySpawner } from './combat/EnemySpawner';
import { CombatEntity, CombatState } from './combat/types/CombatTypes';
import { SkillManager } from './character/SkillManager';
import { PassiveManager } from './character/PassiveManager';
import { GearManager } from './character/GearManager';
import { ProgressionManager } from './progression/ProgressionManager';
import { ProgressionUI } from './progression/ProgressionUI';
import { v4 as uuidv4 } from 'uuid';
import { MixamoLoader, MixamoModel } from './utils/MixamoLoader';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private characterManager: CharacterManager;
  private customizationUI: CharacterCustomizationUI;
  private combatManager: CombatManager | null = null;
  private combatVisualizer: CombatVisualizer;
  private enemySpawner: EnemySpawner;
  private skillManager: SkillManager;
  private passiveManager: PassiveManager;
  private gearManager: GearManager;
  private player: CombatEntity | null = null;
  private ground: THREE.Mesh;
  private lastFrameTime: number = 0;
  private readonly FRAME_INTERVAL = 1000 / 60; // Target 60 FPS
  private progressionManager: ProgressionManager;
  private progressionUI: ProgressionUI;
  private mixamoLoader: MixamoLoader;
  private playerModel: MixamoModel | null = null;
  private characterGroup: THREE.Group | null = null;

  constructor() {
    // Add game instance to window
    (window as any).game = this;

    // Create UI containers first
    this.createUIContainers();

    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Set up camera and controls
    this.camera.position.set(0, 2, 4);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1, 0); // Look at character height
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2; // Don't go below ground
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Add ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
      metalness: 0.2
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.ground);

    // Enable shadows
    this.renderer.shadowMap.enabled = true;
    this.ground.receiveShadow = true;

    // Initialize character systems
    this.characterManager = new CharacterManager();
    this.customizationUI = new CharacterCustomizationUI(
      'customization-ui',
      this.getDefaultCustomization(),
      this.handleCustomizationChange.bind(this)
    );

    // Initialize combat systems
    this.combatVisualizer = new CombatVisualizer(this.scene);
    this.enemySpawner = new EnemySpawner(this.scene);

    // Initialize skill, passive, and gear systems
    this.skillManager = new SkillManager();
    this.passiveManager = new PassiveManager();
    this.gearManager = new GearManager();

    // Initialize progression system
    this.progressionManager = new ProgressionManager();
    this.progressionUI = new ProgressionUI('progression-ui', this.progressionManager);

    // Start the game loop
    this.animate();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Initialize game asynchronously
    this.mixamoLoader = new MixamoLoader();
    this.initialize();
  }

  private createUIContainers(): void {
    // Create customization UI container
    const customizationUI = document.createElement('div');
    customizationUI.id = 'customization-ui';
    customizationUI.style.cssText = `
      position: fixed;
      left: 20px;
      top: 20px;
      z-index: 100;
    `;
    document.body.appendChild(customizationUI);

    // Create progression UI container
    const progressionUI = document.createElement('div');
    progressionUI.id = 'progression-ui';
    progressionUI.style.cssText = `
      position: fixed;
      right: 20px;
      top: 20px;
      z-index: 100;
    `;
    document.body.appendChild(progressionUI);

    // Add global styles
    const style = document.createElement('style');
    style.textContent = `
      body {
        margin: 0;
        overflow: hidden;
      }
      canvas {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 0;
      }
      #customization-ui, #progression-ui {
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: Arial, sans-serif;
        max-height: 80vh;
        overflow-y: auto;
      }
      #customization-ui {
        min-width: 300px;
      }
      #progression-ui {
        min-width: 250px;
        display: none;
      }
      .button {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin: 5px;
      }
      .button:hover {
        background: #45a049;
      }
      .button:disabled {
        background: #666;
        cursor: not-allowed;
      }
      select, input {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 5px;
        border-radius: 4px;
        margin: 5px;
        width: calc(100% - 10px);
      }
      select option {
        background: #333;
      }
      .color-picker {
        display: flex;
        align-items: center;
        margin: 5px 0;
      }
      .color-picker label {
        flex: 1;
      }
      .color-picker input[type="color"] {
        width: 50px;
      }
    `;
    document.head.appendChild(style);
  }

  private getDefaultCustomization(): CharacterCustomization {
    return {
      parts: {
        [CharacterPartType.BODY]: { 
          id: 'basic-body', 
          name: 'Basic Body', 
          modelUrl: '',
          type: CharacterPartType.BODY 
        },
        [CharacterPartType.HEAD]: { 
          id: 'basic-head', 
          name: 'Basic Head', 
          modelUrl: '',
          type: CharacterPartType.HEAD 
        },
        [CharacterPartType.LEFT_ARM]: { 
          id: 'basic-left-arm', 
          name: 'Basic Left Arm', 
          modelUrl: '',
          type: CharacterPartType.LEFT_ARM 
        },
        [CharacterPartType.RIGHT_ARM]: { 
          id: 'basic-right-arm', 
          name: 'Basic Right Arm', 
          modelUrl: '',
          type: CharacterPartType.RIGHT_ARM 
        },
        [CharacterPartType.LEFT_LEG]: { 
          id: 'basic-left-leg', 
          name: 'Basic Left Leg', 
          modelUrl: '',
          type: CharacterPartType.LEFT_LEG 
        },
        [CharacterPartType.RIGHT_LEG]: { 
          id: 'basic-right-leg', 
          name: 'Basic Right Leg', 
          modelUrl: '',
          type: CharacterPartType.RIGHT_LEG 
        },
        [CharacterPartType.WEAPON]: { 
          id: 'basic-weapon', 
          name: 'Basic Weapon', 
          modelUrl: '',
          type: CharacterPartType.WEAPON 
        },
        [CharacterPartType.ACCESSORY]: { 
          id: 'basic-accessory', 
          name: 'Basic Accessory', 
          modelUrl: '',
          type: CharacterPartType.ACCESSORY 
        }
      },
      colors: {
        'body-material': '#4287f5',    // blue
        'head-material': '#f5d142',    // gold
        'arm-material': '#4287f5',     // blue
        'leg-material': '#4287f5',     // blue
        'weapon-material': '#c9c9c9',  // silver
        'accessory-material': '#f54242' // red
      },
      animations: [
        { 
          id: 'idle-animation',
          name: 'Idle',
          type: AnimationType.IDLE,
          url: '',
          loop: true,
          duration: 2
        },
        { 
          id: 'walk-animation',
          name: 'Walk',
          type: AnimationType.WALK,
          url: '',
          loop: true,
          duration: 1
        },
        { 
          id: 'attack-animation',
          name: 'Attack',
          type: AnimationType.ATTACK,
          url: '',
          loop: false,
          duration: 0.5
        }
      ]
    };
  }

  private async handleCustomizationChange(customization: CharacterCustomization): Promise<void> {
    const characterGroup = await this.characterManager.loadCharacter(customization);
    
    // Update character position
    if (this.player) {
      characterGroup.position.copy(this.player.position);
    } else {
      characterGroup.position.set(0, 0, 0);
    }

    // Remove old character if it exists
    const oldCharacter = this.scene.getObjectByName('character');
    if (oldCharacter) {
      this.scene.remove(oldCharacter);
    }

    // Add new character
    characterGroup.name = 'character';
    this.scene.add(characterGroup);

    // Initialize player combat entity if not already done
    if (!this.player) {
      this.player = this.createPlayerEntity();
      this.combatVisualizer.createHealthBar(this.player);
    }
  }

  private createPlayerEntity(): CombatEntity {
    const player = {
      id: uuidv4(),
      name: 'Player',
      stats: {
        maxHealth: 100,
        currentHealth: 100,
        attack: 15,
        defense: 10,
        speed: 10,
        level: 1,
        maxEnergy: 100,
        currentEnergy: 100
      },
      position: new THREE.Vector3(0, 0, 0),
      isPlayer: true
    };

    // Apply meta upgrades to player stats
    this.progressionManager.applyMetaUpgrades(player);
    return player;
  }

  private async loadPlayerCharacter(): Promise<void> {
    try {
      // Load Mixamo character
      this.playerModel = await this.mixamoLoader.loadCharacter(
        '/models/characters/player.fbx',
        MixamoLoader.getDefaultAnimations()
      );

      // Set up character
      if (this.characterGroup) {
        this.scene.remove(this.characterGroup);
      }

      this.characterGroup = this.playerModel.model;
      this.characterGroup.position.set(0, 0, 0);
      this.characterGroup.name = 'character';
      this.scene.add(this.characterGroup);

      // Play idle animation
      const idleAction = this.playerModel.animations.get('idle');
      if (idleAction) {
        idleAction.play();
      }

      // Initialize player combat entity if not already done
      if (!this.player) {
        this.player = this.createPlayerEntity();
        this.combatVisualizer.createHealthBar(this.player);
      }
    } catch (error) {
      console.error('Failed to load player character:', error);
    }
  }

  private async startCombat(): Promise<void> {
    if (!this.player) return;

    // Start new run
    this.progressionManager.startNewRun();

    // Create combat manager with all systems
    this.combatManager = new CombatManager(
      this.player,
      this.skillManager,
      this.passiveManager,
      this.gearManager,
      this.progressionManager,
      this.enemySpawner
    );

    // Get current run difficulty
    const currentRun = this.progressionManager.getCurrentRun();
    const difficulty = currentRun ? currentRun.difficulty : 1;

    try {
      // Spawn enemies with scaled stats
      const spawnPromises = [];
      for (let i = 0; i < 3; i++) {
        spawnPromises.push(this.enemySpawner.spawnEnemy(Math.ceil(difficulty)));
      }

      const enemies = await Promise.all(spawnPromises);
      enemies.forEach(enemy => {
        this.combatManager?.addEnemy(enemy);
        this.combatVisualizer.createHealthBar(enemy);
      });

      // Start combat
      this.combatManager.startCombat();
    } catch (error) {
      console.error('Failed to spawn enemies:', error);
    }
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    // Throttle updates to target frame rate
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    if (deltaTime < this.FRAME_INTERVAL) return;

    // Update player animations
    if (this.playerModel) {
      this.playerModel.mixer.update(deltaTime);
    }

    // Update combat
    if (this.combatManager) {
      this.combatManager.update();

      // Update player position and animations
      if (this.player && this.characterGroup) {
        this.characterGroup.position.copy(this.player.position);
        this.combatVisualizer.updateHealthBar(this.player);

        // Handle player animations based on state
        if (this.playerModel) {
          const isMoving = this.player.position.distanceTo(this.characterGroup.position) > 0.01;
          const walkAction = this.playerModel.animations.get('walk');
          const idleAction = this.playerModel.animations.get('idle');

          if (isMoving && walkAction && idleAction) {
            walkAction.reset().play();
            idleAction.stop();
          } else if (!isMoving && walkAction && idleAction) {
            idleAction.reset().play();
            walkAction.stop();
          }
        }
      }

      // Check combat state
      const state = this.combatManager.getCurrentState();
      if (state === CombatState.VICTORY || state === CombatState.DEFEAT) {
        this.endCombat();
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.lastFrameTime = currentTime;
  }

  private endCombat(): void {
    // End the current run
    const state = this.combatManager?.getCurrentState();
    this.progressionManager.endRun(state === CombatState.VICTORY ? 'VICTORY' : 'DEFEAT');

    // Show progression UI
    this.progressionUI.show();

    // Clean up combat-related objects
    this.enemySpawner.cleanup();
    this.combatVisualizer.cleanup();
    this.combatManager = null;

    // Start new combat after delay
    setTimeout(() => {
      this.progressionUI.hide();
      this.startCombat();
    }, 3000);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public playPlayerAnimation(animationName: string): void {
    if (this.playerModel) {
      const action = this.playerModel.animations.get(animationName);
      if (action) {
        // Stop all current animations
        this.playerModel.animations.forEach(a => a.stop());
        // Play requested animation
        action.reset().play();
        // If it's not a looping animation, return to idle after it's done
        if (animationName === 'attack' || animationName === 'hit') {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
          setTimeout(() => {
            const idleAction = this.playerModel?.animations.get('idle');
            if (idleAction) {
              idleAction.reset().play();
            }
          }, action.getClip().duration * 1000);
        }
      }
    }
  }

  private async initialize(): Promise<void> {
    try {
      // Load player character
      await this.loadPlayerCharacter();

      // Start first run
      setTimeout(() => this.startCombat(), 2000);
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
  }
} 