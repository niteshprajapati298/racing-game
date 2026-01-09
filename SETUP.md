# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Set Up Environment Variables

**IMPORTANT**: Create a `.env.local` file in the root directory. This file is required for the application to work!

Create `.env.local` with the following content:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/racing-game
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/racing-game

# JWT Secret (generate a random string - REQUIRED)
JWT_SECRET=your-jwt-secret-key-change-this-in-production

# Admin Email (set this to your email to access admin panel)
ADMIN_EMAIL=admin@racinggame.com
```

**Note**: If you don't create this file, you'll get errors when trying to register or login!

**Important**: 
- Replace `your-secret-key-change-this-in-production` with a secure random string
- Set `ADMIN_EMAIL` to the email you'll use for admin access
- For MongoDB Atlas, replace the connection string with your actual credentials

## Step 3: Start MongoDB

### Local MongoDB:
```bash
# macOS/Linux
mongod

# Windows
# Start MongoDB service from Services panel
```

### MongoDB Atlas:
- No local setup needed, just use the connection string in `.env.local`

## Step 4: Run the Development Server

```bash
npm run dev
```

## Step 5: Open Your Browser

Navigate to: `http://localhost:3000`

## Step 6: Create Your First Account

1. Click "Register"
2. Enter your email, password, and date of birth (must be 18+)
3. You'll be automatically logged in and redirected to the game

## Step 7: Access Admin Panel

1. Make sure your email matches `ADMIN_EMAIL` in `.env.local`
2. Login with that email
3. Navigate to `/admin` to see the admin panel

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running (check with `mongosh` or MongoDB Compass)
- Verify `MONGODB_URI` is correct in `.env.local`
- For Atlas, check network access and credentials

### Port Already in Use
- Change the port: `npm run dev -- -p 3001`
- Or kill the process using port 3000

### Build Errors
- Delete `.next` folder and `node_modules`
- Run `npm install` again
- Run `npm run dev`

## Production Deployment

1. Set all environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Build the project: `npm run build`
3. Start production server: `npm start`

For Vercel:
- Push to GitHub
- Import project in Vercel
- Add environment variables in Vercel dashboard
- Deploy!

