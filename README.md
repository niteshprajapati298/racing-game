# 🏎️ Futuristic Racing Game

A high-performance, futuristic web racing game built with Next.js 14, TypeScript, and the MERN stack. Features beautiful neon UI, smooth 60 FPS gameplay, and a complete authentication system.

## 🚀 Features

### Core Features
- **Authentication System**: Secure email/password registration with DOB validation (18+)
- **High-Performance Racing Game**: Canvas-based racing with 60 FPS target
- **Score System**: Real-time scoring with MongoDB persistence
- **Reward System**: Automatic eligibility tracking for high scores
- **Admin Panel**: Cute admin interface to view user scores and statistics
- **Responsive Design**: Works perfectly on mobile, tablet, desktop, and ultra-wide screens

### UI/UX Features
- **Futuristic Design**: Neon gradients, glassmorphism, glow effects
- **Smooth Animations**: Framer Motion for fluid transitions
- **Zero Layout Shifts**: Optimized rendering for stable UI
- **Touch Controls**: Full mobile support with touch gestures
- **Keyboard Controls**: Arrow keys or WASD for desktop

## 📁 Project Structure

```
racing-game/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes
│   │   ├── login/
│   │   │   └── page.tsx         # Login page
│   │   └── register/
│   │       └── page.tsx         # Registration page
│   ├── (game)/                  # Game routes
│   │   └── play/
│   │       ├── page.tsx         # Main game page
│   │       ├── GameCanvas.tsx   # Game engine (Canvas)
│   │       └── HUD.tsx          # Heads-up display
│   ├── (admin)/                 # Admin routes
│   │   └── admin/
│   │       └── page.tsx         # Admin panel
│   ├── api/                     # API routes
│   │   ├── auth/                # Authentication endpoints
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── verify/
│   │   ├── score/               # Score submission
│   │   │   └── submit/
│   │   ├── user/                # User profile
│   │   │   └── profile/
│   │   └── admin/               # Admin endpoints
│   │       ├── users/
│   │       └── stats/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── forms/                   # Form components
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
├── lib/                         # Utility libraries
│   ├── mongodb.ts               # MongoDB connection
│   ├── auth.ts                  # JWT/auth utilities
│   └── constants.ts             # Game constants
├── models/                      # MongoDB models
│   ├── User.ts                  # User schema
│   └── Score.ts                 # Score schema
├── store/                       # State management
│   └── gameStore.ts             # Zustand game store
└── public/
    └── gameWorker.js            # Web Worker for calculations
```

## 🎮 Game Loop Logic

The game uses `requestAnimationFrame` for smooth 60 FPS rendering:

1. **Input Handling**: Keyboard and touch events update player position
2. **Game State Update**: 
   - Player movement based on input
   - Obstacle spawning and movement
   - Road animation offset
   - Score calculation (distance × multiplier + time bonus)
3. **Collision Detection**: AABB (Axis-Aligned Bounding Box) collision between player and obstacles
4. **Rendering**: Canvas draws road, obstacles, and player car with neon effects
5. **State Sync**: Zustand store updates for HUD display

### Performance Optimizations

- **requestAnimationFrame**: Synchronized with browser refresh rate (60 FPS)
- **Memoization**: React.memo for GameCanvas and HUD components
- **Dynamic Imports**: Game components loaded only when needed
- **Web Workers**: Heavy calculations can be offloaded (gameWorker.js provided)
- **Refs for State**: Game loop uses refs to avoid re-renders
- **Canvas Optimization**: Efficient drawing with gradients and shadows

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/racing-game
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/racing-game

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
JWT_SECRET=your-jwt-secret-key-change-this-in-production
ADMIN_EMAIL=admin@racinggame.com
```

3. **Start MongoDB** (if using local):
```bash
# macOS/Linux
mongod

# Windows
# Start MongoDB service or run mongod.exe
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to `http://localhost:3000`

## 🎯 How to Play

