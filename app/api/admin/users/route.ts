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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'bestScore';
    const order = searchParams.get('order') || 'desc';

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    if (sortBy === 'bestScore' || sortBy === 'createdAt') {
      sort[sortBy] = sortOrder;
    } else {
      sort.bestScore = -1;
    }

    // Fetch users with pagination
    const users = await User.find()
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await User.countDocuments();

    // Get score statistics for each user
    const usersWithStats = await Promise.all(
      (users as any[]).map(async (user: any) => {
        const scoreCount = await Score.countDocuments({ userId: user._id });
        const totalScore = await Score.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, total: { $sum: '$score' } } },
        ]);

        return {
          ...user,
          id: user._id?.toString() || '',
          _id: undefined,
          scoreCount,
          totalScore: totalScore[0]?.total || 0,
        };
      })
    );

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

