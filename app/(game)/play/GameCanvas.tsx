'use client';

import { useEffect, useRef, memo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GAME_CONFIG } from '@/lib/constants';

interface GameCanvasProps {
  onGameOver: () => void;
  onMoveLeft?: (fn: () => void) => void;
  onMoveRight?: (fn: () => void) => void;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  lane: number;
  colorHue: number;
}

const GameCanvas = memo(({ onGameOver, onMoveLeft, onMoveRight }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const gameStateRef = useRef<{
    car: { x: number; y: number; width: number; height: number };
    obstacles: Obstacle[];
    roadOffset: number;
    score: number;
    distance: number;
    time: number;
    speed: number;
    lastTime: number;
    keys: { left: boolean; right: boolean };
    roadX: number;
    isRunning: boolean;
    colorCycle: number;
  }>({
    car: { x: 0, y: 0, width: GAME_CONFIG.CAR_WIDTH, height: GAME_CONFIG.CAR_HEIGHT },
    obstacles: [],
    roadOffset: 0,
    score: 0,
    distance: 0,
    time: 0,
    speed: GAME_CONFIG.BASE_SPEED,
    lastTime: 0,
    keys: { left: false, right: false },
    roadX: 0,
    isRunning: false,
    colorCycle: 0,
  });

  const { isPlaying, isPaused, gameOver, setScore, setDistance, setSpeed, setTime } = useGameStore();

  // Expose movement functions to parent
  useEffect(() => {
    const handleMoveLeft = () => {
      if (isPlaying && !isPaused && !gameOver) {
        gameStateRef.current.keys.left = true;
        setTimeout(() => {
          gameStateRef.current.keys.left = false;
        }, 150);
      }
    };

    const handleMoveRight = () => {
      if (isPlaying && !isPaused && !gameOver) {
        gameStateRef.current.keys.right = true;
        setTimeout(() => {
          gameStateRef.current.keys.right = false;
        }, 150);
      }
    };

    if (onMoveLeft) onMoveLeft(handleMoveLeft);
    if (onMoveRight) onMoveRight(handleMoveRight);
  }, [isPlaying, isPaused, gameOver, onMoveLeft, onMoveRight]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const state = gameStateRef.current;
      state.roadX = (canvas.width - GAME_CONFIG.ROAD_WIDTH) / 2;
      state.car.x = canvas.width / 2 - GAME_CONFIG.CAR_WIDTH / 2;
      state.car.y = canvas.height - GAME_CONFIG.CAR_HEIGHT - 50;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;
      
      const state = gameStateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.keys.left = true;
        e.preventDefault();
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.keys.right = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isPaused, gameOver]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStartX = 0;
    let isTouching = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isPlaying || isPaused || gameOver) return;
      touchStartX = e.touches[0].clientX;
      isTouching = true;
      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching || !isPlaying || isPaused || gameOver) return;
      const state = gameStateRef.current;
      const touchX = e.touches[0].clientX;
      const diff = touchX - touchStartX;
      
      state.keys.left = diff < -30;
      state.keys.right = diff > 30;
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      const state = gameStateRef.current;
      state.keys.left = false;
      state.keys.right = false;
      isTouching = false;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPlaying, isPaused, gameOver]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;

    // Reset game state when starting
    if (isPlaying && !isPaused && !gameOver && !state.isRunning) {
      state.obstacles = [];
      state.score = 0;
      state.distance = 0;
      state.time = 0;
      state.speed = GAME_CONFIG.BASE_SPEED;
      state.lastTime = performance.now();
      state.roadOffset = 0;
      state.colorCycle = 0;
      state.car.x = canvas.width / 2 - GAME_CONFIG.CAR_WIDTH / 2;
      state.car.y = canvas.height - GAME_CONFIG.CAR_HEIGHT - 50;
    }

    // Helper function to get RGB color from hue
    const hslToRgb = (h: number, s: number, l: number): string => {
      h = h % 360;
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - c / 2;
      let r = 0, g = 0, b = 0;

      if (h < 60) { r = c; g = x; b = 0; }
      else if (h < 120) { r = x; g = c; b = 0; }
      else if (h < 180) { r = 0; g = c; b = x; }
      else if (h < 240) { r = 0; g = x; b = c; }
      else if (h < 300) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }

      return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`;
    };

    const drawRoad = () => {
      // Animated gradient background with RGB colors
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      const hue1 = (state.colorCycle) % 360;
      const hue2 = (state.colorCycle + 60) % 360;
      const hue3 = (state.colorCycle + 120) % 360;
      
      bgGradient.addColorStop(0, hslToRgb(hue1, 0.8, 0.05));
      bgGradient.addColorStop(0.5, hslToRgb(hue2, 0.8, 0.08));
      bgGradient.addColorStop(1, hslToRgb(hue3, 0.8, 0.05));
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road with colorful gradient
      const roadGradient = ctx.createLinearGradient(state.roadX, 0, state.roadX + GAME_CONFIG.ROAD_WIDTH, 0);
      roadGradient.addColorStop(0, hslToRgb((state.colorCycle + 180) % 360, 0.6, 0.15));
      roadGradient.addColorStop(0.5, hslToRgb((state.colorCycle + 240) % 360, 0.7, 0.25));
      roadGradient.addColorStop(1, hslToRgb((state.colorCycle + 180) % 360, 0.6, 0.15));
      ctx.fillStyle = roadGradient;
      ctx.fillRect(state.roadX, 0, GAME_CONFIG.ROAD_WIDTH, canvas.height);

      // Colorful lane lines with RGB cycling
      const laneWidth = GAME_CONFIG.ROAD_WIDTH / GAME_CONFIG.LANE_COUNT;
      for (let i = 1; i < GAME_CONFIG.LANE_COUNT; i++) {
        const lineHue = (state.colorCycle + i * 60) % 360;
        ctx.strokeStyle = hslToRgb(lineHue, 1, 0.5);
        ctx.lineWidth = 4;
        ctx.setLineDash([40, 30]);
        ctx.lineDashOffset = -state.roadOffset;
        ctx.shadowBlur = 20;
        ctx.shadowColor = hslToRgb(lineHue, 1, 0.5);
        
        ctx.beginPath();
        ctx.moveTo(state.roadX + i * laneWidth, 0);
        ctx.lineTo(state.roadX + i * laneWidth, canvas.height);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Colorful road borders with RGB glow
      const borderHue = (state.colorCycle + 90) % 360;
      ctx.strokeStyle = hslToRgb(borderHue, 1, 0.6);
      ctx.lineWidth = 6;
      ctx.shadowBlur = 25;
      ctx.shadowColor = hslToRgb(borderHue, 1, 0.6);
      
      ctx.beginPath();
      ctx.moveTo(state.roadX, 0);
      ctx.lineTo(state.roadX, canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(state.roadX + GAME_CONFIG.ROAD_WIDTH, 0);
      ctx.lineTo(state.roadX + GAME_CONFIG.ROAD_WIDTH, canvas.height);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawCar = (x: number, y: number, isPlayer: boolean, colorHue?: number) => {
      ctx.save();
      
      if (isPlayer) {
        // Player car with RGB gradient
        const carHue = (state.colorCycle + 180) % 360;
        const gradient = ctx.createLinearGradient(x, y, x, y + GAME_CONFIG.CAR_HEIGHT);
        gradient.addColorStop(0, hslToRgb(carHue, 1, 0.7));
        gradient.addColorStop(0.3, hslToRgb((carHue + 30) % 360, 1, 0.6));
        gradient.addColorStop(0.7, hslToRgb((carHue + 60) % 360, 1, 0.5));
        gradient.addColorStop(1, hslToRgb((carHue + 90) % 360, 1, 0.4));

        ctx.shadowBlur = 30;
        ctx.shadowColor = hslToRgb(carHue, 1, 0.6);
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 5, y + 15, GAME_CONFIG.CAR_WIDTH - 10, GAME_CONFIG.CAR_HEIGHT - 20);

        // Hood
        ctx.fillStyle = hslToRgb((carHue + 15) % 360, 1, 0.65);
        ctx.fillRect(x + 10, y + 5, GAME_CONFIG.CAR_WIDTH - 20, 25);

        // Windshield with RGB tint
        ctx.fillStyle = hslToRgb((carHue + 45) % 360, 0.8, 0.3);
        ctx.fillRect(x + 12, y + 25, GAME_CONFIG.CAR_WIDTH - 24, 20);

        // Headlights with RGB glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = hslToRgb(carHue, 1, 0.7);
        ctx.fillStyle = hslToRgb(carHue, 1, 0.8);
        ctx.fillRect(x + 8, y + 3, 8, 5);
        ctx.fillRect(x + GAME_CONFIG.CAR_WIDTH - 16, y + 3, 8, 5);

        // Tail lights
        ctx.fillStyle = hslToRgb(0, 1, 0.6);
        ctx.shadowColor = hslToRgb(0, 1, 0.8);
        ctx.fillRect(x + 8, y + GAME_CONFIG.CAR_HEIGHT - 8, 10, 5);
        ctx.fillRect(x + GAME_CONFIG.CAR_WIDTH - 18, y + GAME_CONFIG.CAR_HEIGHT - 8, 10, 5);
      } else {
        // Enemy car with different RGB colors
        const obstacleHue = colorHue !== undefined ? (colorHue + state.colorCycle) % 360 : (state.colorCycle + 60) % 360;
        const gradient = ctx.createLinearGradient(x, y, x, y + GAME_CONFIG.CAR_HEIGHT);
        gradient.addColorStop(0, hslToRgb(obstacleHue, 1, 0.7));
        gradient.addColorStop(0.3, hslToRgb((obstacleHue + 30) % 360, 1, 0.6));
        gradient.addColorStop(0.7, hslToRgb((obstacleHue + 60) % 360, 1, 0.5));
        gradient.addColorStop(1, hslToRgb((obstacleHue + 90) % 360, 1, 0.4));

        ctx.shadowBlur = 25;
        ctx.shadowColor = hslToRgb(obstacleHue, 1, 0.6);
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 5, y + 15, GAME_CONFIG.CAR_WIDTH - 10, GAME_CONFIG.CAR_HEIGHT - 20);

        // Hood
        ctx.fillStyle = hslToRgb((obstacleHue + 15) % 360, 1, 0.65);
        ctx.fillRect(x + 10, y + 5, GAME_CONFIG.CAR_WIDTH - 20, 25);

        // Windshield
        ctx.fillStyle = hslToRgb((obstacleHue + 45) % 360, 0.8, 0.3);
        ctx.fillRect(x + 12, y + 25, GAME_CONFIG.CAR_WIDTH - 24, 20);

        // Headlights
        ctx.shadowBlur = 15;
        ctx.shadowColor = hslToRgb(obstacleHue, 1, 0.7);
        ctx.fillStyle = hslToRgb(obstacleHue, 1, 0.8);
        ctx.fillRect(x + 8, y + 3, 8, 5);
        ctx.fillRect(x + GAME_CONFIG.CAR_WIDTH - 16, y + 3, 8, 5);

        // Tail lights
        ctx.fillStyle = hslToRgb(0, 1, 0.6);
        ctx.shadowColor = hslToRgb(0, 1, 0.8);
        ctx.fillRect(x + 8, y + GAME_CONFIG.CAR_HEIGHT - 8, 10, 5);
        ctx.fillRect(x + GAME_CONFIG.CAR_WIDTH - 18, y + GAME_CONFIG.CAR_HEIGHT - 8, 10, 5);
      }

      ctx.restore();
    };

    const spawnObstacle = () => {
      const lane = Math.floor(Math.random() * GAME_CONFIG.LANE_COUNT);
      const laneWidth = GAME_CONFIG.ROAD_WIDTH / GAME_CONFIG.LANE_COUNT;
      const x = state.roadX + lane * laneWidth + (laneWidth - GAME_CONFIG.OBSTACLE_WIDTH) / 2;
      
      const tooClose = state.obstacles.some(
        obs => obs.lane === lane && obs.y < 200
      );
      
      if (!tooClose) {
        state.obstacles.push({
          x,
          y: -GAME_CONFIG.OBSTACLE_HEIGHT,
          width: GAME_CONFIG.OBSTACLE_WIDTH,
          height: GAME_CONFIG.OBSTACLE_HEIGHT,
          lane,
          colorHue: Math.random() * 360, // Random hue for each obstacle
        });
      }
    };

    const checkCollision = (): boolean => {
      const car = state.car;
      const carHitbox = {
        x: car.x + 8,
        y: car.y + 10,
        width: car.width - 16,
        height: car.height - 15,
      };

      return state.obstacles.some(obs => {
        const obsHitbox = {
          x: obs.x + 8,
          y: obs.y + 10,
          width: obs.width - 16,
          height: obs.height - 15,
        };
        
        return (
          carHitbox.x < obsHitbox.x + obsHitbox.width &&
          carHitbox.x + carHitbox.width > obsHitbox.x &&
          carHitbox.y < obsHitbox.y + obsHitbox.height &&
          carHitbox.y + carHitbox.height > obsHitbox.y
        );
      });
    };

    const gameLoop = (currentTime: number) => {
      if (!state.isRunning || !isPlaying || isPaused || gameOver) {
        state.isRunning = false;
        return;
      }

      const deltaTime = Math.min((currentTime - state.lastTime) / 1000, 0.1);
      state.lastTime = currentTime;

      // Update color cycle for RGB animation
      state.colorCycle = (state.colorCycle + deltaTime * 30) % 360;

      // Update car position
      const moveSpeed = 400 * deltaTime;
      const minX = state.roadX + 10;
      const maxX = state.roadX + GAME_CONFIG.ROAD_WIDTH - GAME_CONFIG.CAR_WIDTH - 10;

      if (state.keys.left) {
        state.car.x = Math.max(minX, state.car.x - moveSpeed);
      }
      if (state.keys.right) {
        state.car.x = Math.min(maxX, state.car.x + moveSpeed);
      }

      // Update road animation
      state.roadOffset += state.speed * 60 * deltaTime;
      if (state.roadOffset > 70) state.roadOffset = 0;

      // Update obstacles
      state.obstacles = state.obstacles
        .map(obs => ({ ...obs, y: obs.y + state.speed * 60 * deltaTime }))
        .filter(obs => obs.y < canvas.height + 100);

      // Spawn obstacles
      if (Math.random() < GAME_CONFIG.SPAWN_RATE) {
        spawnObstacle();
      }

      // Update game stats
      state.distance += state.speed * deltaTime * 10;
      state.time += deltaTime;
      state.speed = Math.min(GAME_CONFIG.MAX_SPEED, GAME_CONFIG.BASE_SPEED + state.time * GAME_CONFIG.SPEED_INCREMENT * 10);
      state.score = Math.floor(state.distance * GAME_CONFIG.SCORE_MULTIPLIER);

      // Update store
      setScore(state.score);
      setDistance(state.distance);
      setTime(state.time);
      setSpeed(state.speed);

      // Check collision
      if (checkCollision()) {
        state.isRunning = false;
        onGameOver();
        return;
      }

      // Draw everything
      drawRoad();
      
      // Draw obstacles
      state.obstacles.forEach(obs => {
        drawCar(obs.x, obs.y, false, obs.colorHue);
      });

      // Draw player car
      drawCar(state.car.x, state.car.y, true);

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    // Start or stop game loop
    if (isPlaying && !isPaused && !gameOver) {
      if (!state.isRunning) {
        state.isRunning = true;
        state.lastTime = performance.now();
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    } else {
      state.isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Draw static frame when paused
      if (isPlaying && isPaused) {
        drawRoad();
        state.obstacles.forEach(obs => drawCar(obs.x, obs.y, false, obs.colorHue));
        drawCar(state.car.x, state.car.y, true);
      }
    }

    return () => {
      state.isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, isPaused, gameOver, onGameOver, setScore, setDistance, setSpeed, setTime]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full touch-none"
      style={{ display: 'block' }}
    />
  );
});

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;
