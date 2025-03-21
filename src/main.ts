import { Game } from './game/Game';

const game = new Game();
game.init().catch((error) => {
  console.error('Failed to initialize game:', error);
}); 