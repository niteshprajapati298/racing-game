// Web Worker for game calculations
// This runs in a separate thread to avoid blocking the main thread

self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'CALCULATE_SCORE':
      const { distance, time, speed } = data;
      const score = Math.floor(distance * 10 + time * 100);
      const newSpeed = Math.min(20, 5 + time * 0.1);
      
      self.postMessage({
        type: 'SCORE_CALCULATED',
        data: {
          score,
          speed: newSpeed,
        },
      });
      break;

    case 'CHECK_COLLISION':
      const { player, obstacles } = data;
      const collision = obstacles.some((obstacle) => {
        return (
          player.x < obstacle.x + obstacle.width &&
          player.x + player.width > obstacle.x &&
          player.y < obstacle.y + obstacle.height &&
          player.y + player.height > obstacle.y
        );
      });
      
      self.postMessage({
        type: 'COLLISION_RESULT',
        data: { collision },
      });
      break;

    default:
      break;
  }
};

