import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { CharacterPartType } from '../types/CharacterData';

export async function createPlaceholderModel(type: CharacterPartType): Promise<string> {
  const scene = new THREE.Scene();
  const material = new THREE.MeshStandardMaterial({ color: 0x808080 });

  let geometry: THREE.BufferGeometry = new THREE.BoxGeometry(1, 1, 1); // Default geometry
  switch (type) {
    case CharacterPartType.BODY:
      geometry = new THREE.BoxGeometry(1, 2, 1);
      break;
    case CharacterPartType.HEAD:
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
      break;
    case CharacterPartType.LEFT_ARM:
    case CharacterPartType.RIGHT_ARM:
      geometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 32);
      break;
    case CharacterPartType.LEFT_LEG:
    case CharacterPartType.RIGHT_LEG:
      geometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 32);
      break;
    case CharacterPartType.WEAPON:
      geometry = new THREE.BoxGeometry(0.2, 2, 0.2);
      break;
    case CharacterPartType.ACCESSORY:
      geometry = new THREE.TorusGeometry(0.3, 0.1, 16, 100);
      break;
  }

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf: any) => {
        const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        resolve(url);
      },
      (error: ErrorEvent) => {
        reject(new Error(error.message));
      }
    );
  });
} 