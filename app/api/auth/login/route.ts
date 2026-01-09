import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword, generateToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  verificationAnswer: z.string().min(1, 'Verification answer is required'),
});

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    console.log('Login request received:', { email: body.email });
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    console.log('Validation passed');

    // Connect to database
    try {
      await connectDB();
      console.log('Database connected');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please check your MongoDB configuration.' },
        { status: 500 }
      );
    }

    // Find user
    const user = await User.findOne({ email: validatedData.email.toLowerCase().trim() });
    if (!user) {
      console.log('User not found:', validatedData.email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('User found:', user.email);

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify verification answer
    const isValidVerification = await verifyPassword(
      validatedData.verificationAnswer.toLowerCase().trim(),
      user.verificationAnswer
    );
    if (!isValidVerification) {
      console.log('Invalid verification answer');
      return NextResponse.json(
        { error: 'Incorrect verification answer' },
        { status: 401 }
      );
    }

    console.log('Login successful');

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        bestScore: user.bestScore,
        rewardEligible: user.rewardEligible,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0]?.message || 'Validation failed';
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Login failed. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
