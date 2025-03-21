import * as THREE from 'three';

export class SceneManager {
  private scene: THREE.Scene;
  private ground: THREE.Mesh;
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  constructor() {
    this.scene = new THREE.Scene();
    this.setupLights();
    this.setupGround();
  }

  private setupLights(): void {
    // Main directional light (sun-like)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(5, 5, 5);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(this.directionalLight);

    // Ambient light for overall scene illumination
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(this.ambientLight);
  }

  private setupGround(): void {
    // Create a large ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Add a grid helper for better spatial reference
    const gridHelper = new THREE.GridHelper(20, 20);
    this.scene.add(gridHelper);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getGround(): THREE.Mesh {
    return this.ground;
  }
} 