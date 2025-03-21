import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CharacterPart, CharacterPartType, CharacterCustomization, CharacterState, AnimationType, CharacterAnimation } from './types/CharacterData';
import { createBasicModel } from './utils/createBasicModels';

export class CharacterManager {
  private gltfLoader: GLTFLoader;
  private characterGroup: THREE.Group;
  private parts: Map<CharacterPartType, THREE.Group>;
  private mixer!: THREE.AnimationMixer;
  private animations: Map<AnimationType, THREE.AnimationClip>;
  private currentState: CharacterState;

  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.characterGroup = new THREE.Group();
    this.parts = new Map();
    this.animations = new Map();
    this.currentState = {
      currentAnimation: AnimationType.IDLE,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    };
  }

  public async loadCharacter(customization: CharacterCustomization): Promise<THREE.Group> {
    // Clear existing parts
    this.parts.clear();
    this.characterGroup.clear();

    // Load each part
    for (const [type, part] of Object.entries(customization.parts)) {
      await this.loadPart(part as CharacterPart, type as CharacterPartType);
    }

    // Apply colors
    this.applyColors(customization.colors);

    // Load animations
    await this.loadAnimations(customization.animations);

    // Setup animation mixer
    this.mixer = new THREE.AnimationMixer(this.characterGroup);

    return this.characterGroup;
  }

  private async loadPart(part: CharacterPart, type: CharacterPartType): Promise<void> {
    try {
      // If we have a model URL, try to load it
      if (part.modelUrl) {
        await this.loadModelFromUrl(part.modelUrl, type);
      } else {
        // Otherwise use basic model
        const basicModelUrl = await createBasicModel(type);
        await this.loadModelFromUrl(basicModelUrl, type);
      }
    } catch (error) {
      console.warn(`Failed to load model for ${type}, using basic model:`, error);
      // Create and load a basic model as fallback
      const basicModelUrl = await createBasicModel(type);
      await this.loadModelFromUrl(basicModelUrl, type);
    }
  }

  private async loadModelFromUrl(url: string, type: CharacterPartType): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf: { scene: THREE.Group }) => {
          const partGroup = gltf.scene;
          this.parts.set(type, partGroup);
          this.characterGroup.add(partGroup);
          resolve();
        },
        undefined,
        reject
      );
    });
  }

  private async loadAnimations(animations: CharacterAnimation[]): Promise<void> {
    for (const animation of animations) {
      try {
        const gltf = await this.gltfLoader.loadAsync(animation.url);
        const clip = gltf.animations[0];
        this.animations.set(animation.type, clip);
      } catch (error) {
        console.warn(`Failed to load animation ${animation.type}:`, error);
        // Create a simple rotation animation as placeholder
        const clip = this.createPlaceholderAnimation(animation.type);
        this.animations.set(animation.type, clip);
      }
    }
  }

  private createPlaceholderAnimation(type: AnimationType): THREE.AnimationClip {
    const times = [0, 2];
    const values = [0, 2 * Math.PI];
    const track = new THREE.KeyframeTrack(
      '.rotation[y]',
      times,
      values
    );
    return new THREE.AnimationClip(type, 2, [track]);
  }

  private applyColors(colors: Record<string, string>): void {
    this.characterGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.name in colors) {
          material.color.setStyle(colors[material.name]);
        }
      }
    });
  }

  public update(deltaTime: number): void {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  public playAnimation(type: AnimationType): void {
    if (!this.mixer || !this.animations.has(type)) return;

    const clip = this.animations.get(type);
    if (!clip) return;

    const action = this.mixer.clipAction(clip);
    action.reset();
    action.play();

    this.currentState.currentAnimation = type;
  }

  public getCharacterGroup(): THREE.Group {
    return this.characterGroup;
  }

  public getCurrentState(): CharacterState {
    return this.currentState;
  }
} 