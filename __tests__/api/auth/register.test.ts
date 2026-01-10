// Mock dependencies before importing
jest.mock('@/lib/mongodb');
jest.mock('@/models/User');
jest.mock('@/lib/auth');
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    json() {
      return Promise.resolve({});
    }
  },
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      json: async () => body,
      status: init?.status || 200,
    }),
  },
}));

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, generateToken } from '@/lib/auth';

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockUserFindOne = jest.fn();
const mockUserCreate = jest.fn();
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

// Properly mock the User model
(User as any).findOne = mockUserFindOne;
(User as any).create = mockUserCreate;

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful DB connection
    mockConnectDB.mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const validRegistrationData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    dob: '1990-01-01',
    verificationQuestion: 'What is your favorite color?',
    verificationAnswer: 'blue',
  };

  const createMockRequest = (body: any): NextRequest => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    // Override json method
    (request as any).json = async () => body;
    return request;
  };

  // Dynamically import the route handler after mocks are set up
  let POST: any;
  beforeAll(async () => {
    // Clear module cache to ensure fresh import with mocks
    jest.resetModules();
    const routeModule = await import('@/app/api/auth/register/route');
    POST = routeModule.POST;
  });

  describe('Successful Registration', () => {
    it('should register a new user successfully', async () => {
      // Mock no existing user
      mockUserFindOne.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashedPassword123');
      mockGenerateToken.mockReturnValue('mockToken123');

      const mockUser = {
        _id: { toString: () => 'userId123' },
        name: 'John Doe',
        email: 'john.doe@example.com',
        bestScore: 0,
        rewardEligible: false,
        save: jest.fn(),
        toJSON: jest.fn(() => ({
          _id: 'userId123',
          name: 'John Doe',
          email: 'john.doe@example.com',
          bestScore: 0,
          rewardEligible: false,
        })),
      };
      mockUserCreate.mockResolvedValue(mockUser as any);

      const request = createMockRequest(validRegistrationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.token).toBe('mockToken123');
      expect(data.user).toMatchObject({
        id: 'userId123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        bestScore: 0,
        rewardEligible: false,
      });
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'john.doe@example.com' });
      expect(mockHashPassword).toHaveBeenCalledTimes(2); // password and verification answer
      expect(mockUserCreate).toHaveBeenCalled();
    });

    it('should lowercase and trim email', async () => {
      mockUserFindOne.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashedPassword123');
      mockGenerateToken.mockReturnValue('mockToken123');

      const mockUser = {
        _id: { toString: () => 'userId123' },
        name: 'John Doe',
        email: 'john.doe@example.com',
        bestScore: 0,
        rewardEligible: false,
        save: jest.fn(),
        toJSON: jest.fn(() => ({
          _id: 'userId123',
          name: 'John Doe',
          email: 'john.doe@example.com',
          bestScore: 0,
          rewardEligible: false,
        })),
      };
      mockUserCreate.mockResolvedValue(mockUser as any);

      const request = createMockRequest({
        ...validRegistrationData,
        email: '  JOHN.DOE@EXAMPLE.COM  ',
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      // Check that email was lowercased in findOne call
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'john.doe@example.com' });
    });
  });

  describe('Validation Errors', () => {
    it('should reject registration with missing name', async () => {
      const request = createMockRequest({
        ...validRegistrationData,
        name: '',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Name must be at least 2 characters');
    });

    it('should reject registration with invalid email', async () => {
      const request = createMockRequest({
        ...validRegistrationData,
        email: 'invalid-email',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid email address');
    });

    it('should reject registration with short password', async () => {
      const request = createMockRequest({
        ...validRegistrationData,
        password: '12345',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Password must be at least 6 characters');
    });

    it('should reject registration with underage user', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() - 17);
      const dob = futureDate.toISOString().split('T')[0];

      const request = createMockRequest({
        ...validRegistrationData,
        dob,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('at least 18 years old');
    });

    it('should reject registration with future date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dob = futureDate.toISOString().split('T')[0];

      const request = createMockRequest({
        ...validRegistrationData,
        dob,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('at least 18 years old');
    });

    it('should reject registration with missing verification question', async () => {
      const request = createMockRequest({
        ...validRegistrationData,
        verificationQuestion: '',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('verification question');
    });

    it('should reject registration with short verification answer', async () => {
      const request = createMockRequest({
        ...validRegistrationData,
        verificationAnswer: 'x',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Verification answer must be at least 2 characters');
    });

    it('should reject registration with empty date of birth', async () => {
      const request = createMockRequest({
        ...validRegistrationData,
        dob: '',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('at least 18 years old');
    });
  });

  describe('Duplicate User', () => {
    it('should reject registration with existing email', async () => {
      mockUserFindOne.mockResolvedValue({
        email: 'john.doe@example.com',
      } as any);

      const request = createMockRequest(validRegistrationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User already exists with this email');
      expect(mockUserCreate).not.toHaveBeenCalled();
    });
  });

  describe('Database Errors', () => {
    it('should handle database connection errors', async () => {
      mockConnectDB.mockRejectedValue(new Error('Connection failed'));

      const request = createMockRequest(validRegistrationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Database connection failed');
    });

    it('should handle MongoDB duplicate key error', async () => {
      mockUserFindOne.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashedPassword123');
      mockUserCreate.mockRejectedValue(new Error('E11000 duplicate key error'));

      const request = createMockRequest(validRegistrationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User already exists with this email');
    });

    it('should handle other MongoDB errors', async () => {
      mockUserFindOne.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashedPassword123');
      mockUserCreate.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(validRegistrationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Database error');
    });
  });

  describe('Invalid JSON', () => {
    it('should handle invalid JSON in request body', async () => {
      const request = {
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON in request body');
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly 18-year-old user', async () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 18);
      date.setMonth(date.getMonth() - 1); // One month before birthday
      const dob = date.toISOString().split('T')[0];

      mockUserFindOne.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashedPassword123');
      mockGenerateToken.mockReturnValue('mockToken123');

      const mockUser = {
        _id: { toString: () => 'userId123' },
        name: 'John Doe',
        email: 'john.doe@example.com',
        bestScore: 0,
        rewardEligible: false,
        save: jest.fn(),
        toJSON: jest.fn(() => ({
          _id: 'userId123',
          name: 'John Doe',
          email: 'john.doe@example.com',
          bestScore: 0,
          rewardEligible: false,
        })),
      };
      mockUserCreate.mockResolvedValue(mockUser as any);

      const request = createMockRequest({
        ...validRegistrationData,
        dob,
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should handle whitespace in fields', async () => {
      mockUserFindOne.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashedPassword123');
      mockGenerateToken.mockReturnValue('mockToken123');

      const mockUser = {
        _id: { toString: () => 'userId123' },
        name: 'John Doe',
        email: 'john.doe@example.com',
        bestScore: 0,
        rewardEligible: false,
        save: jest.fn(),
        toJSON: jest.fn(() => ({
          _id: 'userId123',
          name: 'John Doe',
          email: 'john.doe@example.com',
          bestScore: 0,
          rewardEligible: false,
        })),
      };
      mockUserCreate.mockResolvedValue(mockUser as any);

      const request = createMockRequest({
        name: '  John Doe  ',
        email: '  john.doe@example.com  ',
        password: 'password123',
        dob: '1990-01-01',
        verificationQuestion: '  What is your favorite color?  ',
        verificationAnswer: '  blue  ',
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      // Verify trimming happened (check findOne call)
      expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'john.doe@example.com' });
    });
  });
});