1. **Register/Login**: Create an account with email, password, and date of birth (must be 18+)
2. **Start Game**: Click "Start Game" on the play page
3. **Controls**:
   - **Desktop**: Arrow keys or A/D to move left/right
   - **Mobile**: Swipe left/right on screen
4. **Objective**: Avoid obstacles and survive as long as possible
5. **Scoring**: Score increases with distance traveled and time survived
6. **Rewards**: Reach 10,000 points to become eligible for rewards!

## 🔐 Authentication Flow

1. User registers with email, password, and DOB
2. Password is hashed with bcrypt (12 rounds)
3. JWT token generated and stored in localStorage
4. Token verified on protected routes
5. User data persisted in MongoDB

## 📊 Score & Rewards System

### Score Calculation
- Base score: `distance × 10 + time × 100`
- Speed increases over time
- Best score saved to user profile

### Reward Eligibility
- Threshold: **10,000 points**
- Automatically marked as `rewardEligible: true` in database
- Backend API ready for email reward system integration

### Extending Rewards System

To add email rewards:

1. **Update `/app/api/score/submit/route.ts`**:
```typescript
if (user.rewardEligible && !user.rewardEmailSent) {
  // Send email via your email service (SendGrid, Resend, etc.)
  await sendRewardEmail(user.email);
  user.rewardEmailSent = true;
  await user.save();
}
```

2. **Add email service** (e.g., Resend, SendGrid):
```bash
npm install resend
```

3. **Create email template** in `/lib/email.ts`

## 👨‍💼 Admin Panel

Access the admin panel at `/admin` (requires admin email from `.env.local`).

**Features:**
- View all users with scores
- Statistics dashboard
- Pagination for large user lists
- Sort by best score
- See reward-eligible users

**Admin Access:**
- Set `ADMIN_EMAIL` in `.env.local` to your admin email
- Login with that email to access admin panel

## 🚀 Performance Optimizations Explained

### 1. **requestAnimationFrame**
- Synchronizes with browser's refresh rate
- Automatically pauses when tab is inactive
- Provides smooth 60 FPS rendering

### 2. **Memoization**
- `React.memo` prevents unnecessary re-renders
- Callbacks wrapped with `useCallback`
- Refs used for game state to avoid React updates

### 3. **Dynamic Imports**
- Game components loaded only when needed
- Reduces initial bundle size
- Improves Time to Interactive (TTI)

### 4. **Web Workers**
- `gameWorker.js` provided for heavy calculations
- Can offload collision detection and score calculations
- Prevents main thread blocking

### 5. **Canvas Optimization**
- Efficient drawing with gradients cached
- Minimal redraws (only changed elements)
- Hardware-accelerated rendering

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animations)
- **Zustand** (state management)
- **React Hook Form + Zod** (forms & validation)

### Backend
- **Next.js API Routes**
- **MongoDB + Mongoose**
- **JWT** (authentication)
- **bcryptjs** (password hashing)

### Game Engine
- **HTML5 Canvas API**
- **requestAnimationFrame**

## 📝 Database Schema

### User Model
```typescript
{
  email: string (unique, required)
  password: string (hashed, required)
  dob: Date (required, 18+ validation)
  bestScore: number (default: 0)
  rewardEligible: boolean (default: false)
  createdAt: Date
  updatedAt: Date
}
```

### Score Model
```typescript
{
  userId: ObjectId (ref: User)
  score: number (required)
  distance: number (required)
  time: number (required)
  speed: number (required)
  createdAt: Date
}
```

## 🔒 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Input validation with Zod
- Server-side score verification
- Protected API routes
- DOB validation (18+ requirement)

## 📱 Responsive Design

- **Mobile**: Touch controls, optimized UI
- **Tablet**: Enhanced layout
- **Desktop**: Full keyboard controls
- **Ultra-wide**: Proper scaling and layout

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env.local`
- Verify network access for Atlas

### Game Performance Issues
- Check browser console for errors
- Ensure hardware acceleration is enabled
- Close other heavy applications

### Authentication Issues
- Clear localStorage and try again
- Check JWT_SECRET is set
- Verify token expiration

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**

#   r a c i n g - g a m e  
 