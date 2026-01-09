import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Score from '@/models/Score';
import { REWARD_SCORE_THRESHOLD } from '@/lib/constants';
import { z } from 'zod';

const scoreSchema = z.object({
  score: z.number().min(0),
  distance: z.number().min(0),
  time: z.number().min(0),
  speed: z.number().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = scoreSchema.parse(body);

    await connectDB();

    // Verify user exists
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Server-side validation: prevent score tampering
    // Basic checks - in production, add more sophisticated validation
    const maxPossibleScore = validatedData.distance * 10 + validatedData.time * 100;
    if (validatedData.score > maxPossibleScore * 1.5) {
      return NextResponse.json(
        { error: 'Invalid score' },
        { status: 400 }
      );
    }

    // Save score record
    await Score.create({
      userId: user._id,
      score: validatedData.score,
      distance: validatedData.distance,
      time: validatedData.time,
      speed: validatedData.speed,
    });

    // Update user's best score
    let rewardEligible = user.rewardEligible;
    if (validatedData.score > user.bestScore) {
      user.bestScore = validatedData.score;
      
      // Check if user reaches reward threshold
      if (validatedData.score >= REWARD_SCORE_THRESHOLD && !user.rewardEligible) {
        user.rewardEligible = true;
        rewardEligible = true;
      }
      
      await user.save();
    }

    return NextResponse.json({
      success: true,
      bestScore: user.bestScore,
      rewardEligible,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Score submission error:', error);
    return NextResponse.json(
      { error: 'Failed to save score' },
      { status: 500 }
    );
  }
}

