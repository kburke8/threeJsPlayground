import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { CharacterPartType } from '../types/CharacterData';

export async function createBasicModel(type: CharacterPartType): Promise<string> {
  const scene = new THREE.Scene();
  const material = new THREE.MeshStandardMaterial({ 
    name: `${type.toLowerCase()}-material`,
    color: 0x808080,
    metalness: 0.5,
    roughness: 0.5
  });

  let mesh: THREE.Mesh;
  switch (type) {
    case CharacterPartType.BODY:
      // Create a more detailed body with shoulders and hips
      const bodyGroup = new THREE.Group();
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.2, 0.6),
        material.clone()
      );
      torso.position.y = 1.2;
      bodyGroup.add(torso);

      // Add shoulders
      const shoulderGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const leftShoulder = new THREE.Mesh(shoulderGeometry, material.clone());
      leftShoulder.position.set(-0.5, 1.8, 0);
      bodyGroup.add(leftShoulder);

      const rightShoulder = new THREE.Mesh(shoulderGeometry, material.clone());
      rightShoulder.position.set(0.5, 1.8, 0);
      bodyGroup.add(rightShoulder);

      // Add hips
      const hipGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const leftHip = new THREE.Mesh(hipGeometry, material.clone());
      leftHip.position.set(-0.3, 0.6, 0);
      bodyGroup.add(leftHip);

      const rightHip = new THREE.Mesh(hipGeometry, material.clone());
      rightHip.position.set(0.3, 0.6, 0);
      bodyGroup.add(rightHip);

      scene.add(bodyGroup);
      break;

    case CharacterPartType.HEAD:
      // Create a more detailed head with face features
      const headGroup = new THREE.Group();
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 32, 32),
        material.clone()
      );
      head.position.y = 2.4; // Position head above body
      headGroup.add(head);

      // Add eyes
      const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
      const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.15, 0.1, 0.35);
      leftEye.position.y += 2.4; // Add head's y position
      headGroup.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.15, 0.1, 0.35);
      rightEye.position.y += 2.4; // Add head's y position
      headGroup.add(rightEye);

      // Add mouth
      const mouthGeometry = new THREE.TorusGeometry(0.1, 0.02, 16, 100);
      const mouth = new THREE.Mesh(mouthGeometry, eyeMaterial);
      mouth.position.set(0, -0.1, 0.35);
      mouth.position.y += 2.4; // Add head's y position
      mouth.rotation.x = Math.PI / 2;
      headGroup.add(mouth);

      scene.add(headGroup);
      break;

    case CharacterPartType.LEFT_ARM:
    case CharacterPartType.RIGHT_ARM:
      const armGroup = new THREE.Group();
      const upperArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16),
        material.clone()
      );
      upperArm.position.y = 1.8; // Align with shoulders
      upperArm.rotation.x = Math.PI / 2; // Rotate to hang down
      armGroup.add(upperArm);

      const elbow = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        material.clone()
      );
      elbow.position.y = 1.5;
      armGroup.add(elbow);

      const forearm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16),
        material.clone()
      );
      forearm.position.y = 1.2;
      forearm.rotation.x = Math.PI / 2; // Rotate to hang down
      armGroup.add(forearm);

      const hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        material.clone()
      );
      hand.position.y = 0.9;
      armGroup.add(hand);

      if (type === CharacterPartType.LEFT_ARM) {
        armGroup.position.x = -0.5; // Align with left shoulder
        armGroup.rotation.y = Math.PI; // Flip the entire arm group for left arm
      } else {
        armGroup.position.x = 0.5; // Align with right shoulder
      }

      scene.add(armGroup);
      break;

    case CharacterPartType.LEFT_LEG:
    case CharacterPartType.RIGHT_LEG:
      const legGroup = new THREE.Group();
      const thigh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16),
        material.clone()
      );
      thigh.position.y = 0.6; // Align with hips
      legGroup.add(thigh);

      const knee = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        material.clone()
      );
      knee.position.y = 0.2;
      legGroup.add(knee);

      const calf = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16),
        material.clone()
      );
      calf.position.y = -0.2;
      legGroup.add(calf);

      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.2, 0.4),
        material.clone()
      );
      foot.position.y = -0.6;
      foot.position.z = 0.1;
      legGroup.add(foot);

      if (type === CharacterPartType.LEFT_LEG) {
        legGroup.position.x = -0.3; // Align with left hip
      } else {
        legGroup.position.x = 0.3; // Align with right hip
      }

      scene.add(legGroup);
      break;

    case CharacterPartType.WEAPON:
      const weaponGroup = new THREE.Group();
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16),
        material.clone()
      );
      handle.position.y = 1.5; // Position at hand level
      handle.position.x = 0.7; // Position to the right of the character
      handle.rotation.x = Math.PI / 2;
      weaponGroup.add(handle);

      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.8, 0.05),
        material.clone()
      );
      blade.position.y = 1.7;
      blade.position.x = 0.7;
      weaponGroup.add(blade);

      const guard = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.1, 0.1),
        material.clone()
      );
      guard.position.y = 1.5;
      guard.position.x = 0.7;
      weaponGroup.add(guard);

      scene.add(weaponGroup);
      break;

    case CharacterPartType.ACCESSORY:
      const accessoryGroup = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.15, 0.02, 16, 100),
        material.clone()
      );
      ring.position.y = 1.8; // Position at shoulder level
      ring.position.x = -0.5; // Position on left side
      accessoryGroup.add(ring);

      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.05, 0),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      );
      gem.position.y = 1.8;
      gem.position.x = -0.5;
      accessoryGroup.add(gem);

      scene.add(accessoryGroup);
      break;
  }

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