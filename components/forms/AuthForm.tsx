'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const verificationQuestions = [
  'What is your favorite color?',
  'What city were you born in?',
  'What is your mother\'s maiden name?',
  'What was the name of your first pet?',
  'What is your favorite food?',
  'What is the name of your best friend?',
];

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  dob: z.string().refine(
    (val) => {
      if (!val) return false;
      const date = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        return age - 1 >= 18;
      }
      return age >= 18;
    },
    { message: 'You must be at least 18 years old' }
  ),
  verificationQuestion: z.string().min(1, 'Please select a verification question'),
  verificationAnswer: z.string().min(2, 'Verification answer must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  verificationAnswer: z.string().min(1, 'Verification answer is required'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthForm() {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [emailEntered, setEmailEntered] = useState(false);
  const [colorHue, setColorHue] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setColorHue((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

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

  // Separate form instances for login and register
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const emailValue = isLogin 
    ? (loginForm.watch('email') as string | undefined)
    : (registerForm.watch('email') as string | undefined);

  useEffect(() => {
    if (isLogin && emailValue && emailValue.includes('@')) {
      const fetchQuestion = async () => {
        try {
          const response = await fetch('/api/auth/get-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailValue }),
          });
          if (response.ok) {
            const data = await response.json();
            setUserQuestion(data.question || '');
            setEmailEntered(true);
          } else {
            setUserQuestion('');
            setEmailEntered(false);
          }
        } catch (err) {
          console.error('Error fetching question:', err);
          setUserQuestion('');
          setEmailEntered(false);
        }
      };

      const timeoutId = setTimeout(fetchQuestion, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUserQuestion('');
      setEmailEntered(false);
    }
  }, [emailValue, isLogin]);

  const onSubmit = async (data: RegisterFormData | LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        const loginData = data as LoginFormData;
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginData.email,
            password: loginData.password,
            verificationAnswer: loginData.verificationAnswer,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Login failed');
        }

        if (result.token && result.user) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('user', JSON.stringify(result.user));
          router.push('/play');
        } else {
          throw new Error('Invalid response from server');
        }
      } else {
        const registerData = data as RegisterFormData;
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: registerData.name,
            email: registerData.email,
            password: registerData.password,
            dob: registerData.dob,
            verificationQuestion: registerData.verificationQuestion,
            verificationAnswer: registerData.verificationAnswer,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Registration failed');
        }

        if (result.token && result.user) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('user', JSON.stringify(result.user));
          router.push('/play');
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    registerForm.reset();
    loginForm.reset();
    setUserQuestion('');
    setEmailEntered(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="glow-border">
        <div className="text-center mb-8">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-2"
            style={{
              color: hslToRgb(colorHue, 1, 0.8),
              textShadow: `0 0 20px ${hslToRgb(colorHue, 1, 0.5)}, 0 0 40px ${hslToRgb((colorHue + 60) % 360, 1, 0.5)}`,
            }}
            animate={{
              textShadow: [
                `0 0 20px ${hslToRgb(colorHue, 1, 0.5)}, 0 0 40px ${hslToRgb((colorHue + 60) % 360, 1, 0.5)}`,
                `0 0 30px ${hslToRgb((colorHue + 30) % 360, 1, 0.6)}, 0 0 50px ${hslToRgb((colorHue + 90) % 360, 1, 0.6)}`,
                `0 0 20px ${hslToRgb(colorHue, 1, 0.5)}, 0 0 40px ${hslToRgb((colorHue + 60) % 360, 1, 0.5)}`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {isLogin ? 'Welcome Back' : 'Join the Race'}
          </motion.h2>
          <p className="text-gray-400">
            {isLogin ? 'Login to continue your racing journey' : 'Create your account to start racing'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={isLogin ? loginForm.handleSubmit(onSubmit) : registerForm.handleSubmit(onSubmit)} className="space-y-5">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Enter your full name"
                  {...registerForm.register('name')}
                  error={registerForm.formState.errors.name?.message}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            {...(isLogin ? loginForm.register('email') : registerForm.register('email'))}
            error={isLogin ? loginForm.formState.errors.email?.message : registerForm.formState.errors.email?.message}
          />

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="dob"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Input
                  label="Date of Birth"
                  type="date"
                  {...registerForm.register('dob')}
                  error={registerForm.formState.errors.dob?.message}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {isLogin ? (
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Verification Question
              </label>
              <div className={`
                w-full px-4 py-3 rounded-lg
                glass border border-cyan-500/30
                bg-black/30 text-white
                min-h-[48px] flex items-center
                ${!emailEntered ? 'text-gray-500' : ''}
              `}
              style={{
                borderColor: emailEntered ? hslToRgb((colorHue + 120) % 360, 1, 0.5) : undefined,
                color: emailEntered ? hslToRgb((colorHue + 120) % 360, 1, 0.8) : undefined,
              }}
              >
                {emailEntered ? (
                  userQuestion || 'Enter your email to see your question'
                ) : (
                  'Enter your email to see your verification question'
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Verification Question
              </label>
              <select
                {...registerForm.register('verificationQuestion')}
                className={`
                  w-full px-4 py-3 rounded-lg
                  glass border border-cyan-500/30
                  bg-black/30 text-white
                  focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50
                  transition-all duration-300
                  ${registerForm.formState.errors.verificationQuestion ? 'border-red-500' : ''}
                `}
              >
                <option value="">Select a question</option>
                {verificationQuestions.map((q, idx) => (
                  <option key={idx} value={q}>
                    {q}
                  </option>
                ))}
              </select>
              {registerForm.formState.errors.verificationQuestion && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{registerForm.formState.errors.verificationQuestion.message}</span>
                </p>
              )}
            </div>
          )}

          <Input
            label="Verification Answer"
            type="text"
            placeholder="Your answer"
            {...(isLogin ? loginForm.register('verificationAnswer') : registerForm.register('verificationAnswer'))}
            error={isLogin ? loginForm.formState.errors.verificationAnswer?.message : registerForm.formState.errors.verificationAnswer?.message}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...(isLogin ? loginForm.register('password') : registerForm.register('password'))}
            error={isLogin ? loginForm.formState.errors.password?.message : registerForm.formState.errors.password?.message}
          />

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="confirmPassword"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  {...registerForm.register('confirmPassword')}
                  error={registerForm.formState.errors.confirmPassword?.message}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Button type="submit" isLoading={isLoading} className="w-full text-lg py-4">
            {isLogin ? '🚀 Login' : '🏁 Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-200"
          >
            {isLogin ? (
              <>
                Don&apos;t have an account? <span className="text-cyan-400 font-semibold underline">Register</span>
              </>
            ) : (
              <>
                Already have an account? <span className="text-cyan-400 font-semibold underline">Login</span>
              </>
            )}
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
