import { Game } from './game/Game';

// Create and initialize the game
const game = new Game();

// Handle any errors that occur during game initialization
window.addEventListener('error', (event) => {
  console.error('Game error:', event.error);
}); 