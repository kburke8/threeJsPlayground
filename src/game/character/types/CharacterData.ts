export interface CharacterPart {
  id: string;
  name: string;
  modelUrl: string;
  type: CharacterPartType;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
}

export enum CharacterPartType {
  BODY = 'body',
  HEAD = 'head',
  LEFT_ARM = 'leftArm',
  RIGHT_ARM = 'rightArm',
  LEFT_LEG = 'leftLeg',
  RIGHT_LEG = 'rightLeg',
  WEAPON = 'weapon',
  ACCESSORY = 'accessory'
}

export interface CharacterCustomization {
  parts: Record<CharacterPartType, CharacterPart>;
  colors: Record<string, string>;
  animations: CharacterAnimation[];
}

export interface CharacterAnimation {
  id: string;
  name: string;
  url: string;
  type: AnimationType;
  loop: boolean;
  duration: number;
}

export enum AnimationType {
  IDLE = 'idle',
  WALK = 'walk',
  RUN = 'run',
  ATTACK = 'attack',
  HIT = 'hit',
  DEATH = 'death'
}

export interface CharacterState {
  currentAnimation: AnimationType;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
} 