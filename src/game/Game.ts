import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager';
import { CameraController } from './camera/CameraController';
import { CharacterManager } from './character/CharacterManager';
import { CharacterCustomizationUI } from './character/CharacterCustomizationUI';
import { CharacterCustomization, CharacterPartType, AnimationType } from './character/types/CharacterData';

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private sceneManager: SceneManager;
  private cameraController: CameraController;
  private characterManager: CharacterManager;
  private customizationUI!: CharacterCustomizationUI;
  private clock: THREE.Clock;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.sceneManager = new SceneManager();
    this.cameraController = new CameraController(this.camera, this.renderer);
    this.characterManager = new CharacterManager();
    this.clock = new THREE.Clock();
  }

  public async init(): Promise<void> {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Get scene from scene manager
    this.scene = this.sceneManager.getScene();

    // Initialize UI
    this.customizationUI = new CharacterCustomizationUI(
      'customization-container',
      {
        parts: {
          [CharacterPartType.BODY]: {
            id: 'default-body',
            name: 'Default Body',
            modelUrl: '/models/body.glb',
            type: CharacterPartType.BODY
          },
          [CharacterPartType.HEAD]: {
            id: 'default-head',
            name: 'Default Head',
            modelUrl: '/models/head.glb',
            type: CharacterPartType.HEAD
          },
          [CharacterPartType.LEFT_ARM]: {
            id: 'default-left-arm',
            name: 'Default Left Arm',
            modelUrl: '/models/left-arm.glb',
            type: CharacterPartType.LEFT_ARM
          },
          [CharacterPartType.RIGHT_ARM]: {
            id: 'default-right-arm',
            name: 'Default Right Arm',
            modelUrl: '/models/right-arm.glb',
            type: CharacterPartType.RIGHT_ARM
          },
          [CharacterPartType.LEFT_LEG]: {
            id: 'default-left-leg',
            name: 'Default Left Leg',
            modelUrl: '/models/left-leg.glb',
            type: CharacterPartType.LEFT_LEG
          },
          [CharacterPartType.RIGHT_LEG]: {
            id: 'default-right-leg',
            name: 'Default Right Leg',
            modelUrl: '/models/right-leg.glb',
            type: CharacterPartType.RIGHT_LEG
          },
          [CharacterPartType.WEAPON]: {
            id: 'default-weapon',
            name: 'Default Weapon',
            modelUrl: '/models/weapon.glb',
            type: CharacterPartType.WEAPON
          },
          [CharacterPartType.ACCESSORY]: {
            id: 'default-accessory',
            name: 'Default Accessory',
            modelUrl: '/models/accessory.glb',
            type: CharacterPartType.ACCESSORY
          }
        },
        colors: {
          'body-material': '#808080',
          'head-material': '#808080',
          'arm-material': '#808080',
          'leg-material': '#808080',
          'weapon-material': '#808080',
          'accessory-material': '#808080'
        },
        animations: [
          {
            id: 'idle-animation',
            name: 'Idle',
            url: '/animations/idle.glb',
            type: AnimationType.IDLE,
            loop: true,
            duration: 2
          }
        ]
      },
      (customization) => {
        this.characterManager.loadCharacter(customization);
      }
    );

    // Load initial character
    const characterGroup = this.characterManager.getCharacterGroup();
    characterGroup.position.set(0, 0, 0);
    this.scene.add(characterGroup);

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start animation loop
    this.animate();
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();

    // Update camera controls
    this.cameraController.update();

    // Update character animations
    this.characterManager.update(deltaTime);

    this.renderer.render(this.scene, this.camera);
  }
} 