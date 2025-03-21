import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { AnimationClip, AnimationMixer } from 'three';

export interface MixamoModel {
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  animations: Map<string, THREE.AnimationAction>;
}

export class MixamoLoader {
  private loader: FBXLoader;
  private cache: Map<string, MixamoModel> = new Map();

  constructor() {
    this.loader = new FBXLoader();
  }

  public async loadCharacter(modelUrl: string, animationUrls: { [key: string]: string }): Promise<MixamoModel> {
    // Check cache first
    if (this.cache.has(modelUrl)) {
      return this.cloneMixamoModel(this.cache.get(modelUrl)!);
    }

    // Load character model
    const model = await this.loader.loadAsync(modelUrl);
    
    // Scale and rotate the model
    model.scale.setScalar(0.01); // Scale to 1% of original size
    model.rotation.y = Math.PI; // Rotate to face forward
    
    // Create animation mixer
    const mixer = new THREE.AnimationMixer(model);
    const animations = new Map<string, THREE.AnimationAction>();

    // Load all animations
    for (const [name, url] of Object.entries(animationUrls)) {
      const animationModel = await this.loader.loadAsync(url);
      const clip = animationModel.animations[0];
      
      // Retarget animation to our model
      clip.name = name;
      const action = mixer.clipAction(clip);
      animations.set(name, action);
    }

    const mixamoModel: MixamoModel = { model, mixer, animations };
    this.cache.set(modelUrl, mixamoModel);

    return this.cloneMixamoModel(mixamoModel);
  }

  private cloneMixamoModel(original: MixamoModel): MixamoModel {
    const model = original.model.clone(true);
    const mixer = new THREE.AnimationMixer(model);
    const animations = new Map<string, THREE.AnimationAction>();

    // Clone animations
    original.animations.forEach((originalAction, name) => {
      const clip = originalAction.getClip();
      const action = mixer.clipAction(clip);
      animations.set(name, action);
    });

    return { model, mixer, animations };
  }

  public static getDefaultAnimations(): { [key: string]: string } {
    return {
      'idle': '/models/animations/idle.fbx',
      'walk': '/models/animations/walking.fbx',
      'run': '/models/animations/running.fbx',
      'attack': '/models/animations/slash.fbx',
      'hit': '/models/animations/hit-reaction.fbx',
      'death': '/models/animations/dying.fbx'
    };
  }
} 