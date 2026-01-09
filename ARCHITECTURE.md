# Architecture Explanation

## 📂 Folder Structure Breakdown

### `/app` - Next.js App Router
Next.js 14+ uses the App Router for file-based routing. Each folder represents a route.

#### `/(auth)` - Authentication Routes
- **Route Groups**: Parentheses `()` create route groups without affecting the URL
- `/login` → `http://localhost:3000/login`
- `/register` → `http://localhost:3000/register`
- These pages handle user authentication with form validation

#### `/(game)` - Game Routes
- `/play` → Main game page
  - `GameCanvas.tsx`: Core game engine using HTML5 Canvas
  - `HUD.tsx`: Heads-up display (score, speed, time)
  - `page.tsx`: Game page container with start/end screens

#### `/(admin)` - Admin Routes
- `/admin` → Admin panel (protected, requires admin email)
- Displays user statistics and scores

#### `/api` - API Routes
Next.js API routes replace the need for a separate Express server.

- `/api/auth/*`: Authentication endpoints
  - `login`: User login, returns JWT token
  - `register`: User registration with DOB validation
  - `verify`: Token verification endpoint

- `/api/score/submit`: Save game scores
  - Validates score authenticity (prevents tampering)
  - Updates user's best score
  - Checks reward eligibility threshold

- `/api/user/profile`: Get user profile data

- `/api/admin/*`: Admin-only endpoints
  - `users`: Paginated user list with statistics
  - `stats`: Overall platform statistics

### `/components` - Reusable Components

#### `/ui` - Base UI Components
- `Button.tsx`: Styled button with variants (primary, secondary, danger)
- `Input.tsx`: Form input with label and error handling
- `Card.tsx`: Glassmorphism card container

#### `/forms` - Form Components
- `LoginForm.tsx`: Login form with validation
- `RegisterForm.tsx`: Registration form with DOB validation

### `/lib` - Utility Libraries

- `mongodb.ts`: MongoDB connection handler with connection pooling
- `auth.ts`: JWT token generation/verification, password hashing
- `constants.ts`: Game configuration and constants (FPS, speeds, thresholds)

### `/models` - Database Schemas

- `User.ts`: User model with email, password (hashed), DOB, bestScore, rewardEligible
- `Score.ts`: Score history model for tracking all game sessions

### `/store` - State Management

- `gameStore.ts`: Zustand store for game state
  - `isPlaying`, `isPaused`, `score`, `distance`, `speed`, `time`, `gameOver`
  - Actions: `setPlaying`, `setPaused`, `setScore`, etc.

### `/public` - Static Assets

- `gameWorker.js`: Web Worker for offloading heavy calculations (optional)

---

## 🎮 Game Loop Logic Explained

### How the Game Works

1. **Initialization** (`GameCanvas.tsx`):
   - Canvas element created and sized to viewport
   - Event listeners attached for keyboard/touch input
   - Game state initialized (player position, obstacles array)

2. **Game Loop** (requestAnimationFrame):
   ```
   ┌─────────────────────────────────┐
   │ 1. Handle Input                 │
   │    - Update playerX based on   │
   │      keyboard/touch events      │
   └────────────┬────────────────────┘
                │
   ┌────────────▼────────────────────┐
   │ 2. Update Game State            │
   │    - Move obstacles down        │
   │    - Spawn new obstacles        │
   │    - Update road animation      │
   │    - Calculate score/speed      │
   └────────────┬────────────────────┘
                │
   ┌────────────▼────────────────────┐
   │ 3. Collision Detection          │
   │    - Check player vs obstacles  │
   │    - Trigger game over if hit   │
   └────────────┬────────────────────┘
                │
   ┌────────────▼────────────────────┐
   │ 4. Render Frame                 │
   │    - Clear canvas               │
   │    - Draw road                  │
   │    - Draw obstacles             │
   │    - Draw player car            │
   └────────────┬────────────────────┘
                │
   ┌────────────▼────────────────────┐
   │ 5. Request Next Frame           │
   │    - requestAnimationFrame()    │
   └─────────────────────────────────┘
   ```

3. **Performance Optimizations**:
   - **Refs instead of State**: Game loop uses `useRef` to avoid React re-renders
   - **Memoization**: `React.memo` on GameCanvas and HUD
   - **Dynamic Imports**: Game components loaded only when needed
   - **requestAnimationFrame**: Synchronized with browser refresh (60 FPS)

---

## 🔐 Authentication Flow

### Registration Flow
```
User fills form → Client validation (Zod) → POST /api/auth/register
→ Server validates → Hash password (bcrypt) → Create user in MongoDB
→ Generate JWT → Return token + user data → Store in localStorage
→ Redirect to /play
```

### Login Flow
```
User fills form → POST /api/auth/login → Find user in MongoDB
→ Verify password (bcrypt.compare) → Generate JWT → Return token
→ Store in localStorage → Redirect to /play
```

### Protected Routes
```
User navigates to /play → Check localStorage for token
→ If no token → Redirect to /login
→ If token exists → Allow access (verify on API calls)
```

### API Route Protection
```
Request → Extract token from Authorization header
→ Verify JWT signature → Extract userId/email
→ Query database → Return data
```

---

## 🎯 Score & Rewards System

### Score Calculation
```typescript
score = Math.floor(distance × 10 + time × 100)
speed = Math.min(MAX_SPEED, BASE_SPEED + time × 0.1)
```

### Score Submission Flow
```
Game Over → POST /api/score/submit
→ Verify token → Validate score (prevent tampering)
→ Save to Score collection → Update User.bestScore
→ Check if score >= REWARD_SCORE_THRESHOLD (10,000)
→ If yes → Set User.rewardEligible = true
→ Return success + rewardEligible status
```

