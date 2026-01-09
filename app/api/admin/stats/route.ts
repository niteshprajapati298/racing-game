import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Score from '@/models/Score';
import { ADMIN_EMAIL } from '@/lib/constants';

async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = getTokenFromRequest(request);
  if (!token) return false;

  const payload = verifyToken(token);
  if (!payload) return false;

  return payload.email === ADMIN_EMAIL;
}

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get statistics
    const totalUsers = await User.countDocuments();
    const totalScores = await Score.countDocuments();
    const rewardEligibleUsers = await User.countDocuments({ rewardEligible: true });
    
    const avgBestScore = await User.aggregate([
      { $group: { _id: null, avg: { $avg: '$bestScore' } } },
    ]);

    const topScore = await User.findOne().sort({ bestScore: -1 }).select('bestScore email name').lean() as { bestScore?: number; email?: string; name?: string } | null;

    const recentScores = await Score.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'email name')
      .lean();

    return NextResponse.json({
      stats: {
        totalUsers,
        totalScores,
        rewardEligibleUsers,
        averageBestScore: Math.round(avgBestScore[0]?.avg || 0),
        topScore: (topScore?.bestScore as number) || 0,
        topScoreUser: (topScore?.email as string) || 'N/A',
      },
      recentScores: (recentScores as any[]).map((score: any) => ({
        id: score._id?.toString() || '',
        userId: score.userId,
        score: score.score || 0,
        distance: score.distance || 0,
        time: score.time || 0,
        createdAt: score.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

