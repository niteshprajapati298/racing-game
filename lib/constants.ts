export const REWARD_SCORE_THRESHOLD = 10000; // Score needed to be eligible for rewards

export const GAME_CONFIG = {
  FPS: 60,
  ROAD_WIDTH: 500, // Increased for better visibility
  LANE_COUNT: 3,
  CAR_WIDTH: 70,
  CAR_HEIGHT: 120,
  OBSTACLE_WIDTH: 70,
  OBSTACLE_HEIGHT: 120,
  SPEED_INCREMENT: 0.002, // Slightly faster progression
  BASE_SPEED: 5,
  MAX_SPEED: 18,
  SCORE_MULTIPLIER: 10,
  SPAWN_RATE: 0.02, // More obstacles for challenge
} as const;

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@racinggame.com';