### Extending Rewards

**Option 1: Email Integration**
```typescript
// In /api/score/submit/route.ts
if (user.rewardEligible && !user.rewardEmailSent) {
  await sendEmail({
    to: user.email,
    subject: 'Congratulations!',
    template: 'reward-eligible'
  });
  user.rewardEmailSent = true;
  await user.save();
}
```

**Option 2: Webhook Integration**
```typescript
if (user.rewardEligible) {
  await fetch('https://your-reward-service.com/webhook', {
    method: 'POST',
    body: JSON.stringify({ userId: user._id, email: user.email })
  });
}
```

---

## 🚀 Performance Optimizations Explained

### 1. requestAnimationFrame
- **Why**: Synchronizes with browser's refresh rate (60 FPS)
- **Benefit**: Smooth animations, automatic pause when tab inactive
- **Usage**: Game loop runs in `requestAnimationFrame` callback

### 2. React.memo
- **Why**: Prevents unnecessary re-renders
- **Benefit**: GameCanvas and HUD only re-render when props change
- **Usage**: `export default memo(GameCanvas)`

### 3. useCallback
- **Why**: Memoizes function references
- **Benefit**: Prevents child component re-renders
- **Usage**: All event handlers wrapped in `useCallback`

### 4. useRef for Game State
- **Why**: Refs don't trigger re-renders
- **Benefit**: Game loop can update state without React overhead
- **Usage**: `playerXRef.current`, `obstaclesRef.current`

### 5. Dynamic Imports
- **Why**: Code splitting reduces initial bundle size
- **Benefit**: Faster page load, game code loaded only when needed
- **Usage**: `dynamic(() => import('./GameCanvas'), { ssr: false })`

### 6. Web Workers (Optional)
- **Why**: Offload heavy calculations to separate thread
- **Benefit**: Prevents main thread blocking
- **Usage**: `gameWorker.js` provided for collision detection/score calculation

---

## 🎨 UI/UX Design System

### Color Palette
- **Neon Cyan**: `#00ffff` - Primary accent, text glow
- **Neon Pink**: `#ff00ff` - Obstacles, game over
- **Neon Blue**: `#00bfff` - Secondary accent
- **Background**: `#0a0a0f` - Deep black with purple tints

### Glassmorphism
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### Neon Glow Effects
```css
text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff;
box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
```

### Responsive Breakpoints
- **Mobile**: `< 768px` - Touch controls, stacked layout
- **Tablet**: `768px - 1024px` - Enhanced layout
- **Desktop**: `> 1024px` - Full keyboard controls
- **Ultra-wide**: `> 1920px` - Proper scaling

---

## 🔒 Security Measures

### Password Security
- **Hashing**: bcrypt with 12 rounds (slow, secure)
- **Never stored plaintext**: Always hashed before saving

### JWT Security
- **Secret key**: Stored in environment variable
- **Expiration**: 7 days (configurable)
- **Verification**: Every API call verifies token signature

### Input Validation
- **Client-side**: Zod schemas in forms
- **Server-side**: Zod validation in API routes
- **DOB Validation**: 18+ age requirement

### Score Tampering Prevention
- **Server-side validation**: Score checked against distance/time
- **Max score check**: Prevents impossible scores
- **Rate limiting**: Can be added with express-rate-limit

---

## 📱 Mobile Support

### Touch Controls
- **Swipe left/right**: Moves player car
- **Touch events**: `touchstart`, `touchmove`, `touchend`
- **Prevent scroll**: Canvas prevents default touch behavior

### Responsive Design
- **Viewport meta**: Proper mobile scaling
- **Flexible layouts**: Tailwind responsive classes
- **Touch-friendly**: Large buttons, adequate spacing

---

## 🧪 Testing Recommendations

### Manual Testing Checklist
- [ ] Registration with valid/invalid data
- [ ] Login with correct/incorrect credentials
- [ ] Game playability (60 FPS, no lag)
- [ ] Score submission and best score update
- [ ] Reward eligibility at 10,000 points
- [ ] Admin panel access (admin email only)
- [ ] Mobile touch controls
- [ ] Responsive design (mobile, tablet, desktop)

### Performance Testing
- **Lighthouse**: Run Lighthouse audit for performance
- **Network tab**: Check bundle sizes
- **FPS counter**: Verify 60 FPS during gameplay

---

## 🚀 Deployment Checklist

1. **Environment Variables**: Set all vars in hosting platform
2. **MongoDB**: Use MongoDB Atlas (production-ready)
3. **Build**: `npm run build` (test locally first)
4. **Domain**: Configure custom domain if needed
5. **HTTPS**: Ensure SSL certificate (automatic on Vercel/Netlify)
6. **Admin Email**: Set `ADMIN_EMAIL` to your production email

---

## 📚 Key Technologies Explained

### Next.js App Router
- File-based routing (no `pages/` directory)
- Server Components by default
- API routes in same structure
- Built-in optimizations

### Zustand
- Lightweight state management
- No boilerplate (unlike Redux)
- Perfect for game state
- TypeScript support

### MongoDB + Mongoose
- NoSQL database (flexible schema)
- Mongoose provides schema validation
- Connection pooling (handled in `mongodb.ts`)

### Canvas API
- 2D rendering context
- Hardware-accelerated
- Perfect for games
- Low-level control

---

This architecture is designed for **scalability**, **performance**, and **maintainability**. Each component has a clear responsibility, and the codebase follows Next.js 14+ best practices.

