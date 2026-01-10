import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, generateToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().min(1, 'Email is required').trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  dob: z.string().min(1, 'Date of birth is required').trim().refine(
    (val) => {
      if (!val || val.trim() === '') return false;
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      // Check if date is not in the future
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      if (date > today) return false;
      // Check age (must be 18+)
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        return age - 1 >= 18;
      }
      return age >= 18;
    },
    { message: 'You must be at least 18 years old and provide a valid date' }
  ),
  verificationQuestion: z.string().min(1, 'Please select a verification question').trim(),
  verificationAnswer: z.string().min(1, 'Verification answer is required').trim().min(2, 'Verification answer must be at least 2 characters'),
}).transform((data) => ({
  ...data,
  email: data.email.toLowerCase().trim(),
  name: data.name.trim(),
  verificationQuestion: data.verificationQuestion.trim(),
  verificationAnswer: data.verificationAnswer.trim(),
}));

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
    
    console.log('Registration request received:', { email: body.email, hasName: !!body.name });
    
    // Validate input
    const validatedData = registerSchema.parse(body);
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

    // Check if user already exists (email is already lowercased in schema)
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password and verification answer (data is already trimmed and lowercased by schema transform)
    const hashedPassword = await hashPassword(validatedData.password);
    const hashedVerificationAnswer = await hashPassword(validatedData.verificationAnswer.toLowerCase());

    // Create user
    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      dob: new Date(validatedData.dob),
      verificationQuestion: validatedData.verificationQuestion,
      verificationAnswer: hashedVerificationAnswer,
      bestScore: 0,
      rewardEligible: false,
    });

    console.log('User created successfully:', user.email);

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return NextResponse.json(
      {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          bestScore: user.bestScore,
          rewardEligible: user.rewardEligible,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      // Return all validation errors for better debugging
      const errorMessages = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      }).join(', ');
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        { error: errorMessages || 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Check for MongoDB duplicate key error
      if (error.message.includes('E11000') || error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'User already exists with this email' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message || 'Registration failed. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
